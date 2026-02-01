/**
 * Redis-backed Metrics Storage
 *
 * Provides time-series metrics storage for tracking improvement trends.
 */

import { getRedisClient, isRedisAvailable } from './client';
import type { ImprovementMetrics, MetricsPeriod, Run } from '@/lib/types';

// Redis key prefixes
const METRICS_PREFIX = 'metrics:';

// TTL for metrics (1 year)
const METRICS_TTL = 365 * 24 * 60 * 60;

/**
 * Get the period key for a given date
 */
function getPeriodKey(date: Date, period: MetricsPeriod): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (period) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week': {
      // Get ISO week number
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    }
    case 'month':
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Get the Redis key for metrics
 */
function getMetricsKey(repoId: string, period: MetricsPeriod, periodKey: string): string {
  return `${METRICS_PREFIX}${repoId}:${period}:${periodKey}`;
}

/**
 * Serialize metrics for storage
 */
function serializeMetrics(metrics: ImprovementMetrics): string {
  return JSON.stringify({
    ...metrics,
    createdAt: metrics.createdAt instanceof Date ? metrics.createdAt.toISOString() : metrics.createdAt,
    updatedAt: metrics.updatedAt instanceof Date ? metrics.updatedAt.toISOString() : metrics.updatedAt,
  });
}

/**
 * Deserialize metrics from storage
 */
function deserializeMetrics(data: string): ImprovementMetrics {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
  };
}

/**
 * Get or create metrics for a period
 */
export async function getOrCreateMetrics(
  repoId: string,
  period: MetricsPeriod,
  periodKey: string
): Promise<ImprovementMetrics> {
  if (!(await isRedisAvailable())) {
    return createEmptyMetrics(repoId, period, periodKey);
  }

  const redis = await getRedisClient();
  const key = getMetricsKey(repoId, period, periodKey);
  const data = await redis.get(key);

  if (data && typeof data === 'string') {
    return deserializeMetrics(data);
  }

  return createEmptyMetrics(repoId, period, periodKey);
}

/**
 * Create empty metrics object
 */
