/**
 * Weave Evaluation API
 *
 * Runs evaluations on historical run data and returns scores.
 * Enables tracking agent performance over time.
 */

import { NextResponse } from 'next/server';
import { isWeaveEnabled, getWeaveProjectUrl } from '@/lib/weave';
import {
  runEvaluation,
  createDatasetFromRuns,
  generateEvaluationReport,
  type EvaluationRow,
} from '@/lib/weave/evaluations';

export const dynamic = 'force-dynamic';

// Mock data for demonstration - in production, this would come from the database
const mockHistoricalRuns = [
  {
    testSpec: { id: 'test-1', name: 'Checkout Flow' },
    failureReport: { testId: 'test-1', error: { message: 'Button not clickable' } },
    success: true,
    iterations: 2,
  },
  {
    testSpec: { id: 'test-2', name: 'Signup Flow' },
    failureReport: { testId: 'test-2', error: { message: 'Null reference' } },
    success: true,
    iterations: 1,
  },
  {
    testSpec: { id: 'test-3', name: 'Cart Flow' },
    failureReport: { testId: 'test-3', error: { message: 'API error' } },
    success: false,
    iterations: 5,
  },
];

/**
 * GET /api/weave/evaluate
 *
 * Returns the latest evaluation results
 */
export async function GET() {
  try {
    // Check if Weave is enabled
    if (!isWeaveEnabled()) {
      return NextResponse.json({
        enabled: false,
        message: 'Weave is not enabled. Set WANDB_API_KEY to enable evaluations.',
        results: null,
      });
    }

    // Create dataset from mock runs
    const dataset = createDatasetFromRuns(mockHistoricalRuns);

    // Create a simple mock model for evaluation
    const mockModel = async (input: unknown): Promise<Record<string, unknown>> => {
      const typedInput = input as { testSpec?: { id?: string } };
      const run = mockHistoricalRuns.find(
        (r) => r.testSpec.id === typedInput.testSpec?.id
      );
      return {
        success: run?.success ?? false,
        iterations: run?.iterations ?? 1,
        durationMs: Math.random() * 30000,
        usedSimilarFix: Math.random() > 0.5,
      };
    };

    // Run evaluation
    const results = await runEvaluation(dataset, mockModel, 'api_evaluation');

    // Generate report
    const report = generateEvaluationReport(results);

    return NextResponse.json({
      enabled: true,
      results: {
        scores: results.scores,
        weightedScore: results.weightedScore,
        summary: results.summary,
        report,
      },
      projectUrl: getWeaveProjectUrl(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weave evaluate API error:', error);
    return NextResponse.json(
      { error: 'Failed to run evaluation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/weave/evaluate
 *
 * Run a custom evaluation with provided data
 *
 * Body:
 * - runs: Array of historical runs to evaluate
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { runs } = body;

    if (!runs || !Array.isArray(runs)) {
      return NextResponse.json(
        { error: 'runs array is required' },
        { status: 400 }
      );
    }

    // Check if Weave is enabled
    if (!isWeaveEnabled()) {
      return NextResponse.json({
        enabled: false,
        message: 'Weave is not enabled. Set WANDB_API_KEY to enable evaluations.',
        results: null,
      });
    }

    // Create dataset from provided runs
    const dataset = createDatasetFromRuns(runs);

    // Create model that returns the actual run results
    const model = async (input: unknown): Promise<Record<string, unknown>> => {
      const typedInput = input as { testSpec?: { id?: string } };
      const run = runs.find(
        (r: { testSpec?: { id?: string } }) =>
          r.testSpec?.id === typedInput.testSpec?.id
      );
      return {
        success: run?.success ?? false,
        iterations: run?.iterations ?? 1,
        durationMs: run?.durationMs ?? 0,
        usedSimilarFix: run?.usedSimilarFix ?? false,
        patch: run?.patch,
        diagnosis: run?.diagnosis,
      };
    };

    // Run evaluation
    const results = await runEvaluation(dataset, model, 'custom_evaluation');

    // Generate report
    const report = generateEvaluationReport(results);

    return NextResponse.json({
      enabled: true,
      results: {
        scores: results.scores,
        weightedScore: results.weightedScore,
        summary: results.summary,
        report,
      },
      projectUrl: getWeaveProjectUrl(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weave evaluate API error:', error);
    return NextResponse.json(
      { error: 'Failed to run evaluation' },
      { status: 500 }
    );
  }
}
