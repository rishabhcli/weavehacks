import useSWR from 'swr';
import { api, apiClient, swrFetcher } from '@/lib/api/client';
import type { GitHubRepo, GitHubUser, SessionData } from '@/lib/types';

interface SessionResponse extends SessionData {
  user?: GitHubUser;
  repos?: GitHubRepo[];
}

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionResponse>(
    '/api/auth/session',
    swrFetcher,
    { dedupingInterval: 30000 }
  );

  const isAuthenticated = Boolean(data?.authenticated && data?.user);

  const logout = async () => {
    await api.clearToken();
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors for logout
    }
    await mutate();
  };

  return {
    isAuthenticated,
    user: data?.user ?? null,
    repos: data?.repos ?? [],
    isLoading,
    error,
    mutate,
    logout,
  };
}
