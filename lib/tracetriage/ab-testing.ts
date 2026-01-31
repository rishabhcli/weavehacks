/**
 * A/B Test Runner
 *
 * Compares different agent configurations (prompts, workflows, settings)
 * to determine which performs better.
 */

import { isWeaveEnabled, op } from '@/lib/weave';
import type {
  PromptConfig,
  ABTestResult,
  ABTestCase,
  AgentName,
} from './types';

/**
 * Result of running a single test case
 */
interface TestRunResult {
  testCaseId: string;
  configId: string;
  success: boolean;
  iterations: number;
  durationMs: number;
  error?: string;
}

/**
 * Options for running an A/B test
 */
export interface ABTestOptions {
  /** Number of times to run each test case per config */
  runsPerCase: number;
  /** Whether to randomize test order */
  randomize: boolean;
  /** Minimum confidence level to declare a winner (0-1) */
  minConfidence: number;
  /** Maximum duration for the entire test in ms */
  maxDurationMs: number;
}

const DEFAULT_OPTIONS: ABTestOptions = {
  runsPerCase: 5,
  randomize: true,
  minConfidence: 0.8,
  maxDurationMs: 3600000, // 1 hour
};

/**
 * Runs A/B tests to compare agent configurations
 */
export class ABTestRunner {
  private results: Map<string, ABTestResult> = new Map();

  /**
   * Run an A/B test comparing control and variant configs
   * Traced by Weave for observability
   */
  runTest = isWeaveEnabled()
    ? op(this._runTest.bind(this), { name: 'ABTestRunner.runTest' })
    : this._runTest.bind(this);

