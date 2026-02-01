/**
 * Single Monitoring Config API
 *
 * Get, update, and delete a monitoring configuration.
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import {
  getMonitoringConfig,
  updateMonitoringConfig,
  deleteMonitoringConfig,
} from '@/lib/redis/monitoring-config';

interface RouteParams {
  params: Promise<{ repoId: string }>;
}

/**
 * GET /api/monitoring/configs/[repoId]
 * Get a specific monitoring configuration
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { repoId } = await params;
    const config = await getMonitoringConfig(repoId);

    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching monitoring config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/monitoring/configs/[repoId]
 * Update a monitoring configuration
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { repoId } = await params;
    const body = await request.json();

    const config = await updateMonitoringConfig(repoId, body);

    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error updating monitoring config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monitoring/configs/[repoId]
 * Delete a monitoring configuration
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { repoId } = await params;
    const deleted = await deleteMonitoringConfig(repoId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Config not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monitoring config:', error);
    return NextResponse.json(
      { error: 'Failed to delete config' },
      { status: 500 }
    );
  }
}
