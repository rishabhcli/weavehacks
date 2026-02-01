'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  TestTube2,
  Search,
  Wrench,
  ShieldCheck,
  ExternalLink,
  Image,
  Brain,
  GitPullRequest,
  Sparkles,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/cn';

interface TestResult {
  passed: boolean;
  duration: number;
  failureReport?: {
    testId: string;
    step: number;
    error: {
      message: string;
      type: string;
    };
  };
}

interface Patch {
  id: string;
  diagnosisId: string;
  file: string;
  diff: string;
  description: string;
  metadata: {
    linesAdded: number;
    linesRemoved: number;
    llmModel: string;
    promptTokens: number;
  };
}

interface TestSpec {
  id: string;
  name: string;
  url: string;
  steps: Array<{ action: string; expected?: string }>;
}

interface Run {
  id: string;
  repoId: string;
  repoName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentAgent: string | null;
  iteration: number;
  maxIterations: number;
  testSpecs: TestSpec[];
  patches: Patch[];
  testResults: TestResult[];
  startedAt: string;
  completedAt?: string;
}

const agentConfig = {
  tester: { label: 'Tester', icon: TestTube2, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  triage: { label: 'Triage', icon: Search, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  fixer: { label: 'Fixer', icon: Wrench, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  verifier: { label: 'Verifier', icon: ShieldCheck, color: 'text-green-400', bgColor: 'bg-green-500/20' },
};

const statusConfig = {
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle, color: 'text-emerald-400' },
  running: { label: 'Running', variant: 'default' as const, icon: Play, color: 'text-primary' },
  failed: { label: 'Failed', variant: 'destructive' as const, icon: XCircle, color: 'text-red-400' },
  pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock, color: 'text-muted-foreground' },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const, icon: XCircle, color: 'text-muted-foreground' },
};

