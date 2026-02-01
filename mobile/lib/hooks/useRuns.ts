import useSWR from 'swr';
import { api, swrFetcher } from '@/lib/api/client';
import type { Run, RunsStats, TestSpec } from '@/lib/types';

interface RunsResponse {
  runs: Run[];
  stats: RunsStats;
}

interface RunResponse {
  run: Run;
}

interface UseRunsOptions {
  limit?: number;
  refreshInterval?: number;
}

/**
 * Hook for fetching all runs with stats
 */
export function useRuns(options: UseRunsOptions = {}) {
  const { data, error, isLoading, mutate } = useSWR<RunsResponse>(
    '/api/runs',
    swrFetcher,
    {
      refreshInterval: options.refreshInterval ?? 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
    }
  );

  const allRuns = data?.runs || [];
  const runs = options.limit ? allRuns.slice(0, options.limit) : allRuns;
  const stats = data?.stats || {
    totalRuns: 0,
    passRate: 0,
    patchesApplied: 0,
    avgIterations: 0,
  };

  return {
    runs,
    stats,
    total: stats.totalRuns ?? allRuns.length,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook for fetching a single run by ID
 */
export function useRun(runId?: string) {
  const { data, error, isLoading, mutate } = useSWR<RunResponse>(
    runId ? `/api/runs/${runId}` : null,
    swrFetcher,
    {
      refreshInterval: 2000, // Faster refresh for active runs
      revalidateOnFocus: true,
    }
  );

  return {
    run: data?.run || null,
    isLoading,
    error,
    mutate,
  };
}

export async function triggerRun(payload: {
  targetUrl?: string;
  repoId?: string;
  repoName?: string;
  testSpecs?: TestSpec[];
  maxIterations?: number;
  cloudMode?: boolean;
}) {
  let testSpecs = payload.testSpecs;

  if (!testSpecs || testSpecs.length === 0) {
    const response = await api.getTests();
    testSpecs = response.testSpecs || [];
  }

  if (!testSpecs || testSpecs.length === 0) {
    throw new Error('No test specs available. Add tests first.');
  }

  return api.createRun({
    ...payload,
    testSpecs,
  });
}

export async function cancelRun(runId: string) {
  return api.cancelRun(runId);
}
