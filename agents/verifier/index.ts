/**
 * Verifier Agent
 *
 * Applies patches, deploys to Vercel, and verifies fixes work.
 * Re-runs the failing test to confirm the bug is fixed.
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

export class VerifierAgent implements IVerifierAgent {
  private projectRoot: string;
  private testerAgent: TesterAgent;
  private vercelToken: string | undefined;
  private vercelProjectId: string | undefined;
  private useRedis: boolean = true;
  private currentFailureReport?: FailureReport;

  constructor(projectRoot: string = process.cwd(), useRedis: boolean = true) {
    this.projectRoot = projectRoot;
    this.testerAgent = new TesterAgent();
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.vercelProjectId = process.env.VERCEL_PROJECT_ID;
    this.useRedis = useRedis;
  }

  /**
   * Set the current failure report for learning
   */
  setFailureReport(failure: FailureReport): void {
    this.currentFailureReport = failure;
  }

  /**
   * Verify a patch by applying it, deploying, and re-running tests
   */
  async verify(patch: Patch, testSpec: TestSpec): Promise<VerificationResult> {
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
        await this.testerAgent.init();
        const testResult = await this.testerAgent.runTest({
          ...testSpec,
          url: testSpec.url.replace(
            /https?:\/\/[^/]+/,
            deploymentUrl || 'http://localhost:3000'
          ),
        });
        await this.testerAgent.close();

        // 6. If test passes, keep the fix. If not, restore.
        if (testResult.passed) {
          // Clean up backup
          this.cleanupBackup(backupPath);

          // Store successful fix in knowledge base for learning
          await this.recordFixInKnowledgeBase(patch, true);

          return {
            success: true,
            deploymentUrl,
            testResult,
          };
        } else {
          await this.restoreFile(patch.file, backupPath);

          // Store failed fix attempt for learning
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
        return false;
      }

      // Apply the patch
      const lines = sourceCode.split('\n');
      const beforeLines = lines.slice(0, startLine - 1);
      const afterLines = lines.slice(startLine - 1 + removeCount);

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
      // Run TypeScript type check on the specific file
      execSync(`npx tsc --noEmit ${path.join(this.projectRoot, filePath)}`, {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
      return true;
    } catch {
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
      const commitMessage = `fix: ${patch.description}\n\nApplied by PatchPilot`;
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
