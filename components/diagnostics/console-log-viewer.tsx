'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Terminal, Filter } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import type { ConsoleLog } from '@/lib/types';

interface ConsoleLogViewerProps {
  logs: ConsoleLog[];
  className?: string;
}

const logTypeConfig = {
  log: {
    icon: Terminal,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    label: 'Log',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    label: 'Error',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    label: 'Warning',
  },
  uncaught: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    label: 'Uncaught',
  },
};

type LogType = keyof typeof logTypeConfig;

export function ConsoleLogViewer({ logs, className }: ConsoleLogViewerProps) {
  const [filterType, setFilterType] = useState<LogType | 'all'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const logCounts = logs.reduce(
    (acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
          <Filter className="h-3 w-3" />
          <span>Filter:</span>
        </div>
        <Button
          size="sm"
          variant={filterType === 'all' ? 'secondary' : 'ghost'}
          onClick={() => setFilterType('all')}
          className="h-7 text-xs"
        >
          All ({logs.length})
        </Button>
        {(Object.keys(logTypeConfig) as LogType[]).map((type) => {
          const config = logTypeConfig[type];
          const count = logCounts[type] || 0;
          if (count === 0) return null;
          return (
            <Button
              key={type}
              size="sm"
              variant={filterType === type ? 'secondary' : 'ghost'}
              onClick={() => setFilterType(type)}
              className={cn('h-7 text-xs', filterType === type && config.color)}
            >
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Log Entries */}
      <div className="space-y-1 max-h-64 overflow-y-auto rounded-lg border bg-background p-2">
        {filteredLogs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No logs to display</p>
        ) : (
          filteredLogs.map((log, index) => {
            const config = logTypeConfig[log.type];
            const Icon = config.icon;
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              fractionalSecondDigits: 3,
              hour12: false,
            });

            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-2 px-2 py-1.5 rounded text-xs font-mono',
                  config.bgColor
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 flex-shrink-0 mt-0.5', config.color)} />
                <span className="text-muted-foreground flex-shrink-0">[{time}]</span>
                <span className={cn('flex-1 break-all', config.color)}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