  private async _runTest(
    testCases: ABTestCase[],
    control: PromptConfig,
    variant: PromptConfig,
    options: Partial<ABTestOptions> = {}
  ): Promise<ABTestResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = new Date();
    const testId = `abtest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const controlResults: TestRunResult[] = [];
    const variantResults: TestRunResult[] = [];

    // Build test schedule
    const schedule = this.buildSchedule(testCases, opts);

    // Run tests
    for (const { testCase, isControl } of schedule) {
      // Check timeout
      if (Date.now() - startTime.getTime() > opts.maxDurationMs) {
        console.warn('A/B test timeout reached');
        break;
      }

      const config = isControl ? control : variant;
      const result = await this.runSingleTest(testCase, config);

      if (isControl) {
        controlResults.push(result);
      } else {
        variantResults.push(result);
      }
    }

    // Analyze results
    const analysis = this.analyzeResults(controlResults, variantResults, opts.minConfidence);

    const testResult: ABTestResult = {
      testId,
      controlConfig: control,
      variantConfig: variant,
      startTime,
      endTime: new Date(),
      metrics: analysis.metrics,
      winner: analysis.winner,
      confidence: analysis.confidence,
      recommendation: analysis.recommendation,
    };

    this.results.set(testId, testResult);
    return testResult;
  }

  /**
   * Build a schedule of test runs
   */
  private buildSchedule(
    testCases: ABTestCase[],
    options: ABTestOptions
  ): Array<{ testCase: ABTestCase; isControl: boolean }> {
    const schedule: Array<{ testCase: ABTestCase; isControl: boolean }> = [];

    for (const testCase of testCases) {
      for (let i = 0; i < options.runsPerCase; i++) {
        schedule.push({ testCase, isControl: true });
        schedule.push({ testCase, isControl: false });
      }
    }

    if (options.randomize) {
      // Fisher-Yates shuffle
      for (let i = schedule.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [schedule[i], schedule[j]] = [schedule[j], schedule[i]];
      }
    }

    return schedule;
  }

  /**
   * Run a single test case with a config
   * In real implementation, this would run the actual agent
   */
  private async runSingleTest(
    testCase: ABTestCase,
    config: PromptConfig
  ): Promise<TestRunResult> {
    const startTime = Date.now();

    // Simulate test execution
    // In production, this would actually run the agent with the config
    const simulatedResult = this.simulateTestRun(testCase, config);

    return {
      testCaseId: testCase.id,
      configId: config.id,
      success: simulatedResult.success,
      iterations: simulatedResult.iterations,
      durationMs: Date.now() - startTime + simulatedResult.simulatedDuration,
      error: simulatedResult.error,
    };
  }

  /**
   * Simulate a test run (for testing without real agents)
   * In production, replace this with actual agent execution
   */
  private simulateTestRun(
    testCase: ABTestCase,
    config: PromptConfig
  ): {
    success: boolean;
    iterations: number;
    simulatedDuration: number;
    error?: string;
  } {
    // Simulate based on config version (newer = slightly better)
    const versionNum = parseInt(config.version.replace('v', '')) || 1;
    const baseSuccessRate = 0.6 + versionNum * 0.05; // Higher versions are slightly better
    const success = Math.random() < baseSuccessRate;

    // Simulate iterations (1-5)
    const iterations = success ? Math.ceil(Math.random() * 3) : Math.ceil(Math.random() * 5);

    // Simulate duration (500ms - 5000ms)
    const simulatedDuration = 500 + Math.random() * 4500;

    return {
      success,
      iterations,
      simulatedDuration,
      error: success ? undefined : 'Simulated test failure',
    };
  }

  /**
   * Analyze test results and determine winner
   */
  private analyzeResults(
    controlResults: TestRunResult[],
    variantResults: TestRunResult[],
    minConfidence: number
  ): {
    metrics: ABTestResult['metrics'];
    winner: 'control' | 'variant' | 'tie';
    confidence: number;
    recommendation: string;
  } {
    // Calculate metrics
    const controlPass = controlResults.filter((r) => r.success).length;
    const variantPass = variantResults.filter((r) => r.success).length;
    const controlPassRate = controlResults.length > 0 ? controlPass / controlResults.length : 0;
    const variantPassRate = variantResults.length > 0 ? variantPass / variantResults.length : 0;

    const controlAvgIterations = this.average(controlResults.map((r) => r.iterations));
    const variantAvgIterations = this.average(variantResults.map((r) => r.iterations));

    const controlAvgDuration = this.average(controlResults.map((r) => r.durationMs));
    const variantAvgDuration = this.average(variantResults.map((r) => r.durationMs));

    const metrics = {
      controlPassRate,
      variantPassRate,
      controlAvgIterations,
      variantAvgIterations,
      controlAvgDurationMs: controlAvgDuration,
      variantAvgDurationMs: variantAvgDuration,
      sampleSize: controlResults.length + variantResults.length,
    };

    // Calculate statistical significance
    const confidence = this.calculateConfidence(
      controlPassRate,
      variantPassRate,
      controlResults.length,
      variantResults.length
    );

    // Determine winner
    let winner: 'control' | 'variant' | 'tie' = 'tie';
    let recommendation = '';

    if (confidence >= minConfidence) {
      if (variantPassRate > controlPassRate) {
        winner = 'variant';
        recommendation = `Variant performs ${((variantPassRate - controlPassRate) * 100).toFixed(1)}% better. Recommend adopting variant.`;
      } else if (controlPassRate > variantPassRate) {
        winner = 'control';
        recommendation = `Control performs ${((controlPassRate - variantPassRate) * 100).toFixed(1)}% better. Recommend keeping control.`;
      } else {
        // If pass rates are equal, check iterations
        if (variantAvgIterations < controlAvgIterations) {
          winner = 'variant';
          recommendation = 'Equal pass rates but variant uses fewer iterations. Recommend adopting variant.';
        } else if (controlAvgIterations < variantAvgIterations) {
          winner = 'control';
          recommendation = 'Equal pass rates but control uses fewer iterations. Recommend keeping control.';
        } else {
          recommendation = 'No significant difference detected between control and variant.';
        }
      }
    } else {
      recommendation = `Confidence (${(confidence * 100).toFixed(1)}%) is below threshold (${minConfidence * 100}%). More data needed.`;
    }

    return { metrics, winner, confidence, recommendation };
  }

  /**
   * Calculate confidence using simplified statistical test
   * Based on z-test for proportions
   */
  private calculateConfidence(
    p1: number,
    p2: number,
    n1: number,
    n2: number
  ): number {
    if (n1 === 0 || n2 === 0) return 0;

    // Pooled proportion
    const p = (p1 * n1 + p2 * n2) / (n1 + n2);
    if (p === 0 || p === 1) return Math.abs(p1 - p2) > 0.01 ? 0.95 : 0.5;

    // Standard error
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
    if (se === 0) return 0.5;

    // Z-score
    const z = Math.abs(p1 - p2) / se;

    // Convert z-score to confidence (approximate)
    // Using simplified normal CDF approximation
    const confidence = this.normalCDF(z);

    return Math.min(0.99, confidence);
  }

  /**
   * Simplified normal CDF approximation
   */
  private normalCDF(z: number): number {
    // Approximation of the normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Calculate average of an array
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Get all test results
   */
  getResults(): ABTestResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get a specific test result
   */
  getResult(testId: string): ABTestResult | undefined {
    return this.results.get(testId);
  }

  /**
   * Clear all test results
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Generate a summary of all A/B tests
   */
  getSummary(): {
    totalTests: number;
    controlWins: number;
    variantWins: number;
    ties: number;
    averageConfidence: number;
  } {
    const results = this.getResults();
    const controlWins = results.filter((r) => r.winner === 'control').length;
    const variantWins = results.filter((r) => r.winner === 'variant').length;
    const ties = results.filter((r) => r.winner === 'tie').length;
    const avgConfidence = this.average(results.map((r) => r.confidence));

    return {
      totalTests: results.length,
      controlWins,
      variantWins,
      ties,
      averageConfidence: avgConfidence,
    };
  }
}

export default ABTestRunner;
