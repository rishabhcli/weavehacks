/**
 * Orchestrator
 *
 * Coordinates the PatchPilot loop:
 * Tester → Triage → Fixer → Verifier → (repeat if needed)
 *
 * Implements the core self-healing QA agent workflow.
 */

import type {
  OrchestratorConfig,
  OrchestratorResult,
  TestSpec,
  Patch,
  Orchestrator as IOrchestrator,
} from '@/lib/types';
import { TesterAgent } from '@/agents/tester';
import { TriageAgent } from '@/agents/triage';
import { FixerAgent } from '@/agents/fixer';
import { VerifierAgent } from '@/agents/verifier';

interface IterationResult {
  testId: string;
  iteration: number;
  testerPassed: boolean;
  triageDiagnosis?: string;
  fixerPatch?: Patch;
  verifierPassed?: boolean;
  error?: string;
}

export class Orchestrator implements IOrchestrator {
  private testerAgent: TesterAgent;
  private triageAgent: TriageAgent;
  private fixerAgent: FixerAgent;
  private verifierAgent: VerifierAgent;

  constructor(projectRoot: string = process.cwd()) {
    this.testerAgent = new TesterAgent();
    this.triageAgent = new TriageAgent(projectRoot);
    this.fixerAgent = new FixerAgent(projectRoot);
    this.verifierAgent = new VerifierAgent(projectRoot);
  }

  /**
   * Run the complete PatchPilot loop
   */
  async run(config: OrchestratorConfig): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const allPatches: Patch[] = [];
    let totalIterations = 0;

    console.log('\n🚀 PatchPilot Starting\n');
    console.log(`📋 Tests to run: ${config.testSpecs.length}`);
    console.log(`🔄 Max iterations: ${config.maxIterations}`);
    console.log(`🎯 Target: ${config.targetUrl}\n`);

