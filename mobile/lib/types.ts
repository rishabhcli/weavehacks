// Shared types between mobile and web

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
}

export interface Run {
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
}

export interface RunsStats {
  totalRuns: number;
  passRate: number;
  patchesApplied: number;
  avgIterations: number;
}

export interface SessionData {
  authenticated: boolean;
  user?: GitHubUser;
  repos?: GitHubRepo[];
}
