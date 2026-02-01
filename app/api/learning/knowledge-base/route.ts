import { NextResponse } from 'next/server';
import { getKnowledgeBase } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const kb = getKnowledgeBase();
    await kb.init();
    const stats = await kb.getStats();

    return NextResponse.json({
      totalPatterns: stats.totalFailures,
      totalFixes: stats.totalFailures,
      successfulFixes: stats.successfulFixes,
      byType: {} as Record<string, number>,
    });
  } catch (error) {
    console.error('Error fetching learning knowledge base:', error);
    return NextResponse.json({
      totalPatterns: 0,
      totalFixes: 0,
      successfulFixes: 0,
      byType: {},
    });
  }
}
