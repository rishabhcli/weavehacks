'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2, Rocket, Zap, Cloud, GitBranch, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TestSpec } from '@/lib/types';

interface NewRunDialogProps {
  onRunCreated?: (runId: string) => void;
}

interface ConnectedRepo {
  id: string;
  name: string;
  fullName: string;
  active?: boolean;
}

// Get connected repos from session storage (set by settings page)
function getConnectedRepos(): ConnectedRepo[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = sessionStorage.getItem('patchpilot_repos');
    if (stored) {
      const repos = JSON.parse(stored);
      return repos.filter((r: ConnectedRepo) => r.active);
    }
  } catch {
    // Ignore
  }

  return [];
}

export function NewRunDialog({ onRunCreated }: NewRunDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [maxIterations, setMaxIterations] = useState('5');
  const [availableTests, setAvailableTests] = useState<TestSpec[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [deploymentStep, setDeploymentStep] = useState<string | null>(null);
  const [loadingTests, setLoadingTests] = useState(false);

  useEffect(() => {
    const connectedRepos = getConnectedRepos();
    setRepos(connectedRepos);
    if (connectedRepos.length > 0 && !selectedRepo) {
      setSelectedRepo(connectedRepos[0].fullName);
    }
  }, [open, selectedRepo]);

  useEffect(() => {
    if (open) {
      setLoadingTests(true);
      fetch('/api/tests')
        .then((res) => res.json())
        .then((data) => {
          const specs = data.testSpecs || [];
          setAvailableTests(specs);
          // Auto-select all tests by default
          if (specs.length > 0) {
            setSelectedTests(specs.map((t: TestSpec) => t.id));
          }
        })
        .catch((err) => console.error('Failed to fetch tests:', err))
        .finally(() => setLoadingTests(false));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedRepo) {
      return;
    }

    setIsSubmitting(true);
    setDeploymentStep('Creating run...');

    try {
      // Get selected test specs
      const testSpecs = availableTests.filter((t) => selectedTests.includes(t.id));
      const repoInfo = repos.find((r) => r.fullName === selectedRepo);

      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repoInfo?.id || selectedRepo,
          repoName: repoInfo?.fullName || selectedRepo,
          testSpecs,
          maxIterations: parseInt(maxIterations, 10),
          // No targetUrl - will be determined by Vercel deployment
          cloudMode: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create run');
      }

      const data = await response.json();

      setDeploymentStep(null);
      setOpen(false);
      onRunCreated?.(data.run.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create run:', error);
      setDeploymentStep(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTest = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const hasConnectedRepos = repos.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
          <Rocket className="mr-2 h-4 w-4" />
          New Run
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Start New PatchPilot Run
          </DialogTitle>
          <DialogDescription>
            Select a GitHub repository and tests to run. PatchPilot will
            automatically deploy, test, fix bugs, and create PRs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Cloud Mode Banner */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <Cloud className="h-5 w-5 text-violet-400" />
            <div className="text-sm">
              <span className="font-medium text-violet-400">Cloud Mode</span>
              <span className="text-muted-foreground ml-1">
                — Tests run on Browserbase, patches create GitHub PRs
              </span>
            </div>
          </div>

          {/* Repository Selection */}
          <div className="grid gap-2">
            <Label htmlFor="repo" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              GitHub Repository
            </Label>
            {hasConnectedRepos ? (
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger id="repo">
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {repos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.fullName}>
                      {repo.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-yellow-500/30 bg-yellow-500/5 text-center">
                <p className="text-sm text-yellow-400 mb-2">
                  No repositories connected
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = '/dashboard/settings';
                  }}
                >
                  Connect GitHub
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              PatchPilot will deploy this repo and run tests against it
            </p>
          </div>

          {/* Max Iterations */}
          <div className="grid gap-2">
            <Label htmlFor="iterations">Max Fix Iterations</Label>
            <Select value={maxIterations} onValueChange={setMaxIterations}>
              <SelectTrigger id="iterations">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 iteration</SelectItem>
                <SelectItem value="3">3 iterations</SelectItem>
                <SelectItem value="5">5 iterations (recommended)</SelectItem>
                <SelectItem value="10">10 iterations</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How many times to retry fixing each failing test
            </p>
          </div>

          {/* Test Selection */}
          <div className="grid gap-2">
            <Label>Tests to Run</Label>
            {loadingTests ? (
              <div className="flex items-center justify-center p-8 border rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableTests.length > 0 ? (
              <div className="border rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {availableTests.map((test) => (
                  <label
                    key={test.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => toggleTest(test.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{test.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {test.steps.length} step{test.steps.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No test specs found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/dashboard/tests/new">
                    <Plus className="mr-2 h-3 w-3" />
                    Create Test Spec
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Deployment Progress */}
          {deploymentStep && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              <span className="text-sm">{deploymentStep}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedTests.length === 0 || !selectedRepo}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Run
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewRunDialog;
