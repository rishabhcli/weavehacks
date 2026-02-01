/**
 * Queue Status API
 *
 * Get the current state of the run queue.
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { getQueueStatus } from '@/lib/redis/queue';

/**
 * GET /api/monitoring/queue
 * Get queue status and items
 */
export async function GET() {
  try {
    const status = await getQueueStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching queue status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue status', pending: 0, processing: 0, items: [] },
      { status: 500 }
    );
  }
}
