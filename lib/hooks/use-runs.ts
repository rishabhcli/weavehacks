'use client';

import useSWR from 'swr';
import type { Run, RunStatus } from '@/lib/types';

interface RunsResponse {
  runs: Array<{
    id: string;
    repoId: string;
    repoName: string;
    status: RunStatus;
    currentAgent: string | null;
    iteration: number;
    maxIterations: number;
    testsTotal: number;
    testsPassed: number;
    patchesApplied: number;
    startedAt: string;
    completedAt?: string;
  }>;
  stats: {
    totalRuns: number;
    passRate: number;
    patchesApplied: number;
    avgIterations: number;
  };
}

interface RunResponse {
  run: Run;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

export function useRuns() {
  const { data, error, isLoading, mutate } = useSWR<RunsResponse>(
    '/api/runs',
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );

  return {
    runs: data?.runs || [],
    stats: data?.stats || {
      totalRuns: 0,
      passRate: 0,
      patchesApplied: 0,
      avgIterations: 0,
    },
    isLoading,
    error,
    mutate,
  };
}

export function useRun(runId: string) {
  const { data, error, isLoading, mutate } = useSWR<RunResponse>(
    runId ? `/api/runs/${runId}` : null,
    fetcher,
    {
      refreshInterval: 2000, // Refresh every 2 seconds for active runs
    }
  );

  return {
    run: data?.run || null,
    isLoading,
    error,
    mutate,
  };
}

export async function createRun(data: {
  repoId?: string;
  repoName?: string;
  testSpecs: Array<{
    id: string;
    name: string;
    url: string;
    steps: Array<{ action: string; expected?: string }>;
  }>;
  maxIterations?: number;
}) {
  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create run');
  }

  return res.json();
}

export async function cancelRun(runId: string) {
  const res = await fetch(`/api/runs/${runId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to cancel run');
  }

  return res.json();
}
