/**
 * Weave Feedback API
 *
 * Collects user feedback on agent runs and logs to Weave.
 */

import { NextResponse } from 'next/server';
import { isWeaveEnabled } from '@/lib/weave';
import {
  recordFeedback,
  recordPositiveFeedback,
  recordNegativeFeedback,
  recordRatedFeedback,
  type FeedbackType,
} from '@/lib/weave/feedback';

export const dynamic = 'force-dynamic';

/**
 * POST /api/weave/feedback
 *
 * Submit feedback for a run
 *
 * Body:
 * - runId: string (required)
 * - type: 'thumbs' | 'rating' | 'detailed' (required)
 * - value: boolean | number | { type, score, comment } (required)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { runId, type, value } = body;

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 }
      );
    }

    if (!type || !['thumbs', 'rating', 'detailed'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be one of: thumbs, rating, detailed' },
        { status: 400 }
      );
    }

    // Check if Weave is enabled
    if (!isWeaveEnabled()) {
      // Still accept feedback but log warning
      console.warn('Weave not enabled, feedback not logged to traces');
    }

    // Process feedback based on type
    switch (type) {
      case 'thumbs':
        if (typeof value !== 'boolean') {
          return NextResponse.json(
            { error: 'value must be boolean for thumbs feedback' },
            { status: 400 }
          );
        }
        if (value) {
          await recordPositiveFeedback(runId);
        } else {
          await recordNegativeFeedback(runId);
        }
        break;

      case 'rating':
        if (typeof value !== 'number' || value < 1 || value > 5) {
          return NextResponse.json(
            { error: 'value must be a number 1-5 for rating feedback' },
            { status: 400 }
          );
        }
        await recordRatedFeedback(runId, value as 1 | 2 | 3 | 4 | 5);
        break;

      case 'detailed':
        if (
          typeof value !== 'object' ||
          !value.type ||
          typeof value.score !== 'number'
        ) {
          return NextResponse.json(
            { error: 'value must be { type, score, comment? } for detailed feedback' },
            { status: 400 }
          );
        }
        await recordFeedback({
          runId,
          type: value.type as FeedbackType,
          score: value.score,
          comment: value.comment,
          timestamp: new Date().toISOString(),
        });
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
      runId,
      type,
      weaveEnabled: isWeaveEnabled(),
    });
  } catch (error) {
    console.error('Weave feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