// Agent pipeline visualization
function AgentPipeline({ currentAgent, status }: { currentAgent: string | null; status: string }) {
  const agents = ['tester', 'triage', 'fixer', 'verifier'] as const;
  
  // Determine which agents are completed based on current agent
  const currentIndex = currentAgent ? agents.indexOf(currentAgent as typeof agents[number]) : -1;
  const isRunComplete = status === 'completed' || status === 'failed';

  return (
    <div className="flex items-center justify-between py-4">
      {agents.map((agent, index) => {
        const agentInfo = agentConfig[agent];
        const Icon = agentInfo.icon;
        const isActive = currentAgent === agent;
        const isCompleted = isRunComplete || (currentIndex > index);
        const isFailed = status === 'failed' && currentAgent === agent;

        return (
          <div key={agent} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
                    isActive && !isFailed && 'bg-primary/20 ring-2 ring-primary shadow-lg shadow-primary/25',
                    isCompleted && !isActive && 'bg-emerald-500/20 ring-2 ring-emerald-500/50',
                    isFailed && 'bg-red-500/20 ring-2 ring-red-500/50',
                    !isActive && !isCompleted && !isFailed && 'bg-muted/50'
                  )}
                >
                  {isActive && !isFailed ? (
                    <Loader2 className={cn('h-6 w-6 animate-spin', agentInfo.color)} />
                  ) : (
                    <Icon
                      className={cn(
                        'h-6 w-6 transition-colors',
                        isCompleted ? 'text-emerald-400' : isFailed ? 'text-red-400' : agentInfo.color
                      )}
                    />
                  )}
                </div>
                {isCompleted && !isActive && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className={cn('text-sm font-medium', isActive && 'text-primary')}>{agentInfo.label}</p>
                {isActive && (
                  <p className="text-xs text-muted-foreground animate-pulse">Running...</p>
                )}
              </div>
            </div>

            {index < 3 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all duration-500',
                    isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-500/50' : 'bg-muted/30'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Format duration in human readable form
function formatDuration(startedAt: string, completedAt?: string): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Run not found');
        } else {
          setError('Failed to fetch run');
        }
        return;
      }
      const data = await res.json();
      setRun(data.run);
      setError(null);
    } catch (err) {
      setError('Failed to fetch run data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  // Poll for updates if run is active
  useEffect(() => {
    if (run?.status === 'running' || run?.status === 'pending') {
      const interval = setInterval(fetchRun, 2000);
      return () => clearInterval(interval);
    }
  }, [run?.status, fetchRun]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRun();
  };

  const handleCancel = async () => {
    try {
      const res = await fetch(`/api/runs/${runId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRun();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to cancel run:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/runs">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Run Details</h1>
          </div>
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">{error || 'Run not found'}</h2>
                <p className="text-muted-foreground mb-4">
                  The run you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
                <Link href="/dashboard/runs">
                  <Button>Back to Runs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const config = statusConfig[run.status];
  const StatusIcon = config.icon;

  const passedTests = run.testResults.filter((t) => t.passed).length;
  const totalTests = run.testSpecs.length;
  const duration = formatDuration(run.startedAt, run.completedAt);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/runs">
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{run.repoName}</h1>
                <Badge variant={config.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Run #{run.id.slice(0, 8)} · Iteration {run.iteration}/{run.maxIterations} · {run.testSpecs.length} test(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
            {(run.status === 'running' || run.status === 'pending') && (
              <Button variant="destructive" size="sm" onClick={handleCancel}>
                Cancel Run
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tests</p>
                  <p className="text-2xl font-bold">{passedTests}/{totalTests}</p>
                </div>
                <TestTube2 className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Patches</p>
                  <p className="text-2xl font-bold">{run.patches.length}</p>
                </div>
                <Wrench className="h-8 w-8 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Iteration</p>
                  <p className="text-2xl font-bold">{run.iteration}/{run.maxIterations}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-amber-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">{duration}</p>
                </div>
                <Clock className="h-8 w-8 text-emerald-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Pipeline */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-muted/30 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Agent Pipeline
            </CardTitle>
            <CardDescription>AI agents working together to test, diagnose, fix, and verify</CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <AgentPipeline currentAgent={run.currentAgent} status={run.status} />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="tests" className="gap-2">
              <TestTube2 className="h-4 w-4" />
              Tests ({run.testSpecs.length})
            </TabsTrigger>
            <TabsTrigger value="patches" className="gap-2">
              <Wrench className="h-4 w-4" />
              Patches ({run.patches.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Results ({run.testResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {run.testSpecs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tests defined</p>
                ) : (
                  <div className="space-y-3">
                    {run.testSpecs.map((spec, index) => {
                      const result = run.testResults[index];
                      const passed = result?.passed;
                      const hasResult = result !== undefined;
                      
                      return (
                        <div
                          key={spec.id}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-xl border transition-all',
                            hasResult && passed && 'bg-emerald-500/5 border-emerald-500/20',
                            hasResult && !passed && 'bg-red-500/5 border-red-500/20',
                            !hasResult && 'bg-muted/30 border-border/50'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              hasResult && passed && 'bg-emerald-500/20',
                              hasResult && !passed && 'bg-red-500/20',
                              !hasResult && 'bg-muted'
                            )}>
                              {!hasResult ? (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              ) : passed ? (
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium">{spec.name}</span>
                              <p className="text-sm text-muted-foreground">
                                {spec.steps.length} step(s) · {spec.url}
                              </p>
                            </div>
                          </div>
                          {result && (
                            <span className="text-sm text-muted-foreground">
                              {(result.duration / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patches" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {run.patches.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No patches generated yet</p>
                ) : (
                  <div className="space-y-4">
                    {run.patches.map((patch) => (
                      <div
                        key={patch.id}
                        className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm font-medium text-primary">{patch.file}</p>
                            <p className="text-sm text-muted-foreground mt-1">{patch.description}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                +{patch.metadata.linesAdded} added
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                -{patch.metadata.linesRemoved} removed
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Model: {patch.metadata.llmModel}
                              </span>
                            </div>
                          </div>
                          <Badge variant="success">Applied</Badge>
                        </div>
                        {patch.diff && (
                          <pre className="mt-3 p-3 bg-background rounded-lg text-xs font-mono overflow-x-auto border">
                            {patch.diff}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {run.testResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No test results yet</p>
                ) : (
                  <div className="space-y-4">
                    {run.testResults.map((result, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-4 rounded-xl border',
                          result.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              Test {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Duration: {(result.duration / 1000).toFixed(1)}s
                            </p>
                          </div>
                        </div>
                        {result.failureReport && (
                          <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <p className="text-sm font-medium text-red-400">
                              Step {result.failureReport.step} failed
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {result.failureReport.error.message}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
