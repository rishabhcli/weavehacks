/**
 * Weave Evaluations for QAgent
 *
 * Comprehensive evaluation framework using Weave ops and scorers.
 * Measures agent quality across multiple dimensions:
 * - Fix success rate
 * - Iteration efficiency
 * - Knowledge reuse
 * - Time to fix
 * - Patch quality
 * - Diagnosis accuracy
 */

import { weave, isWeaveEnabled } from './core';

// ============================================================================
// SCORERS - Each scorer is a traced Weave op for visibility
// ============================================================================

/**
 * Custom scorer: Did the fix actually work?
 * Returns 1.0 for success match, 0.0 for mismatch
 */
export const fixSuccessScorer = isWeaveEnabled()
  ? weave.op(
      async function fixSuccessScorer(
        output: { success?: boolean },
        expected?: { success?: boolean }
      ): Promise<number> {
        return expected ? (output.success === expected.success ? 1.0 : 0.0) : 0;
      },
      { name: 'Scorer.fixSuccess' }
    )
  : async (
      output: { success?: boolean },
      expected?: { success?: boolean }
    ): Promise<number> => {
      return expected ? (output.success === expected.success ? 1.0 : 0.0) : 0;
    };

/**
 * Custom scorer: How many iterations were needed?
 * Score decreases by 0.2 for each iteration beyond the first
 */
export const efficiencyScorer = isWeaveEnabled()
  ? weave.op(
      async function efficiencyScorer(
        output: { iterations?: number },
        _expected?: unknown
      ): Promise<number> {
        const iterations = output.iterations ?? 1;
        return Math.max(0, 1 - (iterations - 1) * 0.2);
      },
      { name: 'Scorer.efficiency' }
    )
  : async (
      output: { iterations?: number },
      _expected?: unknown
    ): Promise<number> => {
      const iterations = output.iterations ?? 1;
      return Math.max(0, 1 - (iterations - 1) * 0.2);
    };

/**
 * Custom scorer: Did we reuse knowledge from Redis?
 * Returns 1.0 if knowledge was reused, 0.0 otherwise
 */
export const knowledgeReuseScorer = isWeaveEnabled()
  ? weave.op(
      async function knowledgeReuseScorer(
        output: { usedSimilarFix?: boolean },
        _expected?: unknown
      ): Promise<number> {
        return output.usedSimilarFix ? 1.0 : 0.0;
      },
      { name: 'Scorer.knowledgeReuse' }
    )
  : async (
      output: { usedSimilarFix?: boolean },
      _expected?: unknown
    ): Promise<number> => {
      return output.usedSimilarFix ? 1.0 : 0.0;
    };

/**
 * Custom scorer: Time to fix (lower is better)
 * Score decreases linearly, reaching 0 at 5 minutes
 */
export const timeToFixScorer = isWeaveEnabled()
  ? weave.op(
      async function timeToFixScorer(
        output: { durationMs?: number },
        _expected?: unknown
      ): Promise<number> {
        const durationMs = output.durationMs ?? 0;
        return Math.max(0, 1 - durationMs / 300000);
      },
      { name: 'Scorer.timeToFix' }
    )
  : async (
      output: { durationMs?: number },
      _expected?: unknown
    ): Promise<number> => {
      const durationMs = output.durationMs ?? 0;
      return Math.max(0, 1 - durationMs / 300000);
    };

/**
 * Custom scorer: Patch size efficiency
 * Smaller patches are better (less risk of breaking changes)
 */
export const patchSizeScorer = isWeaveEnabled()
  ? weave.op(
      async function patchSizeScorer(
        output: { patch?: { metadata?: { linesAdded?: number; linesRemoved?: number } } },
        _expected?: unknown
      ): Promise<number> {
        const linesAdded = output.patch?.metadata?.linesAdded ?? 0;
        const linesRemoved = output.patch?.metadata?.linesRemoved ?? 0;
        const totalChanges = linesAdded + linesRemoved;
        // Score decreases as patch gets larger
        return Math.max(0, 1 - totalChanges / 50);
      },
      { name: 'Scorer.patchSize' }
    )
  : async (
      output: { patch?: { metadata?: { linesAdded?: number; linesRemoved?: number } } },
      _expected?: unknown
    ): Promise<number> => {
      const linesAdded = output.patch?.metadata?.linesAdded ?? 0;
      const linesRemoved = output.patch?.metadata?.linesRemoved ?? 0;
      const totalChanges = linesAdded + linesRemoved;
      return Math.max(0, 1 - totalChanges / 50);
    };

/**
 * Custom scorer: Diagnosis confidence
 * Higher confidence in diagnosis is better
 */
