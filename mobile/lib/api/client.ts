import * as SecureStore from 'expo-secure-store';

// API URL from environment or default
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://patchpilot.vercel.app';

const TOKEN_KEY = 'patchpilot_access_token';

interface FetchOptions extends RequestInit {
  authenticated?: boolean;
}

/**
 * API client for making requests to the PatchPilot backend
 */
export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { authenticated = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add authorization header if authenticated
  if (authenticated) {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }

  return response.json();
}

/**
 * Fetcher function for SWR
 */
export const swrFetcher = async <T>(url: string): Promise<T> => {
  return apiClient<T>(url);
};

/**
 * API methods for common operations
 */
export const api = {
  // Runs
  getRuns: () => apiClient<{ runs: any[]; stats: any }>('/api/runs'),
  getRun: (id: string) => apiClient<{ run: any }>(`/api/runs/${id}`),
  createRun: (data: any) =>
    apiClient<{ run: any }>('/api/runs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancelRun: (id: string) =>
    apiClient<{ success: boolean }>(`/api/runs/${id}`, {
      method: 'DELETE',
    }),

  // Session
  getSession: () => apiClient<{ authenticated: boolean; user?: any; repos?: any[] }>('/api/auth/session'),

  // Patches
  getPatches: () => apiClient<{ patches: any[] }>('/api/patches'),
  getPatch: (id: string) => apiClient<{ patch: any }>(`/api/patches/${id}`),

  // Tests
  getTests: () => apiClient<{ tests: any[] }>('/api/tests'),

  // Notifications
  registerPushToken: (token: string, platform: string) =>
    apiClient<{ success: boolean }>('/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),
};
