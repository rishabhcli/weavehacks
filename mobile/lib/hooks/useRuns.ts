import useSWR from 'swr';
import { swrFetcher } from '@/lib/api/client';
import type { Run, RunsStats } from '@/lib/types';

interface RunsResponse {
  runs: Run[];
  stats: RunsStats;
}

interface RunResponse {
  run: Run;
}

/**
 * Hook for fetching all runs with stats
 */
export function useRuns() {
  const { data, error, isLoading, mutate } = useSWR<RunsResponse>(
    '/api/runs',
    swrFetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
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

/**
 * Hook for fetching a single run by ID
 */
export function useRun(runId: string) {
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
