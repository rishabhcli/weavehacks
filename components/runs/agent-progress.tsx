'use client';

import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AgentStatus } from '@/lib/types';

interface AgentProgressProps {
  agent: string;
  status: AgentStatus;
  message?: string;
  className?: string;
}

export function AgentProgress({ agent, status, message, className }: AgentProgressProps) {
  const StatusIcon =
    status === 'running'
      ? Loader2
      : status === 'completed'
        ? CheckCircle
        : status === 'failed'
          ? XCircle
          : Clock;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        status === 'running' && 'bg-primary/5 border-primary/20',
        status === 'completed' && 'bg-success/5 border-success/20',
        status === 'failed' && 'bg-destructive/5 border-destructive/20',
        status === 'idle' && 'bg-muted border-border',
        className
      )}
    >
      <StatusIcon
        className={cn(
          'h-5 w-5',
          status === 'running' && 'text-primary animate-spin',
          status === 'completed' && 'text-success',
          status === 'failed' && 'text-destructive',
          status === 'idle' && 'text-muted-foreground'
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm capitalize">{agent}</p>
        {message && (
          <p className="text-xs text-muted-foreground truncate">{message}</p>
        )}
      </div>
      <span
        className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          status === 'running' && 'bg-primary/10 text-primary',
          status === 'completed' && 'bg-success/10 text-success',
          status === 'failed' && 'bg-destructive/10 text-destructive',
          status === 'idle' && 'bg-muted text-muted-foreground'
        )}
      >
        {status}
      </span>
    </div>
  );
}
