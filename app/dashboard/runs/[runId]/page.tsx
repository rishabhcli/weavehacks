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
  Wrench,
  RefreshCw,
  Loader2,
  Ban,
} from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/cn';
import { EnhancedAgentPipeline } from '@/components/runs/enhanced-agent-pipeline';
import { ActivityLog } from '@/components/runs/activity-log';
import { DiagnosticsPanel } from '@/components/diagnostics';
import { LiveBrowserViewer } from '@/components/runs/live-browser-viewer';
import { AgentTerminal } from '@/components/runs/agent-terminal';
import type {
  TestResult,
  Patch,
  TestSpec,
  AgentType,
  RunStatus,
  ActivityLogEntry,
  DiagnosticsData,
  AgentExecutionState,
} from '@/lib/types';

interface Run {
  id: string;
  repoId: string;
  repoName: string;
  status: RunStatus;
  currentAgent: AgentType | null;
  iteration: number;
  maxIterations: number;
  testSpecs: TestSpec[];
  patches: Patch[];
  testResults: TestResult[];
  startedAt: string;
  completedAt?: string;
}

const statusConfig = {
  completed: {
    label: 'Completed',
    variant: 'success' as const,
    icon: CheckCircle,
    color: 'text-emerald-400',
  },
  running: { label: 'Running', variant: 'default' as const, icon: Play, color: 'text-primary' },
  failed: { label: 'Failed', variant: 'destructive' as const, icon: XCircle, color: 'text-red-400' },
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-muted-foreground',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'secondary' as const,
    icon: Ban,
    color: 'text-muted-foreground',
  },
};

function formatDuration(startedAt: string, completedAt?: string): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

// Generate mock activity log entries for demo purposes
function generateMockActivityLog(run: Run): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];
  const baseTime = new Date(run.startedAt).getTime();

  if (run.status === 'pending') return entries;

  // Tester agent activities
  entries.push({
    id: '1',
    timestamp: new Date(baseTime),
    agent: 'tester',
    action: 'started',
    message: 'Starting test execution',
  });

  run.testSpecs.forEach((spec, i) => {
    entries.push({
      id: `test-nav-${i}`,
      timestamp: new Date(baseTime + 1000 + i * 3000),
      agent: 'tester',
      action: 'navigation',
      message: `Navigating to ${spec.url}`,
      details: { url: spec.url },
    });

    spec.steps.forEach((step, j) => {
      entries.push({
        id: `test-step-${i}-${j}`,
        timestamp: new Date(baseTime + 2000 + i * 3000 + j * 500),
        agent: 'tester',
        action: 'test_step',
        message: `Step ${j + 1}: ${step.action}`,
        details: { testStep: { step: j + 1, action: step.action } },
      });
    });
  });

  const testResult = run.testResults[0];
  if (testResult) {
    if (testResult.passed) {
      entries.push({
        id: 'test-complete',
        timestamp: new Date(baseTime + 10000),
        agent: 'tester',
        action: 'completed',
        message: 'All tests passed',
      });
    } else {
      entries.push({
        id: 'test-failed',
        timestamp: new Date(baseTime + 10000),
        agent: 'tester',
        action: 'failed',
        message: testResult.failureReport?.error.message || 'Test failed',
        details: {
          error: {
            message: testResult.failureReport?.error.message || 'Unknown error',
          },
        },
      });

      // Triage activities
      if (run.currentAgent === 'triage' || run.currentAgent === 'fixer' || run.currentAgent === 'verifier' || run.status === 'completed') {
        entries.push({
          id: 'triage-start',
          timestamp: new Date(baseTime + 11000),
          agent: 'triage',
          action: 'started',
          message: 'Analyzing test failure',
        });

        entries.push({
          id: 'triage-llm',
          timestamp: new Date(baseTime + 12000),
          agent: 'triage',
          action: 'llm_call',
          message: 'LLM Call (gpt-4o)',
          details: {
            llmCall: {
              model: 'gpt-4o',
              prompt: 'Analyze the following test failure...',
              response: 'Based on the error, the issue appears to be...',
              tokens: 1250,
              duration: 2500,
            },
          },
        });

        entries.push({
          id: 'triage-diagnosis',
          timestamp: new Date(baseTime + 15000),
          agent: 'triage',
          action: 'diagnosis',
          message: 'Root cause identified: Missing onClick handler',
        });

        entries.push({
          id: 'triage-complete',
          timestamp: new Date(baseTime + 16000),
          agent: 'triage',
          action: 'completed',
          message: 'Diagnosis complete',
        });
      }

      // Fixer activities
      if (run.currentAgent === 'fixer' || run.currentAgent === 'verifier' || run.status === 'completed') {
        entries.push({
          id: 'fixer-start',
          timestamp: new Date(baseTime + 17000),
          agent: 'fixer',
          action: 'started',
          message: 'Generating patch',
        });

        entries.push({
          id: 'fixer-llm',
          timestamp: new Date(baseTime + 18000),
          agent: 'fixer',
          action: 'llm_call',
          message: 'LLM Call (gpt-4o)',
          details: {
            llmCall: {
              model: 'gpt-4o',
              prompt: 'Generate a fix for the following issue...',
              response: 'Here is the corrected code...',
              tokens: 890,
              duration: 1800,
            },
          },
        });

        entries.push({
          id: 'fixer-patch',
          timestamp: new Date(baseTime + 21000),
          agent: 'fixer',
          action: 'patch',
          message: 'Patch generated for app/cart/page.tsx',
        });

        entries.push({
          id: 'fixer-complete',
          timestamp: new Date(baseTime + 22000),
          agent: 'fixer',
          action: 'completed',
          message: 'Patch applied successfully',
        });
      }

      // Verifier activities
      if (run.currentAgent === 'verifier' || run.status === 'completed') {
        entries.push({
          id: 'verifier-start',
          timestamp: new Date(baseTime + 23000),
          agent: 'verifier',
          action: 'started',
          message: 'Deploying fix to Vercel',
        });

        entries.push({
          id: 'verifier-deploy',
          timestamp: new Date(baseTime + 24000),
          agent: 'verifier',
          action: 'deploy',
          message: 'Deployment in progress',
        });

        if (run.status === 'completed') {
          entries.push({
            id: 'verifier-deployed',
            timestamp: new Date(baseTime + 30000),
            agent: 'verifier',
            action: 'deploy',
            message: 'Deployment successful',
            details: { url: 'https://app-preview.vercel.app' },
          });

          entries.push({
            id: 'verifier-retest',
            timestamp: new Date(baseTime + 32000),
            agent: 'verifier',
            action: 'test_step',
            message: 'Re-running failed test',
          });

          entries.push({
            id: 'verifier-complete',
            timestamp: new Date(baseTime + 35000),
            agent: 'verifier',
            action: 'completed',
            message: 'Verification successful - all tests pass',
          });
        }
      }
    }
  }

  return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Generate mock diagnostics data
