/**
 * Self-Improvement Loop using Weave MCP
 * The agent analyzes its own traces and improves
 */

import { queryRecentFailures, analyzeFailurePatterns } from './mcp-client';
import type { TraceSummary } from './mcp-client';
import { FailureAnalyzer } from '@/lib/tracetriage/analyzer';
import { PromptImprover } from '@/lib/tracetriage/prompt-improver';
import type { TraceData } from '@/lib/tracetriage/types';
import type { FailureAnalysis } from '@/lib/tracetriage/types';
import type { PromptImprovement } from '@/lib/tracetriage/prompt-improver';
import type { AgentName } from '@/lib/tracetriage/types';
import { op } from '@/lib/weave';

const AGENTS: AgentName[] = ['Tester', 'Triage', 'Fixer', 'Verifier', 'Orchestrator'];

function mapSummaryToTraceData(summary: TraceSummary): TraceData {
  const id = typeof summary.id === 'string' ? summary.id : String(summary.id ?? '');
  const createdAt = summary.created_at
    ? new Date(summary.created_at)
    : new Date();
  return {
    id,
    runId: id,
    startTime: createdAt,
    endTime: createdAt,
    durationMs: 0,
    success: (summary.status ?? 'error') !== 'error',
    operations: [],
    metadata: {
      testsTotal: 0,
      testsPassed: 0,
      iterationsTotal: 0,
      patchesApplied: 0,
    },
  };
}

export const selfImprove = op(
  async function selfImprove(projectName: string = 'qagent') {
    console.log('Starting self-improvement cycle...');

    const failures = await queryRecentFailures(projectName);
    console.log(`Found ${failures.length} recent failures to analyze`);

    const patternsResult = await analyzeFailurePatterns(projectName);
    const patternsCount = Array.isArray(patternsResult)
      ? patternsResult.length
      : patternsResult && typeof patternsResult === 'object'
        ? 1
        : 0;

    const traces: TraceData[] = failures.map(mapSummaryToTraceData);
    const analyzer = new FailureAnalyzer();
    const analysis: FailureAnalysis[] = await analyzer.analyzeTraces(traces);

    const improver = new PromptImprover();
    const improvements: PromptImprovement[] = [];

    for (const agent of AGENTS) {
      const relevant = analysis.filter((a) => a.agent === agent);
      if (relevant.length > 0) {
        const improvement = await improver.improvePrompt(agent, relevant);
        improvements.push(improvement);
      }
    }

    return {
      failuresAnalyzed: failures.length,
      patternsDetected: patternsCount,
      improvementsSuggested: improvements.length,
      improvements,
    };
  },
  { name: 'QAgent.selfImprove' }
);
