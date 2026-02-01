import { NextRequest, NextResponse } from 'next/server';
import { CrawlerAgent } from '@/agents/crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 2 minutes for crawling

interface GenerateRequest {
  url: string;
  options?: {
    maxPages?: number;
    maxDepth?: number;
    includeAuth?: boolean;
  };
}

// POST /api/tests/generate - Auto-generate test specs from a URL
export async function POST(request: NextRequest) {
  let crawler: CrawlerAgent | null = null;

  try {
    const body: GenerateRequest = await request.json();
    const { url, options = {} } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Check required environment variables
    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
      return NextResponse.json(
        { error: 'Browserbase not configured. Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID.' },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'LLM not configured. Set OPENAI_API_KEY or GOOGLE_API_KEY.' },
        { status: 500 }
      );
    }

    crawler = new CrawlerAgent();

    // Discover flows by crawling the application
    const flows = await crawler.discoverFlows(url, {
      maxPages: options.maxPages || 5,
      maxDepth: options.maxDepth || 2,
      includeAuth: options.includeAuth ?? true,
    });

    // Convert flows to test specs
    const testSpecs = crawler.flowsToTestSpecs(flows);

    // Sort by confidence (highest first)
    flows.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      success: true,
      url,
      flows,
      testSpecs,
      summary: {
        totalFlows: flows.length,
        navigationFlows: flows.filter((f) => f.type === 'navigation').length,
        formFlows: flows.filter((f) => f.type === 'form').length,
        actionFlows: flows.filter((f) => f.type === 'action').length,
        authFlows: flows.filter((f) => f.type === 'auth').length,
        avgConfidence:
          flows.length > 0
            ? flows.reduce((sum, f) => sum + f.confidence, 0) / flows.length
            : 0,
      },
    });
  } catch (error) {
    console.error('Test generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate tests', details: message },
      { status: 500 }
    );
  } finally {
    if (crawler) {
      await crawler.close();
    }
  }
}
