/**
 * Metrics API
 *
 * Get improvement metrics for the dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsRange, getGlobalMetrics } from '@/lib/redis/metrics-store';
import type { MetricsPeriod } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/metrics
 * Get metrics for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId') || 'global';
    const days = parseInt(searchParams.get('days') || '30', 10);
    const period: MetricsPeriod = days <= 7 ? 'day' : 'week';

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    let metrics;
    if (repoId === 'global') {
      // Get aggregated metrics
      const globalMetrics = await getGlobalMetrics(period);
      metrics = globalMetrics ? [globalMetrics] : [];
    } else {
      // Get repo-specific metrics
      metrics = await getMetricsRange(repoId, period, startDate, endDate);
    }

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', metrics: [] },
      { status: 500 }
    );
  }
}
