'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Activity, BarChart3, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

interface WeaveMetrics {
  enabled: boolean;
  metrics?: {
    overall: {
      totalRuns: number;
      successfulRuns: number;
      failedRuns: number;
      avgIterations: number;
      avgDurationMs: number;
      totalPatches: number;
      knowledgeReuseRate: number;
    };
    links: {
      project: string;
      traces: string;
      evaluations: string;
      datasets: string;
    };
  };
}

export function WeavePanel() {
  const [metrics, setMetrics] = useState<WeaveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/weave/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 animate-pulse text-violet-400" />
          <span className="text-sm text-muted-foreground">Loading Weave metrics...</span>
        </div>
      </GlassCard>
    );
  }

  if (error || !metrics) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load Weave metrics</span>
        </div>
      </GlassCard>
    );
  }

  if (!metrics.enabled) {
    return (
      <GlassCard className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-sm font-medium">W&B Weave</span>
            <span className="text-xs text-muted-foreground">Not Connected</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Set WANDB_API_KEY to enable observability and tracing.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium">W&B Weave</span>
          <span className="text-xs text-green-400">Connected</span>
        </div>
        {metrics.metrics?.links.project && (
          <a
            href={metrics.metrics.links.project}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            Open Dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Quick Stats */}
      {metrics.metrics?.overall && (
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {metrics.metrics.overall.totalRuns}
            </div>
            <div className="text-[10px] text-muted-foreground">Total Runs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {metrics.metrics.overall.successfulRuns}
            </div>
            <div className="text-[10px] text-muted-foreground">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">
              {metrics.metrics.overall.failedRuns}
            </div>
            <div className="text-[10px] text-muted-foreground">Failed</div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      {metrics.metrics?.links && (
        <div className="flex flex-wrap gap-2">
          <a
            href={metrics.metrics.links.traces}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-card/50 hover:bg-card transition-colors"
          >
            <Activity className="h-3 w-3 text-violet-400" />
            Traces
          </a>
          <a
            href={metrics.metrics.links.evaluations}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-card/50 hover:bg-card transition-colors"
          >
            <BarChart3 className="h-3 w-3 text-cyan-400" />
            Evaluations
          </a>
        </div>
      )}
    </GlassCard>
  );
}

/**
 * Feedback buttons for runs
 */
export function RunFeedback({ runId }: { runId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitFeedback(positive: boolean) {
    setLoading(true);
    try {
      await fetch('/api/weave/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          type: 'thumbs',
          value: positive,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-400">
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Was this helpful?</span>
      <button
        onClick={() => submitFeedback(true)}
        disabled={loading}
        className="p-1 rounded hover:bg-green-500/20 transition-colors disabled:opacity-50"
        title="Yes, this was helpful"
      >
        <ThumbsUp className="h-3.5 w-3.5 text-green-400" />
      </button>
      <button
        onClick={() => submitFeedback(false)}
        disabled={loading}
        className="p-1 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
        title="No, this wasn't helpful"
      >
        <ThumbsDown className="h-3.5 w-3.5 text-red-400" />
      </button>
    </div>
  );
}
