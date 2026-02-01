'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepoConfigCard } from '@/components/monitoring/repo-config-card';
import { MetricsChart } from '@/components/monitoring/metrics-chart';
import { WebhookSetup } from '@/components/monitoring/webhook-setup';
import { AddRepoDialog } from '@/components/monitoring/add-repo-dialog';
import { ActivityFeed } from '@/components/monitoring/activity-feed';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  MonitoringConfig,
  MonitoringSchedule,
  ImprovementMetrics,
  QueuedRun,
  GitHubRepo,
} from '@/lib/types';

export default function MonitoringPage() {
  const [configs, setConfigs] = useState<MonitoringConfig[]>([]);
  const [metrics, setMetrics] = useState<ImprovementMetrics[]>([]);
  const [recentRuns, setRecentRuns] = useState<QueuedRun[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [configsRes, metricsRes, queueRes, reposRes] = await Promise.all([
        fetch('/api/monitoring/configs'),
        fetch('/api/monitoring/metrics'),
        fetch('/api/monitoring/queue'),
        fetch('/api/auth/session'),
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data.configs || []);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics || []);
      }

      if (queueRes.ok) {
        const data = await queueRes.json();
        setRecentRuns(data.items || []);
      }

      if (reposRes.ok) {
        const data = await reposRes.json();
        setRepos(data.repos || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (repoId: string, enabled: boolean) => {
    const res = await fetch(`/api/monitoring/configs/${repoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });

    if (res.ok) {
      const updated = await res.json();
      setConfigs((prev) =>
        prev.map((c) => (c.repoId === repoId ? updated.config : c))
      );
    }
  };

  const handleScheduleChange = async (repoId: string, schedule: MonitoringSchedule) => {
    const res = await fetch(`/api/monitoring/configs/${repoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule }),
    });

    if (res.ok) {
      const updated = await res.json();
      setConfigs((prev) =>
        prev.map((c) => (c.repoId === repoId ? updated.config : c))
      );
    }
  };

  const handleDelete = async (repoId: string) => {
    const res = await fetch(`/api/monitoring/configs/${repoId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setConfigs((prev) => prev.filter((c) => c.repoId !== repoId));
      if (selectedRepo === repoId) {
        setSelectedRepo(null);
      }
    }
  };

  const handleAddRepo = async (
    repoId: string,
    repoFullName: string,
    schedule: MonitoringSchedule
  ) => {
    const res = await fetch('/api/monitoring/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoId, repoFullName, schedule }),
    });

    if (res.ok) {
      const data = await res.json();
      setConfigs((prev) => [...prev, data.config]);
    }
  };

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/github`
      : '';

  const selectedConfig = selectedRepo
    ? configs.find((c) => c.repoId === selectedRepo)
    : null;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          <h3 className="font-semibold">Error loading monitoring data</h3>
          <p className="text-sm">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchData}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Radio className="h-8 w-8" />
            Continuous Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Automatically test repositories on push or schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <AddRepoDialog
            repos={repos}
            existingRepoIds={configs.map((c) => c.repoId)}
            onAdd={handleAddRepo}
          />
        </div>
      </div>

      {/* Repository Configs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Monitored Repositories</h2>
        {configs.length === 0 ? (
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              No repositories configured for monitoring yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Click &quot;Add Repository&quot; to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {configs.map((config) => (
              <div
                key={config.repoId}
                onClick={() => setSelectedRepo(config.repoId)}
                className="cursor-pointer"
              >
                <RepoConfigCard
                  config={config}
                  onToggle={(enabled) => handleToggle(config.repoId, enabled)}
                  onScheduleChange={(schedule) =>
                    handleScheduleChange(config.repoId, schedule)
                  }
                  onDelete={() => handleDelete(config.repoId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Chart */}
      <MetricsChart metrics={metrics} title="Improvement Trends (Last 30 Days)" />

      {/* Two Column Layout: Webhook Setup & Activity Feed */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Webhook Setup */}
        {selectedConfig ? (
          <WebhookSetup
            repoFullName={selectedConfig.repoFullName}
            webhookUrl={webhookUrl}
            webhookSecret={selectedConfig.webhookSecret}
          />
        ) : (
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              Select a repository to view webhook setup instructions
            </p>
          </div>
        )}

        {/* Activity Feed */}
        <ActivityFeed recentRuns={recentRuns} />
      </div>
    </div>
  );
}
