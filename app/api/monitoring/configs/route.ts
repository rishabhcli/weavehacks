/**
 * Monitoring Configs API
 *
 * List and create monitoring configurations.
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import {
  getAllMonitoringConfigs,
  createMonitoringConfig,
} from '@/lib/redis/monitoring-config';
import { generateWebhookSecret } from '@/lib/github/webhook-validator';
import type { MonitoringSchedule } from '@/lib/types';

/**
 * GET /api/monitoring/configs
 * List all monitoring configurations
 */
export async function GET() {
  try {
    const configs = await getAllMonitoringConfigs();
    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching monitoring configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/configs
 * Create a new monitoring configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoId, repoFullName, schedule, testSpecs } = body;

    if (!repoId || !repoFullName) {
      return NextResponse.json(
        { error: 'repoId and repoFullName are required' },
        { status: 400 }
      );
    }

    // Generate a webhook secret for this repo
    const webhookSecret = generateWebhookSecret();

    const config = await createMonitoringConfig({
      repoId,
      repoFullName,
      schedule: schedule as MonitoringSchedule || 'on_push',
      testSpecs: testSpecs || [],
      webhookSecret,
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error('Error creating monitoring config:', error);
    return NextResponse.json(
      { error: 'Failed to create config' },
      { status: 500 }
    );
  }
}
