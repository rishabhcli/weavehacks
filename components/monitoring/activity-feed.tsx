'use client';

import { CheckCircle, XCircle, Clock, GitBranch, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueuedRun } from '@/lib/types';

interface ActivityFeedProps {
  recentRuns: QueuedRun[];
}

export function ActivityFeed({ recentRuns }: ActivityFeedProps) {
  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'webhook':
        return <GitBranch className="h-4 w-4" />;
      case 'cron':
        return <Clock className="h-4 w-4" />;
      case 'manual':
        return <Zap className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'webhook':
        return 'Push';
      case 'cron':
        return 'Scheduled';
      case 'manual':
        return 'Manual';
      default:
        return trigger;
    }
  };

  if (recentRuns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity. Runs will appear here when monitoring triggers them.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentRuns.map((run) => (
            <div
              key={run.id}
              className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2 mt-0.5">
                {getStatusIcon(run.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{run.repoFullName}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {getTriggerIcon(run.trigger)}
                    {getTriggerLabel(run.trigger)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {run.status === 'completed' && 'Run completed successfully'}
                  {run.status === 'failed' && 'Run failed'}
                  {run.status === 'processing' && 'Run in progress...'}
                  {run.status === 'queued' && 'Waiting in queue'}
                  {run.metadata?.branch && ` on ${run.metadata.branch}`}
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTime(run.completedAt || run.startedAt || run.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
