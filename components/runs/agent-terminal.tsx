'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, ChevronDown, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityLogEntry, AgentType } from '@/lib/types';

interface AgentTerminalProps {
  entries: ActivityLogEntry[];
  isLive?: boolean;
  className?: string;
}

const agentColors: Record<AgentType, string> = {
  tester: 'text-blue-400',
  triage: 'text-yellow-400',
  fixer: 'text-purple-400',
  verifier: 'text-emerald-400',
};

const agentLabels: Record<AgentType, string> = {
  tester: 'TESTER',
  triage: 'TRIAGE',
  fixer: 'FIXER',
  verifier: 'VERIFY',
};

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

interface TerminalLineProps {
  entry: ActivityLogEntry;
}

function TerminalLine({ entry }: TerminalLineProps) {
  const color = agentColors[entry.agent];
  const label = agentLabels[entry.agent];

  return (
    <motion.div
      className="flex items-start gap-2 py-0.5 font-mono text-sm leading-relaxed"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-gray-500 shrink-0 select-none">
        [{formatTimestamp(entry.timestamp)}]
      </span>
      <span className={cn('shrink-0 font-semibold', color)}>
        [{label}]
      </span>
      <span className="text-gray-200">
        {entry.message}
        {entry.details?.url && (
          <span className="text-cyan-400 ml-1">({entry.details.url})</span>
        )}
        {entry.details?.llmCall && (
          <span className="text-gray-500 ml-1">
            [{entry.details.llmCall.tokens} tokens, {entry.details.llmCall.duration}ms]
          </span>
        )}
        {entry.details?.testStep?.passed !== undefined && (
          <span className={cn(
            'ml-1',
            entry.details.testStep.passed ? 'text-emerald-400' : 'text-red-400'
          )}>
            {entry.details.testStep.passed ? '  PASS' : '  FAIL'}
          </span>
        )}
        {entry.details?.error && (
          <span className="text-red-400 ml-1">
            Error: {entry.details.error.message}
          </span>
        )}
      </span>
    </motion.div>
  );
}

export function AgentTerminal({ entries, isLive = true, className }: AgentTerminalProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && !isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, autoScroll, isPaused]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  }, []);

  return (
    <Card className={cn('flex flex-col bg-[#0d1117] border-gray-800 overflow-hidden', className)}>
      <CardHeader className="pb-2 pt-3 px-4 border-b border-gray-800 bg-[#161b22]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-gray-200">
            <Terminal className="h-4 w-4 text-gray-400" />
            Agent Terminal
            {isLive && !isPaused && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="h-7 px-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          >
            {isPaused ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                <span className="text-xs">Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                <span className="text-xs">Pause</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0 relative">
        <ScrollArea
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[350px]"
        >
          <div className="p-3">
            {entries.length === 0 ? (
              <div className="flex items-center justify-center h-full py-12">
                <p className="text-sm text-gray-500 font-mono">Waiting for agent activity...</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {entries.map((entry) => (
                  <TerminalLine key={entry.id} entry={entry} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* New activity indicator */}
        {!autoScroll && !isPaused && entries.length > 0 && (
          <motion.div
            className="absolute bottom-3 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAutoScroll(true);
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }}
              className="h-7 text-xs bg-gray-900/90 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              New output
            </Button>
          </motion.div>
        )}
      </CardContent>

      {/* Terminal prompt line */}
      <div className="px-3 py-2 border-t border-gray-800 bg-[#161b22]">
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-emerald-400">$</span>
          <span className="text-gray-500">
            {isLive && !isPaused ? (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
              >
                _
              </motion.span>
            ) : (
              '(paused)'
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}
