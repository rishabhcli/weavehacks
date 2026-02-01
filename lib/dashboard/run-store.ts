import type { Run, RunStatus, AgentType, TestSpec, Patch, TestResult } from '@/lib/types';

// In-memory store for runs (replace with Redis in production)
const runs = new Map<string, Run>();

export function createRun(data: {
  repoId: string;
  repoName: string;
  testSpecs: TestSpec[];
  maxIterations: number;
}): Run {
  const run: Run = {
    id: crypto.randomUUID(),
    repoId: data.repoId,
    repoName: data.repoName,
    status: 'pending',
    currentAgent: null,
    iteration: 0,
    maxIterations: data.maxIterations,
    testSpecs: data.testSpecs,
    patches: [],
    testResults: [],
    startedAt: new Date(),
  };

  runs.set(run.id, run);
  return run;
}

export function getRun(runId: string): Run | null {
  return runs.get(runId) || null;
}

export function getAllRuns(): Run[] {
  return Array.from(runs.values()).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export function updateRunStatus(runId: string, status: RunStatus): void {
  const run = runs.get(runId);
  if (run) {
    run.status = status;
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      run.completedAt = new Date();
    }
  }
}

export function updateRunAgent(runId: string, agent: AgentType | null): void {
  const run = runs.get(runId);
  if (run) {
    run.currentAgent = agent;
  }
}

export function updateRunSession(runId: string, sessionId: string): void {
  const run = runs.get(runId);
  if (run) {
    run.sessionId = sessionId;
  }
}

export function incrementRunIteration(runId: string): void {
  const run = runs.get(runId);
  if (run) {
    run.iteration += 1;
  }
}

export function addRunPatch(runId: string, patch: Patch): void {
  const run = runs.get(runId);
  if (run) {
    run.patches.push(patch);
  }
}

export function addRunTestResult(runId: string, testResult: TestResult): void {
  const run = runs.get(runId);
  if (run) {
    run.testResults.push(testResult);
  }
}

export function deleteRun(runId: string): boolean {
  return runs.delete(runId);
}

// Get stats for dashboard
export function getRunStats(): {
  totalRuns: number;
  passRate: number;
  patchesApplied: number;
  avgIterations: number;
} {
  const allRuns = getAllRuns();

  if (allRuns.length === 0) {
    return {
      totalRuns: 0,
      passRate: 0,
      patchesApplied: 0,
      avgIterations: 0,
    };
  }

  const completedRuns = allRuns.filter((r) => r.status === 'completed');
  const totalPatches = allRuns.reduce((sum, r) => sum + r.patches.length, 0);
  const totalIterations = allRuns.reduce((sum, r) => sum + r.iteration, 0);

  return {
    totalRuns: allRuns.length,
    passRate: completedRuns.length / allRuns.length * 100,
    patchesApplied: totalPatches,
    avgIterations: totalIterations / allRuns.length,
  };
}
