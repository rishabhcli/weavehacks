'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScheduleSelector } from './schedule-selector';
import type { MonitoringSchedule, GitHubRepo } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddRepoDialogProps {
  repos: GitHubRepo[];
  existingRepoIds: string[];
  onAdd: (repoId: string, repoFullName: string, schedule: MonitoringSchedule) => Promise<void>;
}

export function AddRepoDialog({ repos, existingRepoIds, onAdd }: AddRepoDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [schedule, setSchedule] = useState<MonitoringSchedule>('on_push');
  const [isLoading, setIsLoading] = useState(false);

  const availableRepos = repos.filter(
    (repo) => !existingRepoIds.includes(repo.id.toString())
  );

  const handleSubmit = async () => {
    if (!selectedRepoId) return;

    const repo = repos.find((r) => r.id.toString() === selectedRepoId);
    if (!repo) return;

    setIsLoading(true);
    try {
      await onAdd(selectedRepoId, repo.fullName, schedule);
      setOpen(false);
      setSelectedRepoId('');
      setSchedule('on_push');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Repository
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Repository for Monitoring</DialogTitle>
          <DialogDescription>
            Select a repository to enable continuous monitoring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Repository</Label>
            {availableRepos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All your repositories are already being monitored, or you need to connect more repositories.
              </p>
            ) : (
              <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {availableRepos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id.toString()}>
                      {repo.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Monitoring Schedule</Label>
            <ScheduleSelector
              value={schedule}
              onChange={setSchedule}
              disabled={!selectedRepoId}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedRepoId || isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Repository'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
