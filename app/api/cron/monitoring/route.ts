/**
 * Cron Job: Monitoring
 *
 * Runs hourly to check for scheduled monitoring runs and process the queue.
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { getConfigsDueForRun, recordMonitoringRun } from '@/lib/redis/monitoring-config';
import { enqueueRun, dequeueRun, getQueueStatus } from '@/lib/redis/queue';
import { processQueuedRun } from '@/lib/queue/processor';

/**
 * Verify cron request is authorized
 */
function verifyCronAuth(request: NextRequest): boolean {
  // Vercel cron jobs include this header
  const cronSecret = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  // Also check for Vercel's internal cron header
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';

  return isVercelCron || cronSecret === expectedSecret;
}

/**
 * GET /api/cron/monitoring
 * Main cron endpoint - runs hourly
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[Cron] Starting monitoring check...');

  const results = {
    scheduled: 0,
    processed: 0,
    errors: [] as string[],
  };

  try {
    // Step 1: Check for scheduled runs that are due
    const dueConfigs = await getConfigsDueForRun();
    console.log(`[Cron] Found ${dueConfigs.length} scheduled runs due`);

    for (const config of dueConfigs) {
      try {
        const queuedRun = await enqueueRun({
          repoId: config.repoId,
          repoFullName: config.repoFullName,
          trigger: 'cron',
        });

        if (queuedRun) {
          results.scheduled++;
          // Update the config with next run time
          await recordMonitoringRun(config.repoId);
          console.log(`[Cron] Scheduled run for ${config.repoFullName}`);
        }
      } catch (error) {
        const message = `Failed to schedule ${config.repoFullName}: ${error}`;
        console.error(`[Cron] ${message}`);
        results.errors.push(message);
      }
    }

    // Step 2: Process queued runs
    const queueStatus = await getQueueStatus();
    console.log(`[Cron] Queue status: ${queueStatus.pending} pending, ${queueStatus.processing} processing`);

    // Process up to 3 runs in this cron execution
    const maxProcessPerCron = 3;
    let processed = 0;

    while (processed < maxProcessPerCron) {
      const queuedRun = await dequeueRun();
      if (!queuedRun) {
        break; // No more runs to process or concurrency limit reached
      }

      try {
        await processQueuedRun(queuedRun);
        results.processed++;
        processed++;
        console.log(`[Cron] Processed run ${queuedRun.id} for ${queuedRun.repoFullName}`);
      } catch (error) {
        const message = `Failed to process ${queuedRun.id}: ${error}`;
        console.error(`[Cron] ${message}`);
        results.errors.push(message);
      }
    }

    console.log(`[Cron] Completed: scheduled=${results.scheduled}, processed=${results.processed}`);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[Cron] Error in monitoring cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/monitoring
 * Manual trigger for testing (requires auth)
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Forward to GET handler
  return GET(request);
}
