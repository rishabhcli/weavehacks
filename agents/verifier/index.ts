/**
 * Verifier Agent
 *
 * Applies patches, deploys to Vercel, and verifies fixes work.
 * Re-runs the failing test to confirm the bug is fixed.
 *
 * Instrumented with W&B Weave for observability.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type {
  Patch,
  TestSpec,
  VerificationResult,
  DeploymentStatus,
  FailureReport,
  VerifierAgent as IVerifierAgent,
} from '@/lib/types';
import { TesterAgent } from '@/agents/tester';
import { getKnowledgeBase, isRedisAvailable } from '@/lib/redis';
import { op, isWeaveEnabled } from '@/lib/weave';

export class VerifierAgent implements IVerifierAgent {
  private projectRoot: string;
  private testerAgent: TesterAgent | null = null;
  private ownsTesterAgent: boolean = false;
  private vercelToken: string | undefined;
  private vercelProjectId: string | undefined;
  private useRedis: boolean = true;
  private currentFailureReport?: FailureReport;

  constructor(projectRoot: string = process.cwd(), useRedis: boolean = true) {
    this.projectRoot = projectRoot;
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.vercelProjectId = process.env.VERCEL_PROJECT_ID;
    this.useRedis = useRedis;
  }

  /**
   * Set an external tester agent to reuse (avoids concurrent session limits)
   */
  setTesterAgent(tester: TesterAgent): void {
    this.testerAgent = tester;
    this.ownsTesterAgent = false;
  }

  /**
   * Set the current failure report for learning
   */
  setFailureReport(failure: FailureReport): void {
    this.currentFailureReport = failure;
  }

  /**
   * Verify a patch by applying it, deploying, and re-running tests
   * Traced by W&B Weave for observability
   */
  verify = isWeaveEnabled()
    ? op(this._verify.bind(this), { name: 'VerifierAgent.verify' })
    : this._verify.bind(this);

  private async _verify(patch: Patch, testSpec: TestSpec): Promise<VerificationResult> {
    try {
      // 1. Create a backup of the original file
      const backupPath = await this.backupFile(patch.file);

      try {
        // 2. Apply the patch
        const applied = await this.applyPatch(patch);
        if (!applied) {
          return {
            success: false,
            error: 'Failed to apply patch',
          };
        }

        // 3. Run local validation (syntax check)
        const syntaxValid = await this.validateSyntax(patch.file);
        if (!syntaxValid) {
          await this.restoreFile(patch.file, backupPath);
          return {
            success: false,
            error: 'Patch introduces syntax errors',
          };
        }

        // 4. Commit and deploy (if Vercel is configured)
        let deploymentUrl: string | undefined;
        if (this.vercelToken && this.vercelProjectId) {
          const deployment = await this.deploy(patch);
          if (deployment.state === 'ERROR') {
            await this.restoreFile(patch.file, backupPath);
            return {
              success: false,
              error: `Deployment failed: ${deployment.error}`,
            };
          }
          deploymentUrl = deployment.url;
        } else {
          // Use local dev server URL
          deploymentUrl = process.env.TARGET_URL || 'http://localhost:3000';
        }

        // 5. Re-run the failing test
        // Use shared tester if available, otherwise create our own
        const needsOwnTester = !this.testerAgent;
        if (needsOwnTester) {
          this.testerAgent = new TesterAgent();
          this.ownsTesterAgent = true;
          await this.testerAgent.init();
        }

        const testResult = await this.testerAgent!.runTest({
          ...testSpec,
          url: testSpec.url.replace(
            /https?:\/\/[^/]+/,
            deploymentUrl || 'http://localhost:3000'
          ),
        });

        // Only close if we created our own tester
        if (this.ownsTesterAgent && this.testerAgent) {
          await this.testerAgent.close();
          this.testerAgent = null;
        }

        // 6. Record fix and return result
        // IMPORTANT: Don't restore files when tests fail - patches should accumulate
        // so multiple bugs in the same flow can be fixed together.
        // The orchestrator will handle final verification.
        this.cleanupBackup(backupPath);

        if (testResult.passed) {
          // Store successful fix in knowledge base for learning
          await this.recordFixInKnowledgeBase(patch, true);

          return {
            success: true,
            deploymentUrl,
            testResult,
          };
        } else {
          // Store the fix attempt - don't restore, keep the patch applied
          await this.recordFixInKnowledgeBase(patch, false);

          return {
            success: false,
            deploymentUrl,
            testResult,
            error: 'Test still fails after applying patch',
          };
        }
      } catch (error) {
        // Restore on any error
        await this.restoreFile(patch.file, backupPath);
        throw error;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Apply a patch to the filesystem
   */
  private async applyPatch(patch: Patch): Promise<boolean> {
    try {
      const fullPath = path.join(this.projectRoot, patch.file);
      const sourceCode = fs.readFileSync(fullPath, 'utf-8');

      // Parse the diff to get the change details
      const diffLines = patch.diff.split('\n');
      const addedLines: string[] = [];
      let startLine = 0;
      let removeCount = 0;

      for (const line of diffLines) {
        if (line.startsWith('@@')) {
          const match = line.match(/@@ -(\d+),(\d+)/);
          if (match) {
            startLine = parseInt(match[1], 10);
            removeCount = parseInt(match[2], 10);
          }
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
          addedLines.push(line.slice(1));
        }
      }

      if (startLine === 0) {
        console.log('Patch parse failed: no start line found in diff');
        return false;
      }

      // Apply the patch
      const lines = sourceCode.split('\n');
      const beforeLines = lines.slice(0, startLine - 1);
      const afterLines = lines.slice(startLine - 1 + removeCount);

      console.log(`Applying patch to ${patch.file}: replacing lines ${startLine}-${startLine + removeCount - 1} with ${addedLines.length} new lines`);

      const newContent = [...beforeLines, ...addedLines, ...afterLines].join('\n');
      fs.writeFileSync(fullPath, newContent, 'utf-8');

      return true;
    } catch (error) {
      console.error('Failed to apply patch:', error);
      return false;
    }
  }

  /**
   * Create a backup of a file
   */
  private async backupFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.projectRoot, filePath);
    const backupPath = `${fullPath}.backup.${Date.now()}`;
    fs.copyFileSync(fullPath, backupPath);
    return backupPath;
  }

  /**
   * Restore a file from backup
   */
  private async restoreFile(filePath: string, backupPath: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, filePath);
    fs.copyFileSync(backupPath, fullPath);
    this.cleanupBackup(backupPath);
  }

  /**
   * Clean up a backup file
   */
  private cleanupBackup(backupPath: string): void {
    try {
      fs.unlinkSync(backupPath);
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Validate syntax by attempting to compile
   */
  private async validateSyntax(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Basic bracket balance check
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;

      if (openBraces !== closeBraces) {
        console.log(`Syntax error in ${filePath}: unbalanced braces (${openBraces} open, ${closeBraces} close)`);
        return false;
      }
      if (openParens !== closeParens) {
        console.log(`Syntax error in ${filePath}: unbalanced parentheses (${openParens} open, ${closeParens} close)`);
        return false;
      }
      if (openBrackets !== closeBrackets) {
        console.log(`Syntax error in ${filePath}: unbalanced brackets (${openBrackets} open, ${closeBrackets} close)`);
        return false;
      }

      // Try to run TypeScript check using project config
      try {
        // Use project's tsconfig to ensure JSX and other settings are applied
        execSync(`npx tsc --noEmit --project tsconfig.json 2>&1`, {
          cwd: this.projectRoot,
          stdio: 'pipe',
        });
      } catch (error) {
        // Log TypeScript output for debugging but check if it's a syntax error
        if (error instanceof Error && 'stdout' in error) {
          const stdout = (error as { stdout?: Buffer }).stdout;
          if (stdout) {
            const output = stdout.toString();
            // Filter out npm warnings and unrelated files
            const filteredOutput = output
              .split('\n')
              .filter((line) =>
                !line.includes('npm warn') &&
                !line.includes('npm WARN') &&
                line.includes(filePath))
              .join('\n')
              .trim();

            // Only fail on actual syntax errors (TS1xxxx and TS17xxx are parse/JSX errors)
            if (filteredOutput.includes('error TS1') || filteredOutput.includes('error TS17')) {
              console.log(`Syntax error in ${filePath}:`, filteredOutput.slice(0, 300));
              return false;
            }
            // Type errors are OK - the patch might be syntactically correct but have type issues
            if (filteredOutput.length > 0) {
              console.log(`TypeScript type errors in ${filePath} (allowing):`, filteredOutput.slice(0, 200));
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to validate syntax for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Deploy to Vercel
   */
  private async deploy(patch: Patch): Promise<DeploymentStatus> {
    if (!this.vercelToken || !this.vercelProjectId) {
      return {
        state: 'ERROR',
        error: 'Vercel credentials not configured',
      };
    }

    try {
      // 1. Commit the change
      const commitMessage = `fix: ${patch.description}\n\nApplied by QAgent`;
      execSync(`git add ${patch.file}`, { cwd: this.projectRoot, stdio: 'pipe' });
      execSync(`git commit -m "${commitMessage}"`, {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      // 2. Push to trigger Vercel deployment
      execSync('git push', { cwd: this.projectRoot, stdio: 'pipe' });

      // 3. Wait for deployment
      const deploymentUrl = await this.waitForDeployment();

      return {
        state: 'READY',
        url: deploymentUrl,
      };
    } catch (error) {
      return {
        state: 'ERROR',
        error: error instanceof Error ? error.message : 'Deployment failed',
      };
    }
  }

  /**
   * Wait for Vercel deployment to complete
   */
  private async waitForDeployment(): Promise<string> {
    const maxAttempts = 60; // 5 minutes max
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(
          `https://api.vercel.com/v6/deployments?projectId=${this.vercelProjectId}&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${this.vercelToken}`,
            },
          }
        );

        const data = await response.json();
        const deployment = data.deployments?.[0];

        if (deployment?.state === 'READY') {
          return `https://${deployment.url}`;
        }

        if (deployment?.state === 'ERROR') {
          throw new Error('Deployment failed');
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Deployment timed out');
  }

  /**
   * Record a fix attempt in the knowledge base for learning
   */
  private async recordFixInKnowledgeBase(patch: Patch, success: boolean): Promise<void> {
    if (!this.useRedis || !this.currentFailureReport) {
      return;
    }

    try {
      const available = await isRedisAvailable();
      if (!available) {
        console.log('Redis not available, skipping knowledge base update');
        return;
      }

      const kb = getKnowledgeBase();
      await kb.init();

      // Store the failure with its fix
      const failureId = await kb.storeFailure(this.currentFailureReport, patch, success);

      if (success) {
        console.log(`Stored successful fix in knowledge base: ${failureId}`);
      } else {
        console.log(`Stored failed fix attempt in knowledge base: ${failureId}`);
      }
    } catch (error) {
      console.error('Error recording fix in knowledge base:', error);
    }
  }
}

export default VerifierAgent;
