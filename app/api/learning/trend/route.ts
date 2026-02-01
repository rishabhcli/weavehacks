import { NextResponse } from 'next/server';
import { getImprovementTrend } from '@/lib/redis/metrics-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const trend = await getImprovementTrend('global', 30);
    return NextResponse.json({
      labels: trend.labels,
      passRates: trend.passRates,
      timeToFix: trend.avgTimeToFix,
    });
  } catch (error) {
    console.error('Error fetching trend:', error);
    return NextResponse.json({
      labels: [],
      passRates: [],
      timeToFix: [],
    });
  }
}