function createEmptyMetrics(repoId: string, period: MetricsPeriod, periodKey: string): ImprovementMetrics {
  const now = new Date();
  return {
    repoId,
    period,
    periodKey,
    passRate: 0,
    avgTimeToFix: 0,
    totalRuns: 0,
    totalPatches: 0,
    successfulPatches: 0,
    failedPatches: 0,
    totalTests: 0,
    passedTests: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Save metrics to Redis
 */
async function saveMetrics(metrics: ImprovementMetrics): Promise<void> {
  if (!(await isRedisAvailable())) {
    return;
  }

  const redis = await getRedisClient();
  const key = getMetricsKey(metrics.repoId, metrics.period, metrics.periodKey);
  metrics.updatedAt = new Date();
  await redis.setEx(key, METRICS_TTL, serializeMetrics(metrics));
}

/**
 * Record a completed run in metrics
 */
export async function recordRunMetrics(run: Run): Promise<void> {
  const periods: MetricsPeriod[] = ['day', 'week', 'month'];
  const date = run.completedAt || run.startedAt;

  for (const period of periods) {
    const periodKey = getPeriodKey(date, period);
    const metrics = await getOrCreateMetrics(run.repoId, period, periodKey);

    // Update metrics
    metrics.totalRuns += 1;
    metrics.totalPatches += run.patches.length;

    // Count successful patches (assume patch is successful if run completed)
    if (run.status === 'completed') {
      metrics.successfulPatches += run.patches.length;
    } else {
      metrics.failedPatches += run.patches.length;
    }

    // Count tests
    metrics.totalTests += run.testResults.length;
    metrics.passedTests += run.testResults.filter((t) => t.passed).length;

    // Calculate pass rate
    metrics.passRate =
      metrics.totalTests > 0 ? (metrics.passedTests / metrics.totalTests) * 100 : 0;

    // Calculate average time to fix (if there were patches)
    if (run.patches.length > 0 && run.completedAt && run.startedAt) {
      const duration = run.completedAt.getTime() - run.startedAt.getTime();
      const currentTotal = metrics.avgTimeToFix * (metrics.totalRuns - 1);
      metrics.avgTimeToFix = (currentTotal + duration) / metrics.totalRuns;
    }

    await saveMetrics(metrics);
  }
}

/**
 * Get metrics for a time range
 */
export async function getMetricsRange(
  repoId: string,
  period: MetricsPeriod,
  startDate: Date,
  endDate: Date
): Promise<ImprovementMetrics[]> {
  if (!(await isRedisAvailable())) {
    return [];
  }

  const metrics: ImprovementMetrics[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const periodKey = getPeriodKey(current, period);
    const m = await getOrCreateMetrics(repoId, period, periodKey);
    if (m.totalRuns > 0) {
      metrics.push(m);
    }

    // Move to next period
    switch (period) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return metrics;
}

/**
 * Get improvement trend data for the dashboard
 */
export async function getImprovementTrend(
  repoId: string,
  days: number = 30
): Promise<{
  labels: string[];
  passRates: number[];
  totalRuns: number[];
  avgTimeToFix: number[];
}> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  // Use weekly metrics for 30 days, daily for 7 days
  const period: MetricsPeriod = days <= 7 ? 'day' : 'week';
  const metrics = await getMetricsRange(repoId, period, startDate, endDate);

  return {
    labels: metrics.map((m) => m.periodKey),
    passRates: metrics.map((m) => m.passRate),
    totalRuns: metrics.map((m) => m.totalRuns),
    avgTimeToFix: metrics.map((m) => m.avgTimeToFix),
  };
}

/**
 * Get aggregated metrics across all repos
 */
export async function getGlobalMetrics(
  period: MetricsPeriod = 'month'
): Promise<ImprovementMetrics | null> {
  if (!(await isRedisAvailable())) {
    return null;
  }

  const redis = await getRedisClient();
  const pattern = `${METRICS_PREFIX}*:${period}:*`;
  const keys = await redis.keys(pattern);

  if (keys.length === 0) {
    return null;
  }

  const aggregated = createEmptyMetrics('global', period, getPeriodKey(new Date(), period));

  for (const key of keys) {
    const data = await redis.get(key);
    if (data && typeof data === 'string') {
      const metrics = deserializeMetrics(data);
      aggregated.totalRuns += metrics.totalRuns;
      aggregated.totalPatches += metrics.totalPatches;
      aggregated.successfulPatches += metrics.successfulPatches;
      aggregated.failedPatches += metrics.failedPatches;
      aggregated.totalTests += metrics.totalTests;
      aggregated.passedTests += metrics.passedTests;
    }
  }

  // Recalculate aggregated values
  aggregated.passRate =
    aggregated.totalTests > 0 ? (aggregated.passedTests / aggregated.totalTests) * 100 : 0;

  return aggregated;
}

/**
 * Get comparison between two periods
 */
export async function getMetricsComparison(
  repoId: string,
  period: MetricsPeriod = 'week'
): Promise<{
  current: ImprovementMetrics;
  previous: ImprovementMetrics;
  changes: {
    passRate: number;
    totalRuns: number;
    avgTimeToFix: number;
  };
} | null> {
  const now = new Date();
  const currentKey = getPeriodKey(now, period);

  // Calculate previous period
  const previous = new Date(now);
  switch (period) {
    case 'day':
      previous.setDate(previous.getDate() - 1);
      break;
    case 'week':
      previous.setDate(previous.getDate() - 7);
      break;
    case 'month':
      previous.setMonth(previous.getMonth() - 1);
      break;
  }
  const previousKey = getPeriodKey(previous, period);

  const currentMetrics = await getOrCreateMetrics(repoId, period, currentKey);
  const previousMetrics = await getOrCreateMetrics(repoId, period, previousKey);

  return {
    current: currentMetrics,
    previous: previousMetrics,
    changes: {
      passRate: currentMetrics.passRate - previousMetrics.passRate,
      totalRuns: currentMetrics.totalRuns - previousMetrics.totalRuns,
      avgTimeToFix: currentMetrics.avgTimeToFix - previousMetrics.avgTimeToFix,
    },
  };
}
