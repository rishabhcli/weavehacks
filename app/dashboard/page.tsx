'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Clock,
  GitBranch,
  Rocket,
  Sparkles,
  ArrowRight,
  Activity,
  Loader2,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { GlassCard, PremiumStatCard } from '@/components/ui/glass-card';
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
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle },
  running: { label: 'Running', variant: 'default' as const, icon: Play },
  failed: { label: 'Failed', variant: 'destructive' as const, icon: XCircle },
  pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const, icon: XCircle },
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
    } catch (err) {
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

    // Poll for updates if there are running runs
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
  const mostRecentRepo = recentRuns.length > 0 ? recentRuns[0].repoName : null;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
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
    <div className="min-h-screen">
      <Header title="Overview" />

      <div className="p-6 space-y-8">
        {/* Hero Section */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neon-cyan/10 via-neon-magenta/10 to-neon-pink/10 border border-neon-cyan/30 p-8 cyber-grid"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated neon orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: [0, 20, 0],
                y: [0, -20, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-neon-magenta/20 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
                x: [0, -20, 0],
                y: [0, 20, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            />
            <motion.div
              className="absolute top-1/4 left-1/2 w-64 h-64 bg-neon-pink/15 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            />
          </div>

          {/* Scanline overlay */}
          <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30">
                <Sparkles className="h-4 w-4 text-neon-cyan animate-flicker" />
                <span className="text-sm font-medium text-neon-cyan">Self-Healing QA Agent</span>
              </div>
              <LearningIndicator variant="compact" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-pink bg-clip-text text-transparent">
              Welcome to PatchPilot
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-6">
              Automatically test your web app, find bugs, generate fixes, and verify them—all without writing a single line of test code.
            </p>
            <div className="flex flex-wrap gap-3">
              <NewRunDialog onRunCreated={handleRunCreated} />
              {mostRecentRepo && (
                <Button
                  variant="neon-green"
                  onClick={() => {
                    // Trigger the new run dialog with quick start
                    const trigger = document.querySelector<HTMLButtonElement>('[data-new-run-trigger]');
                    trigger?.click();
                  }}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Quick Run ({mostRecentRepo.split('/')[1]})
                </Button>
              )}
              <Link href="/demo">
                <Button variant="neon-cyan">
                  <Play className="mr-2 h-4 w-4" />
                  View Demo App
                </Button>
              </Link>
              <Button
                variant="cyber-glass"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Status indicator */}
          {hasActiveRun && (
            <motion.div
              className="absolute top-6 right-6 flex items-center gap-2 bg-neon-green/10 text-neon-green px-4 py-2 rounded-full border border-neon-green/40 shadow-[0_0_15px_hsl(var(--neon-green)/0.3)]"
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-2 h-2 rounded-full bg-neon-green animate-neon-pulse shadow-[0_0_8px_hsl(var(--neon-green)/0.8)]" />
              <span className="text-sm font-medium">Run in progress</span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <PremiumStatCard
            title="Total Runs"
            value={stats.totalRuns}
            description="Test runs executed"
            icon={Rocket}
            gradient="bg-gradient-to-br from-neon-cyan to-teal-500"
            trend={stats.totalRuns > 0 ? { value: 12, isPositive: true } : undefined}
          />
          <PremiumStatCard
            title="Pass Rate"
            value={`${Math.round(stats.passRate)}%`}
            description="Tests passing after fixes"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-neon-green to-emerald-500"
            trend={stats.passRate > 0 ? { value: 7, isPositive: true } : undefined}
          />
          <PremiumStatCard
            title="Patches Applied"
            value={stats.patchesApplied}
            description="Auto-generated fixes"
            icon={GitBranch}
            gradient="bg-gradient-to-br from-neon-magenta to-neon-pink"
          />
          <PremiumStatCard
            title="Avg. Iterations"
            value={stats.avgIterations.toFixed(1)}
            description="Iterations per fix"
            icon={Zap}
            gradient="bg-gradient-to-br from-neon-orange to-neon-yellow"
          />
        </motion.div>

        {/* Quick Actions & Recent Runs */}
        <motion.div 
          className="grid lg:grid-cols-3 gap-6"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Quick Actions */}
          <GlassCard variant="neon-cyan" glowOnHover className="lg:col-span-1">
            <div className="p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-neon-cyan">
                <Activity className="h-5 w-5 drop-shadow-[0_0_6px_hsl(var(--neon-cyan)/0.8)]" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link href="/dashboard/runs" className="block">
                  <Button variant="cyber-glass" className="w-full justify-between group">
                    <span className="flex items-center">
                      <Play className="mr-2 h-4 w-4 text-neon-cyan" />
                      View All Runs
                    </span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-neon-cyan" />
                  </Button>
                </Link>
                <Link href="/dashboard/tests/new" className="block">
                  <Button variant="cyber-glass" className="w-full justify-between group hover:border-neon-green/50 hover:shadow-[0_0_15px_hsl(var(--neon-green)/0.2)]">
                    <span className="flex items-center">
                      <Sparkles className="mr-2 h-4 w-4 text-neon-green" />
                      Create Test Spec
                    </span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-neon-green" />
                  </Button>
                </Link>
                <Link href="/dashboard/settings" className="block">
                  <Button variant="cyber-glass" className="w-full justify-between group hover:border-neon-magenta/50 hover:shadow-[0_0_15px_hsl(var(--neon-magenta)/0.2)]">
                    <span className="flex items-center">
                      <GitBranch className="mr-2 h-4 w-4 text-neon-magenta" />
                      Connect GitHub
                    </span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-neon-magenta" />
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>

          {/* Recent Runs */}
          <GlassCard variant="cyberpunk" className="lg:col-span-2">
            <div className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-neon-magenta to-neon-pink bg-clip-text text-transparent">Recent Runs</h3>
                <Link href="/dashboard/runs">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-neon-cyan transition-colors">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
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
                  {recentRuns.map((run, index) => {
                    const config = statusConfig[run.status];
                    const StatusIcon = config.icon;
                    const passRate = run.testsTotal > 0 
                      ? Math.round((run.testsPassed / run.testsTotal) * 100) 
                      : 0;

                    return (
                      <motion.div
                        key={run.id}
                        initial={false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link
                          href={`/dashboard/runs/${run.id}`}
                          className="flex items-center justify-between p-4 rounded-xl bg-card/30 backdrop-blur-sm hover:bg-neon-cyan/5 transition-all duration-200 border border-neon-cyan/10 hover:border-neon-cyan/30 hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.1)] group"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-2.5 rounded-lg transition-all duration-200 ${
                                run.status === 'completed'
                                  ? 'bg-neon-green/10 text-neon-green shadow-[0_0_10px_hsl(var(--neon-green)/0.2)]'
                                  : run.status === 'failed'
                                    ? 'bg-neon-pink/10 text-neon-pink shadow-[0_0_10px_hsl(var(--neon-pink)/0.2)]'
                                    : run.status === 'running'
                                      ? 'bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_hsl(var(--neon-cyan)/0.2)]'
                                      : 'bg-muted text-muted-foreground'
                              } ${run.status === 'running' ? 'animate-neon-pulse' : ''}`}
                            >
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium group-hover:text-neon-cyan transition-colors">
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
                            <Badge
                              variant={
                                run.status === 'completed' ? 'neon-success' :
                                run.status === 'failed' ? 'neon-danger' :
                                run.status === 'running' ? 'neon-cyan' :
                                config.variant
                              }
                            >
                              {config.label}
                            </Badge>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <VoiceAssistant />
    </div>
  );
}
