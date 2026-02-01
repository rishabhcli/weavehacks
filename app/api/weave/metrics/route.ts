/**
 * Weave Metrics API
 *
 * Provides access to aggregated Weave metrics for the dashboard UI.
 * Shows key performance indicators from traced operations.
 */

import { NextResponse } from 'next/server';
import { isWeaveEnabled, getWeaveProjectUrl } from '@/lib/weave';

export const dynamic = 'force-dynamic';

/**
 * GET /api/weave/metrics
 *
 * Returns aggregated metrics from Weave traces
 */
export async function GET() {
  try {
    // Check if Weave is enabled
    if (!isWeaveEnabled()) {
      return NextResponse.json({
        enabled: false,
        message: 'Weave is not enabled. Set WANDB_API_KEY to enable tracing.',
        metrics: null,
      });
    }

    // Get project URL
    const projectUrl = getWeaveProjectUrl();

    // Return metrics structure (actual values come from Weave dashboard)
    // These are placeholder metrics - in production, these would be
    // fetched from Weave's API or computed from stored traces
    const metrics = {
      // Agent performance
      agents: {
        tester: {
          totalCalls: 0,
          avgDurationMs: 0,
          successRate: 0,
        },
        triage: {
          totalCalls: 0,
          avgDurationMs: 0,
          successRate: 0,
        },
        fixer: {
          totalCalls: 0,
          avgDurationMs: 0,
          successRate: 0,
        },
        verifier: {
          totalCalls: 0,
          avgDurationMs: 0,
          successRate: 0,
        },
      },
      // Overall metrics
      overall: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        avgIterations: 0,
        avgDurationMs: 0,
        totalPatches: 0,
        knowledgeReuseRate: 0,
      },
      // LLM usage
      llm: {
        totalCalls: 0,
        avgTokensPerCall: 0,
        costEstimate: 0,
        models: {
          'gemini-2.0-flash': 0,
          'gpt-4o': 0,
          'gpt-4o-mini': 0,
        },
      },
      // Links to Weave dashboard
      links: {
        project: projectUrl,
        traces: `${projectUrl}/traces`,
        evaluations: `${projectUrl}/evaluations`,
        datasets: `${projectUrl}/datasets`,
      },
    };

    return NextResponse.json({
      enabled: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weave metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Weave metrics' },
      { status: 500 }
    );
  }
}