    try {
      // Initialize tester agent
      await this.testerAgent.init();

      // Process each test spec
      for (const testSpec of config.testSpecs) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📝 Test: ${testSpec.name} (${testSpec.id})`);
        console.log('='.repeat(60));

        // Update test URL to target
        const spec: TestSpec = {
          ...testSpec,
          url: testSpec.url.replace(/https?:\/\/[^/]+/, config.targetUrl),
        };

        // Run the fix loop for this test
        const result = await this.runFixLoop(spec, config.maxIterations);

        totalIterations += result.iterations;
        if (result.patches.length > 0) {
          allPatches.push(...result.patches);
        }

        if (!result.success) {
          console.log(`\n❌ Test ${testSpec.id} could not be fixed after ${result.iterations} iterations`);
        } else {
          console.log(`\n✅ Test ${testSpec.id} passing after ${result.iterations} iteration(s)`);
        }
      }

      // Run final test suite to confirm all fixes
      console.log('\n' + '='.repeat(60));
      console.log('🔍 Final Verification');
      console.log('='.repeat(60));

      const finalResults = await this.runAllTests(config.testSpecs, config.targetUrl);
      const allPassed = finalResults.every((r) => r.passed);

      // Clean up
      await this.testerAgent.close();

      const totalDuration = Date.now() - startTime;

      // Print summary
      this.printSummary({
        success: allPassed,
        iterations: totalIterations,
        patches: allPatches,
        duration: totalDuration,
        testCount: config.testSpecs.length,
        passCount: finalResults.filter((r) => r.passed).length,
      });

      // Convert last result to TestResult format
      const lastResult = finalResults[finalResults.length - 1];
      const finalTestResult = lastResult
        ? { passed: lastResult.passed, duration: lastResult.duration }
        : undefined;

      return {
        success: allPassed,
        iterations: totalIterations,
        totalDuration,
        patches: allPatches,
        finalTestResult,
      };
    } catch (error) {
      await this.testerAgent.close();
      console.error('\n💥 Orchestrator error:', error);

      return {
        success: false,
        iterations: totalIterations,
        totalDuration: Date.now() - startTime,
        patches: allPatches,
      };
    }
  }

  /**
   * Run the fix loop for a single test
   */
  private async runFixLoop(
    testSpec: TestSpec,
    maxIterations: number
  ): Promise<{ success: boolean; iterations: number; patches: Patch[] }> {
    const patches: Patch[] = [];

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      console.log(`\n--- Iteration ${iteration}/${maxIterations} ---`);

      // Step 1: Run test
      console.log('🧪 Running test...');
      const testResult = await this.testerAgent.runTest(testSpec);

      if (testResult.passed) {
        console.log('✅ Test passed!');
        return { success: true, iterations: iteration, patches };
      }

      console.log(`❌ Test failed: ${testResult.failureReport?.error.message}`);

      if (!testResult.failureReport) {
        console.log('⚠️ No failure report available, cannot proceed');
        return { success: false, iterations: iteration, patches };
      }

      // Step 2: Triage the failure
      console.log('🔍 Triaging failure...');
      const diagnosis = await this.triageAgent.diagnose(testResult.failureReport);
      console.log(`   Type: ${diagnosis.failureType}`);
      console.log(`   Root cause: ${diagnosis.rootCause.slice(0, 100)}...`);
      console.log(`   File: ${diagnosis.localization.file}:${diagnosis.localization.startLine}`);
      console.log(`   Confidence: ${(diagnosis.confidence * 100).toFixed(0)}%`);

      // Step 3: Generate fix
      console.log('🔧 Generating fix...');
      const patchResult = await this.fixerAgent.generatePatch(diagnosis);

      if (!patchResult.success || !patchResult.patch) {
        console.log(`⚠️ Could not generate fix: ${patchResult.error}`);
        continue;
      }

      console.log(`   Patch: ${patchResult.patch.description}`);
      patches.push(patchResult.patch);

      // Step 4: Verify the fix
      console.log('✔️ Verifying fix...');
      // Pass failure report to verifier for learning
      this.verifierAgent.setFailureReport(testResult.failureReport);
      const verifyResult = await this.verifierAgent.verify(patchResult.patch, testSpec);

      if (verifyResult.success) {
        console.log('✅ Fix verified!');
        return { success: true, iterations: iteration, patches };
      }

      console.log(`⚠️ Fix did not work: ${verifyResult.error}`);
    }

    return { success: false, iterations: maxIterations, patches };
  }

  /**
   * Run all tests and return results
   */
  private async runAllTests(
    testSpecs: TestSpec[],
    targetUrl: string
  ): Promise<Array<{ testId: string; passed: boolean; duration: number }>> {
    const results: Array<{ testId: string; passed: boolean; duration: number }> = [];

    for (const spec of testSpecs) {
      const testSpec: TestSpec = {
        ...spec,
        url: spec.url.replace(/https?:\/\/[^/]+/, targetUrl),
      };

      const result = await this.testerAgent.runTest(testSpec);
      results.push({
        testId: spec.id,
        passed: result.passed,
        duration: result.duration,
      });

      console.log(`   ${result.passed ? '✅' : '❌'} ${spec.name}`);
    }

    return results;
  }

  /**
   * Print a summary of the run
   */
  private printSummary(stats: {
    success: boolean;
    iterations: number;
    patches: Patch[];
    duration: number;
    testCount: number;
    passCount: number;
  }): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PATCHPILOT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status: ${stats.success ? '✅ ALL TESTS PASSING' : '❌ SOME TESTS FAILING'}`);
    console.log(`Tests: ${stats.passCount}/${stats.testCount} passing`);
    console.log(`Iterations: ${stats.iterations}`);
    console.log(`Patches applied: ${stats.patches.length}`);
    console.log(`Duration: ${(stats.duration / 1000).toFixed(1)}s`);

    if (stats.patches.length > 0) {
      console.log('\nPatches:');
      for (const patch of stats.patches) {
        console.log(`  - ${patch.file}: ${patch.description}`);
      }
    }

    console.log('='.repeat(60) + '\n');
  }
}

// CLI entry point
async function main() {
  const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
  const maxIterations = parseInt(process.env.MAX_ITERATIONS || '5', 10);

  // Import test specs
  const { allTestSpecs } = await import('@/tests/e2e/specs');

  const orchestrator = new Orchestrator();

  const result = await orchestrator.run({
    maxIterations,
    testSpecs: allTestSpecs,
    targetUrl,
  });

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export default Orchestrator;
