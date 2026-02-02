'use client';

import { useState, useEffect } from 'react';
import { Loader2, Rocket, Zap, GitBranch, Wand2, Sparkles, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useSession } from '@/lib/hooks/use-session';

interface NewRunDialogProps {
  onRunCreated?: (runId: string) => void;
}

interface ConnectedRepo {
  id: string;
  name: string;
  fullName: string;
  active?: boolean;
  url?: string;
}

// Get connected repos from session storage (set by settings page)
function getConnectedRepos(): ConnectedRepo[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = sessionStorage.getItem('qagent_repos');
    if (stored) {
      const repos = JSON.parse(stored);
      return repos.filter((r: ConnectedRepo) => r.active);
    }
  } catch {
    // Ignore
  }

  return [];
}

// Updated: cache bust v3 - now uses useSession as fallback
export function NewRunDialog({ onRunCreated }: NewRunDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const { repos: sessionRepos, isAuthenticated } = useSession();

  // Run state
  const [targetUrl, setTargetUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateStatus, setGenerateStatus] = useState('');

  useEffect(() => {
    // First try sessionStorage (set by Settings page)
    let connectedRepos = getConnectedRepos();
    
    // Fallback to useSession hook if sessionStorage is empty
    if (connectedRepos.length === 0 && isAuthenticated && sessionRepos.length > 0) {
      connectedRepos = sessionRepos.map((r) => ({
        id: String(r.id),
        name: r.name,
        fullName: r.fullName,
        url: r.url,
        active: true,
      }));
      // Also store in sessionStorage for future use
      try {
        sessionStorage.setItem('qagent_repos', JSON.stringify(connectedRepos));
      } catch {
        // Ignore storage errors
      }
    }
    
    setRepos(connectedRepos);
    if (connectedRepos.length > 0 && !selectedRepo) {
      setSelectedRepo(connectedRepos[0].fullName);
    }
  }, [open, selectedRepo, sessionRepos, isAuthenticated]);

  const handleQuickStart = async () => {
    if (!selectedRepo) return; // Only repo is required, URL is optional

    setIsGenerating(true);
    setGenerateProgress(5);
    setGenerateStatus('Cloning repository...');

    try {
      const repoInfo = repos.find((r) => r.fullName === selectedRepo);

      console.log('[NewRunDialog] CODE-FIRST run for repo:', selectedRepo);
      if (targetUrl) {
        console.log('[NewRunDialog] Optional URL:', targetUrl);
      }

      // Progress updates for CODE-FIRST workflow
      const progressInterval = setInterval(() => {
        setGenerateProgress((p) => {
          if (p < 15) {
            setGenerateStatus('Cloning repository...');
            return p + 1;
          } else if (p < 30) {
            setGenerateStatus('Installing dependencies...');
            return p + 0.5;
          } else if (p < 50) {
            setGenerateStatus('Analyzing code...');
            return p + 0.5;
          } else if (p < 70) {
            setGenerateStatus('Finding issues...');
            return p + 0.3;
          } else if (p < 85) {
            setGenerateStatus('Generating fixes...');
            return p + 0.2;
          } else if (p < 95) {
            setGenerateStatus('Creating PRs...');
            return p + 0.1;
          }
          return p;
        });
      }, 500);

      // Start CODE-FIRST run - URL is optional
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repoId: repoInfo?.id || selectedRepo,
          repoName: repoInfo?.fullName || selectedRepo,
          targetUrl: targetUrl || undefined, // Optional
          maxIterations: 5,
          cloudMode: true,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to start run');
      }

      const data = await response.json();
      setGenerateProgress(100);
      setGenerateStatus('Run started!');

      setTimeout(() => {
        setOpen(false);
        onRunCreated?.(data.run.id);
      }, 500);
    } catch (error) {
      console.error('Run failed:', error);
      setGenerateStatus('Failed to start run');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasConnectedRepos = repos.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          data-new-run-trigger
        >
          <Rocket className="mr-2 h-4 w-4" />
          New Run
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Start New QAgent Run
          </DialogTitle>
          <DialogDescription>
            QAgent will analyze your code, find bugs, and create fix PRs on GitHub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
            {/* Code Analysis Banner */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-neon-cyan/10 to-neon-violet/10 border border-neon-cyan/30">
              <Sparkles className="h-5 w-5 text-neon-cyan" />
              <div className="text-sm">
                <span className="font-medium text-neon-cyan">Analyze & Fix Code</span>
                <span className="text-muted-foreground ml-1">
                  — Checks TypeScript, ESLint, build errors and creates fix PRs
                </span>
              </div>
            </div>

            {/* Repository Selection */}
            <div className="grid gap-2">
              <Label htmlFor="quick-repo" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                GitHub Repository
              </Label>
              {hasConnectedRepos ? (
                <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                  <SelectTrigger id="quick-repo">
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
            </div>

            {/* Optional: Target URL for browser testing */}
            <div className="grid gap-2">
              <Label htmlFor="target-url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Deployed URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="target-url"
                type="url"
                placeholder="https://your-app.vercel.app"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Provide a public URL to run Browserbase tests. If empty, browser tests are skipped.
              </p>
            </div>

            {/* Run Progress */}
            {isGenerating && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
                  <span className="text-sm font-medium">{generateStatus}</span>
                </div>
                <Progress value={generateProgress} className="h-2" />
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleQuickStart}
                disabled={isGenerating || !selectedRepo}
                className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Analyze & Fix
                  </>
                )}
              </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewRunDialog;