function generateMockDiagnostics(run: Run): DiagnosticsData {
  const testResult = run.testResults[0];

  if (!testResult || testResult.passed) return {};

  return {
    testFailure: {
      errorMessage: testResult.failureReport?.error.message || 'Unknown error',
      failedStep: testResult.failureReport?.step,
      consoleLogs: [
        { type: 'error', message: "Cannot read property 'onClick' of undefined", timestamp: Date.now() - 5000 },
        { type: 'error', message: 'at CartPage (cart/page.tsx:45)', timestamp: Date.now() - 4900 },
        { type: 'warn', message: 'React does not recognize the `isActive` prop on a DOM element', timestamp: Date.now() - 4000 },
        { type: 'log', message: 'Cart loaded with 3 items', timestamp: Date.now() - 6000 },
      ],
      url: run.testSpecs[0]?.url || 'http://localhost:3000/cart',
    },
    triage: run.currentAgent !== 'tester' ? {
      reasoning: 'The test failure indicates a missing onClick handler on the checkout button. This is likely due to a recent refactor where the handler was accidentally removed. The error occurs when the user attempts to click the button, but no action is attached.',
      confidenceBreakdown: [
        { category: 'Error Pattern Match', score: 0.95 },
        { category: 'Code Similarity', score: 0.82 },
        { category: 'Historical Fix Success', score: 0.88 },
      ],
      similarIssuesCount: 3,
      diagnosis: {
        failureId: 'fail-001',
        failureType: 'UI_BUG',
        rootCause: 'Missing onClick handler on checkout button',
        localization: {
          file: 'app/cart/page.tsx',
          startLine: 42,
          endLine: 48,
          codeSnippet: `<Button
  className="w-full"
  disabled={items.length === 0}
>
  Proceed to Checkout
</Button>`,
        },
        similarIssues: [],
        suggestedFix: 'Add onClick handler to trigger checkout flow',
        confidence: 0.92,
      },
    } : undefined,
    patch: run.patches.length > 0 ? {
      filePath: run.patches[0].file,
      beforeCode: `<Button
  className="w-full"
  disabled={items.length === 0}
>
  Proceed to Checkout
</Button>`,
      afterCode: `<Button
  className="w-full"
  disabled={items.length === 0}
  onClick={handleCheckout}
>
  Proceed to Checkout
</Button>`,
      linesAdded: run.patches[0].metadata.linesAdded,
      linesRemoved: run.patches[0].metadata.linesRemoved,
      llmReasoning: 'Added the missing onClick handler that triggers the handleCheckout function. This function was already defined in the component but was not connected to the button.',
    } : undefined,
    verification: run.currentAgent === 'verifier' || run.status === 'completed' ? {
      deploymentUrl: 'https://patchpilot-preview.vercel.app',
      deploymentStatus: run.status === 'completed' ? 'ready' : 'building',
      retestPassed: run.status === 'completed',
      retestDuration: run.status === 'completed' ? 4500 : undefined,
    } : undefined,
  };
}

