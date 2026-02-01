'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2, Rocket, Zap, Cloud, GitBranch, CheckCircle, Plus, Wand2, Sparkles, Globe } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { TestSpec } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

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
  const [activeTab, setActiveTab] = useState<'quick' | 'advanced'>('quick');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [maxIterations, setMaxIterations] = useState('5');
  const [availableTests, setAvailableTests] = useState<TestSpec[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [deploymentStep, setDeploymentStep] = useState<string | null>(null);
  const [loadingTests, setLoadingTests] = useState(false);

  // Quick Start state
  const [quickStartUrl, setQuickStartUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateStatus, setGenerateStatus] = useState('');
  const [generatedTests, setGeneratedTests] = useState<TestSpec[]>([]);

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
      fetch('/api/tests', { credentials: 'include' })
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
        credentials: 'include',
        body: JSON.stringify({
          repoId: repoInfo?.id || selectedRepo,
          repoName: repoInfo?.fullName || selectedRepo,
          testSpecs,
          maxIterations: parseInt(maxIterations, 10),
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
      console.error('Failed to create run:', error);
      setDeploymentStep(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStart = async () => {
    if (!selectedRepo) return;

    setIsGenerating(true);
    setGenerateProgress(10);
    setGenerateStatus('Connecting to browser...');
    setGeneratedTests([]);

    try {
      // Get the repo URL or use quickStartUrl
      const repoInfo = repos.find((r) => r.fullName === selectedRepo);
      const targetUrl = quickStartUrl || repoInfo?.url || `https://${selectedRepo.split('/')[1]}.vercel.app`;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerateProgress((p) => {
          if (p < 30) {
            setGenerateStatus('Navigating to website...');
            return p + 2;
          } else if (p < 50) {
            setGenerateStatus('Discovering interactive elements...');
            return p + 1;
          } else if (p < 70) {
            setGenerateStatus('Analyzing user flows...');
            return p + 0.5;
          } else if (p < 85) {
            setGenerateStatus('Generating test specifications...');
            return p + 0.3;
          }
          return p;
        });
      }, 500);

      // Generate tests
      const generateRes = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          url: targetUrl,
          options: { maxPages: 3, maxDepth: 2 },
        }),
      });

      clearInterval(progressInterval);

      if (!generateRes.ok) {
        throw new Error('Failed to generate tests');
      }

      const generateData = await generateRes.json();
      setGeneratedTests(generateData.testSpecs || []);
      setGenerateProgress(90);
      setGenerateStatus('Starting run...');

      // Create and start the run with generated tests
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repoId: repoInfo?.id || selectedRepo,
          repoName: repoInfo?.fullName || selectedRepo,
          testSpecs: generateData.testSpecs || [],
          maxIterations: 5,
          cloudMode: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create run');
      }

      const data = await response.json();
      setGenerateProgress(100);
      setGenerateStatus('Complete!');

      setTimeout(() => {
        setOpen(false);
        onRunCreated?.(data.run.id);
      }, 500);
    } catch (error) {
      console.error('Quick start failed:', error);
      setGenerateStatus('Failed to generate tests');
    } finally {
      setIsGenerating(false);
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
  const hasExistingTests = availableTests.length > 0;

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
            Start New PatchPilot Run
          </DialogTitle>
          <DialogDescription>
            Choose Quick Start to auto-generate tests, or Advanced mode to select existing tests.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'advanced')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quick" className="space-y-4 pt-4">
            {/* Cloud Mode Banner */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-neon-cyan/10 to-neon-violet/10 border border-neon-cyan/30">
              <Sparkles className="h-5 w-5 text-neon-cyan" />
              <div className="text-sm">
                <span className="font-medium text-neon-cyan">Auto-Generate & Run</span>
                <span className="text-muted-foreground ml-1">
                  — PatchPilot will crawl your app and create tests
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

            {/* Optional URL Override */}
            <div className="grid gap-2">
              <Label htmlFor="quick-url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Target URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="quick-url"
                type="url"
                placeholder="https://your-app.vercel.app"
                value={quickStartUrl}
                onChange={(e) => setQuickStartUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-detect from Vercel deployment
              </p>
            </div>

            {/* Generation Progress */}
            {isGenerating && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
                  <span className="text-sm font-medium">{generateStatus}</span>
                </div>
                <Progress value={generateProgress} className="h-2" />
                {generatedTests.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Found {generatedTests.length} testable flows
                  </p>
                )}
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
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Auto-Generate & Run
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 pt-4">
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
              ) : hasExistingTests ? (
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
                  <div className="flex items-center justify-center gap-2">
                    <Link 
                      href="/dashboard/tests/new"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Create Test
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('quick')}
                    >
                      <Wand2 className="mr-2 h-3 w-3" />
                      Auto-Generate
                    </Button>
                  </div>
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

            <DialogFooter className="pt-4">
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
                    Run {selectedTests.length} Test{selectedTests.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default NewRunDialog;
