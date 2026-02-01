/**
 * Weave Datasets for PatchPilot
 *
 * Stores historical run data as Weave Datasets for:
 * - Training evaluations
 * - Comparing agent performance over time
 * - Building ground truth for self-improvement
 */

import { weave, isWeaveEnabled, getWeaveClient } from './core';
import type { TestSpec, FailureReport, Patch, DiagnosisReport } from '@/lib/types';

/**
 * Row in the PatchPilot runs dataset
 */
export interface RunDatasetRow {
  id: string;
  timestamp: string;
  testSpec: TestSpec;
  passed: boolean;
  failureReport?: FailureReport;
  diagnosis?: DiagnosisReport;
  patch?: Patch;
  iterations: number;
  durationMs: number;
  success: boolean;
}

/**
 * Row in the evaluations dataset
 */
export interface EvaluationDatasetRow {
  input: {
    testSpec: TestSpec;
    failureReport?: FailureReport;
  };
  expected: {
    shouldPass: boolean;
    maxIterations?: number;
  };
  output?: {
    passed: boolean;
    iterations: number;
    patchApplied: boolean;
  };
}

/**
 * Store a run result in the Weave dataset
 */
export const storeRunInDataset = isWeaveEnabled()
  ? weave.op(
      async function storeRunInDataset(row: RunDatasetRow): Promise<void> {
        // Log the row with attributes for dataset tracking
        weave.withAttributes(
          {
            dataset_type: 'patchpilot_runs',
            run_id: row.id,
            test_id: row.testSpec.id,
            success: row.success,
            iterations: row.iterations,
            duration_ms: row.durationMs,
            has_patch: !!row.patch,
            timestamp: row.timestamp,
          },
          () => {
            console.log(`📊 Stored run ${row.id} in Weave dataset`);
          }
        );
      },
      { name: 'Dataset.storeRun' }
    )
  : async (_row: RunDatasetRow): Promise<void> => {};

/**
 * Create an evaluation dataset from historical runs
 */
export const createEvaluationDataset = isWeaveEnabled()
  ? weave.op(
      async function createEvaluationDataset(
        runs: RunDatasetRow[]
      ): Promise<EvaluationDatasetRow[]> {
        const dataset = runs.map((run) => ({
          input: {
            testSpec: run.testSpec,
            failureReport: run.failureReport,
          },
          expected: {
            shouldPass: run.success,
            maxIterations: run.iterations,
          },
          output: {
            passed: run.passed,
            iterations: run.iterations,
            patchApplied: !!run.patch,
          },
        }));

        weave.withAttributes(
          {
            dataset_type: 'patchpilot_evaluation',
            dataset_size: dataset.length,
            success_rate:
              dataset.filter((r) => r.expected.shouldPass).length / dataset.length,
          },
          () => {
            console.log(`📊 Created evaluation dataset with ${dataset.length} rows`);
          }
        );

        return dataset;
      },
      { name: 'Dataset.createEvaluation' }
    )
  : async (runs: RunDatasetRow[]): Promise<EvaluationDatasetRow[]> =>
      runs.map((run) => ({
        input: { testSpec: run.testSpec, failureReport: run.failureReport },
        expected: { shouldPass: run.success, maxIterations: run.iterations },
        output: {
          passed: run.passed,
          iterations: run.iterations,
          patchApplied: !!run.patch,
        },
      }));

/**
 * Log a dataset row for later analysis
 */
export function logDatasetRow(
  datasetName: string,
  row: Record<string, unknown>
): void {
  if (!isWeaveEnabled()) return;

  weave.withAttributes(
    {
      dataset_name: datasetName,
      row_timestamp: new Date().toISOString(),
      ...row,
    },
    () => {}
  );
}

/**
 * Aggregate metrics from a dataset
 */
export interface DatasetMetrics {
  totalRuns: number;
  successRate: number;
  avgIterations: number;
  avgDurationMs: number;
  patchApplicationRate: number;
  failureTypeBreakdown: Record<string, number>;
}

export function computeDatasetMetrics(runs: RunDatasetRow[]): DatasetMetrics {
  const total = runs.length;
  if (total === 0) {
    return {
      totalRuns: 0,
      successRate: 0,
      avgIterations: 0,
      avgDurationMs: 0,
      patchApplicationRate: 0,
      failureTypeBreakdown: {},
    };
  }

  const successCount = runs.filter((r) => r.success).length;
  const patchCount = runs.filter((r) => r.patch).length;
  const totalIterations = runs.reduce((sum, r) => sum + r.iterations, 0);
  const totalDuration = runs.reduce((sum, r) => sum + r.durationMs, 0);

  const failureTypes: Record<string, number> = {};
  for (const run of runs) {
    if (run.diagnosis?.failureType) {
      failureTypes[run.diagnosis.failureType] =
        (failureTypes[run.diagnosis.failureType] || 0) + 1;
    }
  }

  return {
    totalRuns: total,
    successRate: successCount / total,
    avgIterations: totalIterations / total,
    avgDurationMs: totalDuration / total,
    patchApplicationRate: patchCount / total,
    failureTypeBreakdown: failureTypes,
  };
}

/**
 * Export dataset metrics to Weave
 */
export const logDatasetMetrics = isWeaveEnabled()
  ? weave.op(
      async function logDatasetMetrics(metrics: DatasetMetrics): Promise<void> {
        weave.withAttributes(
          {
            metric_type: 'dataset_summary',
            total_runs: metrics.totalRuns,
            success_rate: metrics.successRate,
            avg_iterations: metrics.avgIterations,
            avg_duration_ms: metrics.avgDurationMs,
            patch_rate: metrics.patchApplicationRate,
            failure_types: JSON.stringify(metrics.failureTypeBreakdown),
          },
          () => {
            console.log('📊 Logged dataset metrics to Weave');
          }
        );
      },
      { name: 'Dataset.logMetrics' }
    )
  : async (_metrics: DatasetMetrics): Promise<void> => {};
