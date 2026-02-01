import { NextResponse } from 'next/server';
import { getKnowledgeBase, isRedisAvailable } from '@/lib/redis';

// Prevent static generation during build - this route requires Redis
export const dynamic = 'force-dynamic';

export interface KnowledgeBaseStats {
  available: boolean;
  totalBugsLearned: number;
  successfulFixes: number;
  learningEnabled: boolean;
}

// GET /api/knowledge-base - Get knowledge base statistics
export async function GET() {
  try {
    const available = await isRedisAvailable();
    
    if (!available) {
      return NextResponse.json({
        available: false,
        totalBugsLearned: 0,
        successfulFixes: 0,
        learningEnabled: false,
      } as KnowledgeBaseStats);
    }

    const kb = getKnowledgeBase();
    await kb.init();
    const stats = await kb.getStats();

    return NextResponse.json({
      available: true,
      totalBugsLearned: stats.totalFailures,
      successfulFixes: stats.successfulFixes,
      learningEnabled: true,
    } as KnowledgeBaseStats);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching knowledge base stats:', error);
    return NextResponse.json({
      available: false,
      totalBugsLearned: 0,
      successfulFixes: 0,
      learningEnabled: false,
    } as KnowledgeBaseStats);
  }
}
