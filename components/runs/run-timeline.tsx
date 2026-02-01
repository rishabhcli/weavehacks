'use client';

import {
  TestTube2,
  Search,
  Wrench,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AgentType, AgentStatus } from '@/lib/types';

interface TimelineEntry {
  agent: AgentType;
  status: AgentStatus;
  message?: string;
  timestamp?: string;
}

interface RunTimelineProps {
  currentAgent: AgentType | null;
  timeline: TimelineEntry[];
  className?: string;
}

const agentConfig: Record<
  AgentType,
  { label: string; icon: typeof TestTube2; color: string }
> = {
  tester: { label: 'Tester', icon: TestTube2, color: 'text-blue-400' },
  triage: { label: 'Triage', icon: Search, color: 'text-yellow-400' },
  fixer: { label: 'Fixer', icon: Wrench, color: 'text-purple-400' },
  verifier: { label: 'Verifier', icon: ShieldCheck, color: 'text-green-400' },
};

const agents: AgentType[] = ['tester', 'triage', 'fixer', 'verifier'];

export function RunTimeline({ currentAgent, timeline, className }: RunTimelineProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {agents.map((agent, index) => {
        const config = agentConfig[agent];
        const Icon = config.icon;
        const entry = timeline.find((t) => t.agent === agent);
        const isActive = currentAgent === agent;
        const isCompleted = entry?.status === 'completed';
        const isFailed = entry?.status === 'failed';

        return (
          <div key={agent} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  isActive && 'bg-primary/20 ring-2 ring-primary',
                  isCompleted && 'bg-success/20',
                  isFailed && 'bg-destructive/20',
                  !isActive && !isCompleted && !isFailed && 'bg-muted'
                )}
              >
                {isActive ? (
                  <Loader2 className={cn('h-5 w-5 animate-spin', config.color)} />
                ) : isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : isFailed ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <Icon className={cn('h-5 w-5', config.color)} />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{config.label}</p>
                {entry?.timestamp && (
                  <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                )}
              </div>
            </div>
            {index < agents.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 transition-colors',
                  isCompleted ? 'bg-success' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