// Generate mock agent states
function generateAgentStates(run: Run): Partial<Record<AgentType, AgentExecutionState>> {
  const states: Partial<Record<AgentType, AgentExecutionState>> = {};
  const baseTime = new Date(run.startedAt);

  // Determine which agents have completed based on current state
  const agents: AgentType[] = ['tester', 'triage', 'fixer', 'verifier'];
  const currentIndex = run.currentAgent ? agents.indexOf(run.currentAgent) : -1;

  agents.forEach((agent, index) => {
    if (index < currentIndex) {
      states[agent] = {
        agent,
        status: 'completed',
        startTime: new Date(baseTime.getTime() + index * 8000),
        endTime: new Date(baseTime.getTime() + (index + 1) * 8000),
        duration: 8000,
      };
    } else if (index === currentIndex) {
      states[agent] = {
        agent,
        status: 'running',
        startTime: new Date(baseTime.getTime() + index * 8000),
        currentAction: agent === 'tester' ? 'Running tests...' :
                       agent === 'triage' ? 'Analyzing failure...' :
                       agent === 'fixer' ? 'Generating patch...' :
                       'Deploying fix...',
        progress: 45,
      };
    } else {
      states[agent] = {
        agent,
        status: 'idle',
      };
    }
  });

  if (run.status === 'completed') {
    agents.forEach((agent, index) => {
      states[agent] = {
        agent,
        status: 'completed',
        startTime: new Date(baseTime.getTime() + index * 8000),
        endTime: new Date(baseTime.getTime() + (index + 1) * 8000),
        duration: 8000,
      };
    });
  }

  if (run.status === 'failed' && run.currentAgent) {
    states[run.currentAgent] = {
      ...states[run.currentAgent]!,
      status: 'failed',
      error: 'Agent encountered an error',
    };
  }

  return states;
}

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData>({});
  const [agentStates, setAgentStates] = useState<Partial<Record<AgentType, AgentExecutionState>>>({});

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) {
          setError('Run not found');
        } else {
          setError('Failed to fetch run');
        }
        return;
      }
      const data = await res.json();
      const fetchedRun = data.run as Run;
      setRun(fetchedRun);
      setError(null);

      // Generate mock data for demo
      setActivityLog(generateMockActivityLog(fetchedRun));
      setDiagnostics(generateMockDiagnostics(fetchedRun));
      setAgentStates(generateAgentStates(fetchedRun));
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
      const res = await fetch(`/api/runs/${runId}`, { method: 'DELETE', credentials: 'include' });
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
                Run #{run.id.slice(0, 8)} · Iteration {run.iteration}/{run.maxIterations} ·{' '}
                {run.testSpecs.length} test(s)
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
                  <p className="text-2xl font-bold">
                    {passedTests}/{totalTests}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {run.iteration}/{run.maxIterations}
                  </p>
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

        {/* Enhanced Agent Pipeline */}
        <EnhancedAgentPipeline
          currentAgent={run.currentAgent}
          status={run.status}
          agentStates={agentStates}
        />

        {/* Live Browser Viewer - Full Width for Better Visibility */}
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <LiveBrowserViewer
              runId={run.id}
              isRunning={run.status === 'running'}
              className="h-full min-h-[400px]"
            />
          </div>
          <div className="lg:col-span-2">
            <AgentTerminal
              entries={activityLog}
              isLive={run.status === 'running'}
              className="h-full min-h-[400px]"
            />
          </div>
        </div>

        {/* Activity Log & Diagnostics Tabs */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="activity" className="gap-2">
              Activity Log
              {activityLog.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-xs">
                  {activityLog.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="gap-2">
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-2">
              <TestTube2 className="h-4 w-4" />
              Tests ({run.testSpecs.length})
            </TabsTrigger>
            <TabsTrigger value="patches" className="gap-2">
              <Wrench className="h-4 w-4" />
              Patches ({run.patches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <ActivityLog
              entries={activityLog}
              isLive={run.status === 'running'}
            />
          </TabsContent>

          <TabsContent value="diagnostics">
            <DiagnosticsPanel diagnostics={diagnostics} />
          </TabsContent>

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
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                hasResult && passed && 'bg-emerald-500/20',
                                hasResult && !passed && 'bg-red-500/20',
                                !hasResult && 'bg-muted'
                              )}
                            >
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
                  <p className="text-center text-muted-foreground py-8">
                    No patches generated yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {run.patches.map((patch) => (
                      <div
                        key={patch.id}
                        className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm font-medium text-primary">
                              {patch.file}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {patch.description}
                            </p>
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
        </Tabs>
      </div>
    </div>
  );
}
