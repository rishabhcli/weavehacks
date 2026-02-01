/**
 * Weave Traces API
 *
 * Provides access to Weave trace data for the dashboard UI.
 * Enables users to view and analyze agent execution traces.
 */

import { NextResponse } from 'next/server';
import { getWeaveProjectUrl, isWeaveEnabled } from '@/lib/weave';
import { queryRecentFailures, analyzeFailurePatterns } from '@/lib/weave/mcp-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/weave/traces
 *
 * Returns recent traces and Weave project information
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const status = searchParams.get('status'); // 'error' | 'success' | null

  try {
    // Check if Weave is enabled
    if (!isWeaveEnabled()) {
      return NextResponse.json({
        enabled: false,
        message: 'Weave is not enabled. Set WANDB_API_KEY to enable tracing.',
        projectUrl: null,
        traces: [],
      });
    }

    // Get project URL
    const projectUrl = getWeaveProjectUrl();

    // Query recent failures if requested
    let traces: unknown[] = [];
    let patterns: unknown = null;

    if (status === 'error') {
      try {
        traces = await queryRecentFailures('patchpilot');
      } catch (error) {
        console.error('Failed to query failures:', error);
      }
    }

    // Get failure patterns analysis
    try {
      patterns = await analyzeFailurePatterns('patchpilot');
    } catch (error) {
      console.error('Failed to analyze patterns:', error);
    }

    return NextResponse.json({
      enabled: true,
      projectUrl,
      traces: traces.slice(0, limit),
      patterns,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weave traces API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Weave traces' },
      { status: 500 }
    );
  }
}
