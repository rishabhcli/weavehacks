// Shared types between mobile and web

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TestStep {
  action: string;
  expected?: string;
  timeout?: number;
}

export interface TestSpec {
  id: string;
  name: string;
  url: string;
  steps: TestStep[];
  timeout?: number;
}

export interface TestResult {
  passed: boolean;
  duration: number;
  failureReport?: {
    error?: { message: string };
  };
}

export type PatchStatus = 'applied' | 'pending';

export interface PatchDiagnosis {
  type: string;
  confidence: number;
  rootCause: string;
}

export interface Patch {
  id: string;
  file: string;
  description: string;
  diff: string;
  linesAdded: number;
  linesRemoved: number;
  status: PatchStatus;
  runId: string;
  createdAt: string;
  prUrl?: string;
  diagnosis?: PatchDiagnosis;
}

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
  testSpecs?: TestSpec[];
  patches?: Patch[];
  testResults?: TestResult[];
  testsTotal?: number;
  testsPassed?: number;
  patchesApplied?: number;
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

export type MonitoringSchedule = 'hourly' | 'daily' | 'weekly' | 'on_push';

export interface MonitoringConfig {
  repoId: string;
  repoFullName: string;
  enabled: boolean;
  schedule: MonitoringSchedule;
  testSpecs: TestSpec[];
  webhookSecret?: string;
  webhookId?: number;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImprovementMetrics {
  repoId: string;
  period: 'day' | 'week' | 'month';
  periodKey: string;
  passRate: number;
  avgTimeToFix: number;
  totalRuns: number;
  totalPatches: number;
  successfulPatches: number;
  failedPatches: number;
  totalTests: number;
  passedTests: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedRun {
  id: string;
  repoId: string;
  repoFullName: string;
  priority: 'high' | 'normal' | 'low';
  trigger: 'webhook' | 'cron' | 'manual';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  runId?: string;
  metadata?: {
    commitSha?: string;
    branch?: string;
    pusher?: string;
    prNumber?: number;
  };
}

export interface LearningMetrics {
  passRate: number;
  previousPassRate: number;
  avgTimeToFix: number;
  previousAvgTimeToFix: number;
  firstTryRate: number;
  previousFirstTryRate: number;
  knowledgeReuseRate: number;
  previousKnowledgeReuseRate: number;
  improvementPercent: number;
}

export interface LearningTrend {
  labels: string[];
  passRates: number[];
  timeToFix?: number[];
}

export interface KnowledgeBaseStats {
  totalPatterns: number;
  totalFixes: number;
  successfulFixes: number;
  byType: Record<string, number>;
}
