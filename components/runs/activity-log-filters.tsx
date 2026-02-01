'use client';

import { TestTube2, Search, Wrench, ShieldCheck, Filter } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AgentType, ActivityAction } from '@/lib/types';

interface ActivityLogFiltersProps {
  selectedAgents: AgentType[];
  selectedActions: ActivityAction[];
  onAgentToggle: (agent: AgentType) => void;
  onActionToggle: (action: ActivityAction) => void;
  onClearAll: () => void;
  className?: string;
}

const agentConfig: Record<AgentType, { label: string; icon: typeof TestTube2; color: string }> = {
  tester: { label: 'Tester', icon: TestTube2, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  triage: { label: 'Triage', icon: Search, color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  fixer: { label: 'Fixer', icon: Wrench, color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  verifier: { label: 'Verifier', icon: ShieldCheck, color: 'text-green-400 bg-green-500/20 border-green-500/30' },
};

const actionTypes: { action: ActivityAction; label: string }[] = [
  { action: 'started', label: 'Started' },
  { action: 'completed', label: 'Completed' },
  { action: 'failed', label: 'Failed' },
  { action: 'llm_call', label: 'LLM Calls' },
  { action: 'test_step', label: 'Test Steps' },
];

export function ActivityLogFilters({
  selectedAgents,
  selectedActions,
  onAgentToggle,
  onActionToggle,
  onClearAll,
  className,
}: ActivityLogFiltersProps) {
  const hasFilters = selectedAgents.length > 0 || selectedActions.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        {hasFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Agent Filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(agentConfig) as AgentType[]).map((agent) => {
          const config = agentConfig[agent];
          const Icon = config.icon;
          const isSelected = selectedAgents.includes(agent);

          return (
            <button
              key={agent}
              onClick={() => onAgentToggle(agent)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                isSelected
                  ? config.color
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Action Type Filters */}
      <div className="flex flex-wrap gap-2">
        {actionTypes.map(({ action, label }) => {
          const isSelected = selectedActions.includes(action);

          return (
            <button
              key={action}
              onClick={() => onActionToggle(action)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                isSelected
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
