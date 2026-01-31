/**
 * E2E Test Runner
 *
 * Runs all test specifications using the Tester Agent
 * and reports results.
 */

import { TesterAgent } from '@/agents/tester';
import { allTestSpecs } from './specs';
import type { TestResult } from '@/lib/types';

interface RunnerResult {
  total: number;
  passed: number;
  failed: number;
  results: Array<{
    spec: string;
    result: TestResult;
  }>;
}

async function runAllTests(): Promise<RunnerResult> {
  console.log('🚀 Starting E2E Test Runner\n');
  console.log(`📋 Found ${allTestSpecs.length} test specifications\n`);

  const testerAgent = new TesterAgent();
  const results: RunnerResult = {
    total: allTestSpecs.length,
    passed: 0,
    failed: 0,
    results: [],
  };

  try {
    await testerAgent.init();
    console.log('✅ Tester Agent initialized\n');

    for (const spec of allTestSpecs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📝 Running: ${spec.name} (${spec.id})`);
      console.log(`   URL: ${spec.url}`);
      console.log(`   Steps: ${spec.steps.length}`);
      console.log('='.repeat(60));

      const result = await testerAgent.runTest(spec);

      results.results.push({
        spec: spec.id,
        result,
      });

      if (result.passed) {
        results.passed++;
        console.log(`\n✅ PASSED in ${result.duration}ms`);
      } else {
        results.failed++;
        console.log(`\n❌ FAILED at step ${result.failureReport?.step ?? 'unknown'}`);
        console.log(`   Error: ${result.failureReport?.error.message}`);

        if (result.failureReport?.context.consoleLogs.length) {
          console.log(`\n   Console Logs:`);
          for (const log of result.failureReport.context.consoleLogs.slice(-5)) {
            console.log(`   [${log.type}] ${log.message}`);
          }
        }
      }
    }
  } finally {
    await testerAgent.close();
    console.log('\n🔒 Tester Agent closed');
  }

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total:  ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Pass Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    for (const { spec, result } of results.results) {
      if (!result.passed) {
        console.log(`   - ${spec}: ${result.failureReport?.error.message}`);
      }
    }
  }

  return results;
}

// Run if executed directly
runAllTests()
  .then((results) => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { runAllTests };
