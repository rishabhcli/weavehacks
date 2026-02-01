'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, CheckCircle, Clock, ExternalLink, Filter, Eye, Loader2, RefreshCw, Wrench } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface PatchDiagnosis {
  type: string;
  confidence: number;
  rootCause: string;
}

interface Patch {
  id: string;
  file: string;
  description: string;
  diff: string;
  linesAdded: number;
  linesRemoved: number;
  status: 'applied' | 'pending';
  runId: string;
  createdAt: string;
  prUrl?: string;
  diagnosis?: PatchDiagnosis;
}

const statusConfig = {
  applied: { label: 'Applied', variant: 'success' as const, icon: CheckCircle },
  pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
};

export default function PatchesPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [selectedPatch, setSelectedPatch] = useState<Patch | null>(null);

  const fetchPatches = useCallback(async () => {
    try {
      const res = await fetch('/api/patches');
      if (res.ok) {
        const data = await res.json();
        setPatches(data.patches || []);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch patches:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatches();
  }, [fetchPatches]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPatches();
  };

  const filteredPatches = filter === 'all' ? patches : patches.filter((p) => p.status === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Patches" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Patches" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            View all auto-generated patches and their application status.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {filter === 'all' ? 'All Status' : statusConfig[filter as keyof typeof statusConfig]?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('applied')}>Applied</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('pending')}>Pending</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Patches List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Patches ({patches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Wrench className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No patches yet</h3>
                  <p className="text-muted-foreground">
                    Patches will appear here after runs generate fixes.
                  </p>
                </div>
              ) : (
                filteredPatches.map((patch) => {
                  const config = statusConfig[patch.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={patch.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-primary/10">
                          <GitBranch className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">{patch.file}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {patch.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-success">+{patch.linesAdded}</span>
                            <span className="text-destructive">-{patch.linesRemoved}</span>
                            <span className="text-muted-foreground">
                              Run #{patch.runId?.slice(0, 8)} · {formatDate(patch.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={config.variant}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPatch(patch)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        {patch.prUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={patch.prUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patch Detail Dialog */}
      <Dialog open={!!selectedPatch} onOpenChange={() => setSelectedPatch(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{selectedPatch?.file}</DialogTitle>
            <DialogDescription>{selectedPatch?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Diagnosis */}
            {selectedPatch?.diagnosis && (
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="text-sm font-medium mb-2">Diagnosis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedPatch.diagnosis.type}</Badge>
                    <span className="text-muted-foreground">
                      {(selectedPatch.diagnosis.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-muted-foreground">{selectedPatch.diagnosis.rootCause}</p>
                </div>
              </div>
            )}

            {/* Diff */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">Diff</span>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto bg-background max-h-96">
                {selectedPatch?.diff ? (
                  selectedPatch.diff.split('\n').map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.startsWith('+') && !line.startsWith('+++')
                          ? 'text-success bg-success/10'
                          : line.startsWith('-') && !line.startsWith('---')
                            ? 'text-destructive bg-destructive/10'
                            : line.startsWith('@@')
                              ? 'text-primary'
                              : 'text-muted-foreground'
                      }
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground">No diff available</span>
                )}
              </pre>
            </div>
          </div>
          <DialogFooter>
            {selectedPatch?.prUrl && (
              <Button asChild>
                <a href={selectedPatch.prUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Pull Request
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
