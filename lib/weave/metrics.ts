/**
 * Weave Metrics Logging
 *
 * Logs key metrics after each PatchPilot run.
 * Since Weave doesn't have a direct log() function, metrics are tracked
 * through traced operations and console output for local analysis.
 */

import { isWeaveEnabled, weave } from './index';

/**
 * Metrics logged after each PatchPilot run
 */
export interface RunMetrics {
  // Test metrics
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;

  // Fix metrics
  bugsFound: number;
  bugsFixed: number;
  iterationsTotal: number;

  // Performance metrics
  durationMs: number;
  avgFixTimeMs: number;

  // Resource metrics
  llmTokensUsed?: number;
  redisQueriesCount?: number;
  redisHitRate?: number;

  // Outcome
  success: boolean;
}

/**
 * Metrics for a single agent operation
 */
export interface OperationMetrics {
  agentName: string;
  operationName: string;
  durationMs: number;
  success: boolean;
  inputSize?: number;
  outputSize?: number;
  error?: string;
}

/**
 * Log metrics for a completed PatchPilot run
 * Uses withAttributes to attach metrics to the current trace context
 */
export function logRunMetrics(metrics: RunMetrics): void {
  const passRate = metrics.testsTotal > 0 ? metrics.testsPassed / metrics.testsTotal : 0;
  const fixSuccessRate = metrics.bugsFound > 0 ? metrics.bugsFixed / metrics.bugsFound : 0;
  const iterationsPerBug = metrics.bugsFound > 0 ? metrics.iterationsTotal / metrics.bugsFound : 0;

  // Format metrics for logging
  const formattedMetrics = {
    // Test metrics
    tests_total: metrics.testsTotal,
    tests_passed: metrics.testsPassed,
    tests_failed: metrics.testsFailed,
    pass_rate: passRate,

    // Fix metrics
    bugs_found: metrics.bugsFound,
    bugs_fixed: metrics.bugsFixed,
    fix_success_rate: fixSuccessRate,
    iterations_total: metrics.iterationsTotal,
    iterations_per_bug: iterationsPerBug,

    // Performance
    duration_seconds: metrics.durationMs / 1000,
    avg_fix_time_seconds: metrics.avgFixTimeMs / 1000,

    // Resources (if available)
    ...(metrics.llmTokensUsed !== undefined && { llm_tokens_used: metrics.llmTokensUsed }),
    ...(metrics.redisQueriesCount !== undefined && { redis_queries: metrics.redisQueriesCount }),
    ...(metrics.redisHitRate !== undefined && { redis_hit_rate: metrics.redisHitRate }),

    // Outcome
    run_success: metrics.success,

    // Metadata
    timestamp: Date.now(),
    version: process.env.npm_package_version || '0.1.0',
  };

  if (isWeaveEnabled()) {
    // When Weave is enabled, metrics are automatically captured via op tracing
    // The withAttributes function can attach additional context to traces
    weave.withAttributes(formattedMetrics, () => {
      // This empty function just attaches attributes to current context
    });
  }

  // Always log to console for local debugging/monitoring
  console.log('📊 Run metrics:', JSON.stringify(formattedMetrics, null, 2));
}

/**
 * Log metrics for a single operation
 */
export function logOperationMetrics(metrics: OperationMetrics): void {
  if (!isWeaveEnabled()) {
    return;
  }

  const formattedMetrics = {
    agent: metrics.agentName,
    operation: metrics.operationName,
    duration_ms: metrics.durationMs,
    success: metrics.success,
    ...(metrics.inputSize !== undefined && { input_size: metrics.inputSize }),
    ...(metrics.outputSize !== undefined && { output_size: metrics.outputSize }),
    ...(metrics.error && { error: metrics.error }),
    timestamp: Date.now(),
  };

  // Attach to current trace context
  weave.withAttributes(formattedMetrics, () => {});
}

/**
 * Calculate pass rate from test results
 */
export function calculatePassRate(passed: number, total: number): number {
  return total > 0 ? passed / total : 0;
}

/**
 * Calculate improvement percentage between two values
 */
export function calculateImprovement(before: number, after: number): number {
  if (before === 0) return 0;
  return ((after - before) / before) * 100;
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Create a traced metrics logging operation
 * This wraps the metrics in an op for Weave visibility
 */
export const tracedLogMetrics = weave.op(
  async function logMetricsOp(metrics: RunMetrics): Promise<void> {
    logRunMetrics(metrics);
  },
  { name: 'PatchPilot.logMetrics' }
);