export const diagnosisConfidenceScorer = isWeaveEnabled()
  ? weave.op(
      async function diagnosisConfidenceScorer(
        output: { diagnosis?: { confidence?: number } },
        _expected?: unknown
      ): Promise<number> {
        return output.diagnosis?.confidence ?? 0;
      },
      { name: 'Scorer.diagnosisConfidence' }
    )
  : async (
      output: { diagnosis?: { confidence?: number } },
      _expected?: unknown
    ): Promise<number> => {
      return output.diagnosis?.confidence ?? 0;
    };

/**
 * Custom scorer: First-time fix rate
 * Did the fix work on the first attempt?
 */
export const firstTimeFix = isWeaveEnabled()
  ? weave.op(
      async function firstTimeFix(
        output: { success?: boolean; iterations?: number },
        _expected?: unknown
      ): Promise<number> {
        return output.success && output.iterations === 1 ? 1.0 : 0.0;
      },
      { name: 'Scorer.firstTimeFix' }
    )
  : async (
      output: { success?: boolean; iterations?: number },
      _expected?: unknown
    ): Promise<number> => {
      return output.success && output.iterations === 1 ? 1.0 : 0.0;
    };

// ============================================================================
// SCORER REGISTRY
// ============================================================================

type ScorerFn = (output: Record<string, unknown>, expected?: Record<string, unknown>) => Promise<number>;

const SCORERS: Array<{ name: string; score: ScorerFn; weight: number }> = [
  { name: 'fix_success', score: fixSuccessScorer as ScorerFn, weight: 2.0 },
  { name: 'iteration_efficiency', score: efficiencyScorer as ScorerFn, weight: 1.0 },
  { name: 'knowledge_reuse', score: knowledgeReuseScorer as ScorerFn, weight: 0.5 },
  { name: 'time_to_fix', score: timeToFixScorer as ScorerFn, weight: 0.5 },
  { name: 'patch_size', score: patchSizeScorer as ScorerFn, weight: 0.5 },
  { name: 'diagnosis_confidence', score: diagnosisConfidenceScorer as ScorerFn, weight: 0.5 },
  { name: 'first_time_fix', score: firstTimeFix as ScorerFn, weight: 1.5 },
];

// ============================================================================
// EVALUATION TYPES
// ============================================================================

export interface EvaluationRow {
  input: { testSpec?: unknown; failureReport?: unknown };
  expected: { success?: boolean; iterations?: number };
}

export interface EvaluationResult {
  scores: Record<string, number>;
  weightedScore: number;
  examples: unknown[];
  summary: {
    totalExamples: number;
    passRate: number;
    avgIterations: number;
    avgDurationMs: number;
  };
}

// ============================================================================
// EVALUATION RUNNER - Traced by Weave
// ============================================================================

/**
 * Run a comprehensive evaluation on a dataset
 */
export const runEvaluation = isWeaveEnabled()
  ? weave.op(
      async function runEvaluation(
        dataset: EvaluationRow[],
        model: (input: unknown) => Promise<unknown>,
        evaluationName?: string
      ): Promise<EvaluationResult> {
        return _runEvaluationInternal(dataset, model, evaluationName);
      },
      { name: 'Evaluation.run' }
    )
  : _runEvaluationInternal;

async function _runEvaluationInternal(
  dataset: EvaluationRow[],
  model: (input: unknown) => Promise<unknown>,
  evaluationName?: string
): Promise<EvaluationResult> {
  const results: unknown[] = [];
  const scoreSums: Record<string, number> = {};
  const scoreCounts: Record<string, number> = {};
  const weights: Record<string, number> = {};

  for (const s of SCORERS) {
    scoreSums[s.name] = 0;
    scoreCounts[s.name] = 0;
    weights[s.name] = s.weight;
  }

  let passCount = 0;
  let totalIterations = 0;
  let totalDuration = 0;

  for (const row of dataset) {
    const startTime = Date.now();
    const output = (await model(row.input)) as Record<string, unknown>;
    const duration = Date.now() - startTime;

    results.push({
      input: row.input,
      expected: row.expected,
      output,
      duration,
    });

    // Track summary metrics
    if (output.success) passCount++;
    if (typeof output.iterations === 'number') totalIterations += output.iterations;
    totalDuration += typeof output.durationMs === 'number' ? output.durationMs : duration;

    // Run all scorers
    for (const scorer of SCORERS) {
      const value = await scorer.score(
        output,
        row.expected as Record<string, unknown> | undefined
      );
      scoreSums[scorer.name] += value;
      scoreCounts[scorer.name] += 1;
    }
  }

  // Calculate average scores
  const scores: Record<string, number> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const s of SCORERS) {
    const avgScore =
      scoreCounts[s.name] > 0 ? scoreSums[s.name] / scoreCounts[s.name] : 0;
    scores[s.name] = avgScore;
    weightedSum += avgScore * s.weight;
    totalWeight += s.weight;
  }

  const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Log to Weave
  if (isWeaveEnabled()) {
    weave.withAttributes(
      {
        evaluation_name: evaluationName || 'qagent_eval',
        evaluation_size: dataset.length,
        weighted_score: weightedScore,
        pass_rate: dataset.length > 0 ? passCount / dataset.length : 0,
        ...scores,
      },
      () => {
        console.log(`📊 Evaluation complete: weighted_score=${weightedScore.toFixed(3)}`);
      }
    );
  }

  return {
    scores,
    weightedScore,
    examples: results,
    summary: {
      totalExamples: dataset.length,
      passRate: dataset.length > 0 ? passCount / dataset.length : 0,
      avgIterations: dataset.length > 0 ? totalIterations / dataset.length : 0,
      avgDurationMs: dataset.length > 0 ? totalDuration / dataset.length : 0,
    },
  };
}

