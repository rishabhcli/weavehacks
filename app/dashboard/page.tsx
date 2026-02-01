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
} from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewRunDialog } from '@/components/dashboard/new-run-dialog';
import { LearningIndicator } from '@/components/dashboard/learning-indicator';

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

// Animated counter component
function AnimatedValue({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  return (
    <span className="tabular-nums">
      {value}{suffix}
    </span>
  );
}

// Premium stats card with glassmorphism
function PremiumStatsCard({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-2xl ${gradient} opacity-20 blur-xl group-hover:opacity-30 transition-opacity`} />
      
      {/* Card */}
      <div className="relative rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6 hover:border-white/20 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${gradient}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              <TrendingUp className={`h-3 w-3 mr-0.5 ${!trend.isPositive && 'rotate-180'}`} />
              {trend.value}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold tracking-tight">
            <AnimatedValue value={value} />
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2">{description}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [stats, setStats] = useState<RunStats>({
    totalRuns: 0,
    passRate: 0,
    patchesApplied: 0,
    avgIterations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/runs');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
        setStats(data.stats || {
          totalRuns: 0,
          passRate: 0,
          patchesApplied: 0,
          avgIterations: 0,
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen">
      <Header title="Overview" />

      <div className="p-6 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-fuchsia-600/20 border border-white/10 p-8">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-fuchsia-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400/90">Self-Healing QA Agent</span>
              </div>
              <LearningIndicator variant="compact" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome to PatchPilot
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-6">
              Automatically test your web app, find bugs, generate fixes, and verify them—all without writing a single line of test code.
            </p>
            <div className="flex flex-wrap gap-3">
              <NewRunDialog onRunCreated={handleRunCreated} />
              <Link href="/demo">
                <Button variant="outline" className="border-white/20 hover:bg-white/10">
                  <Play className="mr-2 h-4 w-4" />
                  View Demo App
                </Button>
              </Link>
            </div>
          </div>

          {/* Status indicator */}
          {hasActiveRun && (
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium">Run in progress</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PremiumStatsCard
            title="Total Runs"
            value={stats.totalRuns}
            description="Test runs executed"
            icon={Rocket}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            trend={stats.totalRuns > 0 ? { value: 12, isPositive: true } : undefined}
          />
          <PremiumStatsCard
            title="Pass Rate"
            value={`${Math.round(stats.passRate)}%`}
            description="Tests passing after fixes"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            trend={stats.passRate > 0 ? { value: 7, isPositive: true } : undefined}
          />
          <PremiumStatsCard
            title="Patches Applied"
            value={stats.patchesApplied}
            description="Auto-generated fixes"
            icon={GitBranch}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
          />
          <PremiumStatsCard
            title="Avg. Iterations"
            value={stats.avgIterations.toFixed(1)}
            description="Iterations per fix"
            icon={Zap}
            gradient="bg-gradient-to-br from-orange-500 to-amber-600"
          />
        </div>

        {/* Quick Actions & Recent Runs */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 border-white/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/runs" className="block">
                <Button variant="outline" className="w-full justify-between group hover:border-violet-500/50 hover:bg-violet-500/10">
                  <span className="flex items-center">
                    <Play className="mr-2 h-4 w-4 text-violet-400" />
                    View All Runs
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link href="/dashboard/tests/new" className="block">
                <Button variant="outline" className="w-full justify-between group hover:border-emerald-500/50 hover:bg-emerald-500/10">
                  <span className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4 text-emerald-400" />
                    Create Test Spec
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link href="/dashboard/settings" className="block">
                <Button variant="outline" className="w-full justify-between group hover:border-blue-500/50 hover:bg-blue-500/10">
                  <span className="flex items-center">
                    <GitBranch className="mr-2 h-4 w-4 text-blue-400" />
                    Connect GitHub
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Runs */}
          <Card className="lg:col-span-2 border-white/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Runs</CardTitle>
                <Link href="/dashboard/runs">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentRuns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                    <Rocket className="h-8 w-8 text-violet-400" />
                  </div>
                  <h3 className="font-medium mb-2">No runs yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start your first run to see PatchPilot in action
                  </p>
                  <NewRunDialog onRunCreated={handleRunCreated} />
                </div>
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
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 border border-transparent hover:border-white/10 group"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2.5 rounded-lg ${
                              run.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : run.status === 'failed'
                                  ? 'bg-red-500/20 text-red-400'
                                  : run.status === 'running'
                                    ? 'bg-violet-500/20 text-violet-400'
                                    : 'bg-muted text-muted-foreground'
                            } ${run.status === 'running' ? 'animate-pulse' : ''}`}
                          >
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-violet-400 transition-colors">
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
                            variant={config.variant}
                            className={
                              run.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              run.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              run.status === 'running' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' :
                              ''
                            }
                          >
                            {config.label}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
