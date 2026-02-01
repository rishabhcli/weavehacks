'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Pause, Play, Filter, ChevronDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityLogEntry } from './activity-log-entry';
import { ActivityLogFilters } from './activity-log-filters';
import type { ActivityLogEntry as ActivityLogEntryType, AgentType, ActivityAction } from '@/lib/types';

interface ActivityLogProps {
  entries: ActivityLogEntryType[];
  isLive?: boolean;
  className?: string;
}

export function ActivityLog({ entries, isLive = true, className }: ActivityLogProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<AgentType[]>([]);
  const [selectedActions, setSelectedActions] = useState<ActivityAction[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Filter entries based on selected filters
  const filteredEntries = entries.filter((entry) => {
    if (selectedAgents.length > 0 && !selectedAgents.includes(entry.agent)) {
      return false;
    }
    if (selectedActions.length > 0 && !selectedActions.includes(entry.action)) {
      return false;
    }
    return true;
  });

  // Display entries (reversed if not paused for newest first, or oldest first when paused)
  const displayEntries = isPaused ? [...filteredEntries] : [...filteredEntries];

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

  const handleAgentToggle = (agent: AgentType) => {
    setSelectedAgents((prev) =>
      prev.includes(agent) ? prev.filter((a) => a !== agent) : [...prev, agent]
    );
  };

  const handleActionToggle = (action: ActivityAction) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleClearFilters = () => {
    setSelectedAgents([]);
    setSelectedActions([]);
  };

  const hasActiveFilters = selectedAgents.length > 0 || selectedActions.length > 0;

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Activity Log
            {isLive && !isPaused && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(hasActiveFilters && 'text-primary')}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-xs">
                  {selectedAgents.length + selectedActions.length}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ActivityLogFilters
                selectedAgents={selectedAgents}
                selectedActions={selectedActions}
                onAgentToggle={handleAgentToggle}
                onActionToggle={handleActionToggle}
                onClearAll={handleClearFilters}
                className="pt-3"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[400px] p-4"
        >
          {displayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Trash2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? 'No entries match the selected filters' : 'No activity yet'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {displayEntries.map((entry) => (
                <ActivityLogEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Auto-scroll indicator */}
        {!autoScroll && !isPaused && entries.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setAutoScroll(true);
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }}
              className="shadow-lg"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              New activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
