'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  Rocket,
  Sparkles,
  ArrowRight,
  Activity,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewRunDialog } from '@/components/dashboard/new-run-dialog';
import { LearningIndicator } from '@/components/dashboard/learning-indicator';
import { VoiceAssistant } from '@/components/voice/voice-assistant';
import { useToast } from '@/components/ui/toaster';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface RunStats {
  totalRuns: number;
  passRate: number;
  patchesApplied: number;
  avgIterations: number;
}

interface Run {
  id: string;
  repoId: string;
  repoName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentAgent: string | null;
  iteration: number;
  maxIterations: number;
  testsTotal: number;
  testsPassed: number;
  patchesApplied: number;
  startedAt: string;
  completedAt?: string;
}

const statusConfig = {
  completed: { label: 'Completed', icon: CheckCircle, className: 'status-success' },
  running: { label: 'Running', icon: Play, className: 'status-running' },
  failed: { label: 'Failed', icon: XCircle, className: 'status-error' },
  pending: { label: 'Pending', icon: Clock, className: 'status-info' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'status-warning' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [runs, setRuns] = useState<Run[]>([]);
  const [stats, setStats] = useState<RunStats>({
    totalRuns: 0,
    passRate: 0,
    patchesApplied: 0,
    avgIterations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/runs', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
        setStats(data.stats || {
          totalRuns: 0,
          passRate: 0,
          patchesApplied: 0,
          avgIterations: 0,
        });
      } else {
        showError('Failed to load dashboard data');
      }
    } catch {
      showError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showError]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    success('Dashboard refreshed');
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      if (runs.some((run) => run.status === 'running' || run.status === 'pending')) {
        fetchData();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchData, runs]);

  const handleRunCreated = (runId: string) => {
    success('Run created', 'Redirecting to run details...', {
      action: { label: 'View Run', onClick: () => router.push(`/dashboard/runs/${runId}`) }
    });
    router.push(`/dashboard/runs/${runId}`);
  };

  const recentRuns = runs.slice(0, 5);
  const hasActiveRun = runs.some((run) => run.status === 'running');

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Overview" />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Overview" />

      <main className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border bg-card p-6 lg:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" />
                  Self-Healing QA Agent
                </div>
                <LearningIndicator variant="compact" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome to PatchPilot</h1>
              <p className="text-muted-foreground max-w-xl">
                Automatically test your web app, find bugs, generate fixes, and verify them—
                all without writing a single line of test code.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NewRunDialog onRunCreated={handleRunCreated} />
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {hasActiveRun && (
            <div className="mt-6 pt-6 border-t flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">A test run is currently in progress</span>
              <Link href="/dashboard/runs" className="text-primary hover:underline ml-auto">
                View runs →
              </Link>
            </div>
          )}
        </motion.section>

        {/* Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            title="Total Runs"
            value={stats.totalRuns}
            description="Test runs executed"
            icon={Rocket}
            trend={stats.totalRuns > 0 ? { value: 12, isPositive: true } : undefined}
          />
          <StatCard
            title="Pass Rate"
            value={`${Math.round(stats.passRate)}%`}
            description="Tests passing after fixes"
            icon={TrendingUp}
            trend={stats.passRate > 0 ? { value: 7, isPositive: true } : undefined}
          />
          <StatCard
            title="Patches Applied"
            value={stats.patchesApplied}
            description="Auto-generated fixes"
            icon={GitBranch}
          />
          <StatCard
            title="Avg. Iterations"
            value={stats.avgIterations.toFixed(1)}
            description="Iterations per fix"
            icon={Zap}
          />
        </motion.section>

        {/* Main Content Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <QuickActionLink href="/dashboard/runs" icon={Play} label="View All Runs" />
                <QuickActionLink href="/dashboard/tests/new" icon={Sparkles} label="Create Test Spec" />
                <QuickActionLink href="/dashboard/settings" icon={GitBranch} label="Connect GitHub" />
              </div>
            </div>
          </div>

          {/* Recent Runs */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="font-semibold">Recent Runs</h3>
                <Link href="/dashboard/runs">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="p-6">
                {recentRuns.length === 0 ? (
                  <EmptyState
                    variant="default"
                    title="No runs yet"
                    description="Start your first run to see PatchPilot in action"
                    action={{ label: 'Start First Run', onClick: () => document.querySelector<HTMLButtonElement>('[data-new-run-trigger]')?.click() }}
                    compact
                  />
                ) : (
                  <div className="space-y-3">
                    {recentRuns.map((run) => {
                      const config = statusConfig[run.status];
                      const StatusIcon = config.icon;
                      const passRate = run.testsTotal > 0 
                        ? Math.round((run.testsPassed / run.testsTotal) * 100) 
                        : 0;

                      return (
                        <Link
                          key={run.id}
                          href={`/dashboard/runs/${run.id}`}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${config.className}`}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium group-hover:text-primary transition-colors">
                                {run.repoName}
                                {run.status === 'running' && run.currentAgent && (
                                  <span className="ml-2 text-sm text-muted-foreground font-normal">
                                    ({run.currentAgent})
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatTimeAgo(run.startedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-medium">{passRate}% pass rate</p>
                              <p className="text-xs text-muted-foreground">
                                {run.patchesApplied} patch{run.patchesApplied !== 1 ? 'es' : ''}
                              </p>
                            </div>
                            <Badge variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}>
                              {config.label}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <VoiceAssistant />
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <div className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

// Quick Action Link Component
function QuickActionLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
