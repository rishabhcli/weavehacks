/**
 * Weave Evaluations for PatchPilot
 * Measures agent quality with custom scorers
 */


// Custom scorer: Did the fix actually work?
export async function fixSuccessScorer(
  output: { success?: boolean },
  expected?: { success?: boolean }
): Promise<number> {
  return expected ? (output.success === expected.success ? 1.0 : 0.0) : 0;
}

// Custom scorer: How many iterations were needed?
export async function efficiencyScorer(
  output: { iterations?: number },
  _expected?: unknown
): Promise<number> {
  const iterations = output.iterations ?? 1;
  return Math.max(0, 1 - (iterations - 1) * 0.2);
}

// Custom scorer: Did we reuse knowledge from Redis?
export async function knowledgeReuseScorer(
  output: { usedSimilarFix?: boolean },
  _expected?: unknown
): Promise<number> {
  return output.usedSimilarFix ? 1.0 : 0.0;
}

// Custom scorer: Time to fix (lower is better)
export async function timeToFixScorer(
  output: { durationMs?: number },
  _expected?: unknown
): Promise<number> {
  const durationMs = output.durationMs ?? 0;
  return Math.max(0, 1 - durationMs / 300000);
}

const SCORERS = [
  { name: 'fix_success', score: fixSuccessScorer },
  { name: 'iteration_efficiency', score: efficiencyScorer },
  { name: 'knowledge_reuse', score: knowledgeReuseScorer },
  { name: 'time_to_fix', score: timeToFixScorer },
];

export interface EvaluationRow {
  input: { testSpec?: unknown; failureReport?: unknown };
  expected: { success?: boolean; iterations?: number };
}

export async function runEvaluation(
  dataset: EvaluationRow[],
  model: (input: unknown) => Promise<unknown>,
  name?: string
): Promise<{ scores: Record<string, number>; examples: unknown[] }> {
  const results: unknown[] = [];
  const scoreSums: Record<string, number> = {};
  const scoreCounts: Record<string, number> = {};

  for (const s of SCORERS) {
    scoreSums[s.name] = 0;
    scoreCounts[s.name] = 0;
  }

  for (const row of dataset) {
    const output = (await model(row.input)) as Record<string, unknown>;
    results.push({ input: row.input, expected: row.expected, output });

    for (const scorer of SCORERS) {
      const value = await scorer.score(
        output,
        row.expected as Record<string, unknown> | undefined
      );
      scoreSums[scorer.name] += value;
      scoreCounts[scorer.name] += 1;
    }
  }

  const scores: Record<string, number> = {};
  for (const s of SCORERS) {
    scores[s.name] =
      scoreCounts[s.name] > 0 ? scoreSums[s.name] / scoreCounts[s.name] : 0;
  }

  return { scores, examples: results };
}

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