// ============================================================================
// DATASET UTILITIES
// ============================================================================

/**
 * Create dataset from historical runs
 */
export function createDatasetFromRuns(runs: Array<{
  testSpec?: unknown;
  failureReport?: unknown;
  success?: boolean;
  iterations?: number;
}>): EvaluationRow[] {
  return runs.map((run) => ({
    input: {
      testSpec: run.testSpec,
      failureReport: run.failureReport,
    },
    expected: {
      success: run.success,
      iterations: run.iterations,
    },
  }));
}

/**
 * Compare two evaluation results
 */
export interface ComparisonResult {
  improved: string[];
  regressed: string[];
  unchanged: string[];
  overallChange: number;
}

export function compareEvaluations(
  baseline: EvaluationResult,
  current: EvaluationResult
): ComparisonResult {
  const improved: string[] = [];
  const regressed: string[] = [];
  const unchanged: string[] = [];

  for (const metric of Object.keys(baseline.scores)) {
    const delta = current.scores[metric] - baseline.scores[metric];
    if (delta > 0.05) {
      improved.push(metric);
    } else if (delta < -0.05) {
      regressed.push(metric);
    } else {
      unchanged.push(metric);
    }
  }

  return {
    improved,
    regressed,
    unchanged,
    overallChange: current.weightedScore - baseline.weightedScore,
  };
}

/**
 * Log comparison to Weave
 */
export const logEvaluationComparison = isWeaveEnabled()
  ? weave.op(
      async function logEvaluationComparison(
        baseline: EvaluationResult,
        current: EvaluationResult,
        comparisonName?: string
      ): Promise<ComparisonResult> {
        const comparison = compareEvaluations(baseline, current);

        weave.withAttributes(
          {
            comparison_name: comparisonName || 'eval_comparison',
            baseline_score: baseline.weightedScore,
            current_score: current.weightedScore,
            overall_change: comparison.overallChange,
            improved_metrics: comparison.improved.join(','),
            regressed_metrics: comparison.regressed.join(','),
          },
          () => {
            const direction =
              comparison.overallChange > 0
                ? '📈 Improved'
                : comparison.overallChange < 0
                  ? '📉 Regressed'
                  : '➡️ Unchanged';
            console.log(
              `${direction}: ${(comparison.overallChange * 100).toFixed(1)}%`
            );
          }
        );

        return comparison;
      },
      { name: 'Evaluation.compare' }
    )
  : async (
      baseline: EvaluationResult,
      current: EvaluationResult,
      _comparisonName?: string
    ): Promise<ComparisonResult> => {
      return compareEvaluations(baseline, current);
    };

/**
 * Generate evaluation report
 */
export function generateEvaluationReport(result: EvaluationResult): string {
  const lines: string[] = [
    '# QAgent Evaluation Report',
    '',
    '## Summary',
    `- Total Examples: ${result.summary.totalExamples}`,
    `- Pass Rate: ${(result.summary.passRate * 100).toFixed(1)}%`,
    `- Avg Iterations: ${result.summary.avgIterations.toFixed(2)}`,
    `- Avg Duration: ${(result.summary.avgDurationMs / 1000).toFixed(1)}s`,
    `- **Weighted Score: ${(result.weightedScore * 100).toFixed(1)}%**`,
    '',
    '## Individual Scores',
  ];

  for (const [metric, score] of Object.entries(result.scores)) {
    const bar = '█'.repeat(Math.round(score * 20)) + '░'.repeat(20 - Math.round(score * 20));
    lines.push(`- ${metric}: ${bar} ${(score * 100).toFixed(1)}%`);
  }

  return lines.join('\n');
}
