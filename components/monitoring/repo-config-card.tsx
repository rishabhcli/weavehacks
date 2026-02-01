'use client';

import { useState } from 'react';
import { Settings, Power, Clock, GitBranch, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduleSelector } from './schedule-selector';
import type { MonitoringConfig, MonitoringSchedule } from '@/lib/types';

interface RepoConfigCardProps {
  config: MonitoringConfig;
  onToggle: (enabled: boolean) => Promise<void>;
  onScheduleChange: (schedule: MonitoringSchedule) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function RepoConfigCard({
  config,
  onToggle,
  onScheduleChange,
  onDelete,
}: RepoConfigCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggle(!config.enabled);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleChange = async (schedule: MonitoringSchedule) => {
    setIsLoading(true);
    try {
      await onScheduleChange(schedule);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to remove monitoring for ${config.repoFullName}?`)) {
      setIsLoading(true);
      try {
        await onDelete();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  const getScheduleLabel = (schedule: MonitoringSchedule) => {
    const labels: Record<MonitoringSchedule, string> = {
      hourly: 'Hourly',
      daily: 'Daily',
      weekly: 'Weekly',
      on_push: 'On Push',
    };
    return labels[schedule];
  };

  return (
    <Card className={config.enabled ? '' : 'opacity-60'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{config.repoFullName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.enabled ? 'default' : 'secondary'}>
              {config.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              disabled={isLoading}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Schedule: {getScheduleLabel(config.schedule)}
              </span>
              <span>Last run: {formatDate(config.lastRunAt)}</span>
              <span>Tests: {config.testSpecs.length}</span>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Monitoring Schedule
                  </label>
                  <ScheduleSelector
                    value={config.schedule}
                    onChange={handleScheduleChange}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Monitoring Status
                  </label>
                  <Button
                    variant={config.enabled ? 'outline' : 'default'}
                    onClick={handleToggle}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {config.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  {config.nextRunAt && config.schedule !== 'on_push' && (
                    <span>Next run: {new Date(config.nextRunAt).toLocaleString()}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
