'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  TestTube2,
  Search,
  Wrench,
  ShieldCheck,
  Play,
  CheckCircle,
  XCircle,
  Cpu,
  MousePointer,
  Image as ImageIcon,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { LLMCallViewer } from './llm-call-viewer';
import type { ActivityLogEntry as ActivityLogEntryType, AgentType, ActivityAction } from '@/lib/types';

interface ActivityLogEntryProps {
  entry: ActivityLogEntryType;
  className?: string;
}

const agentConfig: Record<AgentType, { icon: typeof TestTube2; color: string; bgColor: string }> = {
  tester: { icon: TestTube2, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  triage: { icon: Search, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  fixer: { icon: Wrench, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  verifier: { icon: ShieldCheck, color: 'text-green-400', bgColor: 'bg-green-500/20' },
};

const actionIcons: Record<ActivityAction, typeof Play> = {
  started: Play,
  completed: CheckCircle,
  failed: XCircle,
  llm_call: Cpu,
  test_step: MousePointer,
  diagnosis: Search,
  patch: Wrench,
  deploy: ShieldCheck,
  screenshot: ImageIcon,
  navigation: Navigation,
};

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function ActivityLogEntry({ entry, className }: ActivityLogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const agentInfo = agentConfig[entry.agent];
  const AgentIcon = agentInfo.icon;
  const ActionIcon = actionIcons[entry.action] || AlertCircle;
  const hasDetails = entry.details?.llmCall || entry.details?.error || entry.details?.screenshot;

  const isFailed = entry.action === 'failed';
  const isSuccess = entry.action === 'completed';

  return (
    <div
      className={cn(
        'group relative pl-4 border-l-2 transition-colors',
        isFailed && 'border-red-500/50',
        isSuccess && 'border-emerald-500/50',
        !isFailed && !isSuccess && 'border-border hover:border-muted-foreground/50',
        className
      )}
    >
      <div
        className={cn(
          'flex items-start gap-3 py-2 px-3 rounded-lg transition-colors cursor-pointer',
          hasDetails && 'hover:bg-muted/50'
        )}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        {/* Timestamp */}
        <span className="text-xs text-muted-foreground font-mono min-w-[64px]">
          {formatTimestamp(entry.timestamp)}
        </span>

        {/* Agent Badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
            agentInfo.bgColor,
            agentInfo.color
          )}
        >
          <AgentIcon className="h-3 w-3" />
          <span className="uppercase">{entry.agent}</span>
        </div>

        {/* Action Icon */}
        <ActionIcon
          className={cn(
            'h-4 w-4 flex-shrink-0 mt-0.5',
            isFailed && 'text-red-400',
            isSuccess && 'text-emerald-400',
            !isFailed && !isSuccess && 'text-muted-foreground'
          )}
        />

        {/* Message */}
        <span
          className={cn(
            'flex-1 text-sm',
            isFailed && 'text-red-400',
            isSuccess && 'text-emerald-400'
          )}
        >
          {entry.message}
        </span>

        {/* Expand indicator */}
        {hasDetails && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-[80px] pb-3 space-y-2">
              {/* LLM Call Details */}
              {entry.details?.llmCall && <LLMCallViewer llmCall={entry.details.llmCall} />}

              {/* Error Details */}
              {entry.details?.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400 font-medium mb-1">
                    {entry.details.error.message}
                  </p>
                  {entry.details.error.stack && (
                    <pre className="text-xs text-muted-foreground font-mono overflow-x-auto max-h-32 overflow-y-auto">
                      {entry.details.error.stack}
                    </pre>
                  )}
                </div>
              )}

              {/* Screenshot */}
              {entry.details?.screenshot && (
                <div className="rounded-lg overflow-hidden border">
                  <Image
                    src={entry.details.screenshot}
                    alt="Screenshot"
                    width={800}
                    height={400}
                    className="w-full h-auto max-h-48 object-cover"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
