'use client';

import { useState, useEffect } from 'react';
import { Monitor, Maximize2, ExternalLink, Loader2, WifiOff, Play } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface SessionDebugInfo {
  hasSession: boolean;
  sessionId?: string;
  debuggerUrl?: string;
  debuggerFullscreenUrl?: string;
  wsUrl?: string;
  isActive?: boolean;
  error?: string;
  message?: string;
}

interface LiveBrowserViewerProps {
  runId: string;
  isRunning?: boolean;
  className?: string;
}

export function LiveBrowserViewer({ runId, isRunning = false, className }: LiveBrowserViewerProps) {
  const [sessionInfo, setSessionInfo] = useState<SessionDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}/session`, { credentials: 'include' });
        if (!res.ok) {
          throw new Error('Failed to fetch session');
        }
        const data: SessionDebugInfo = await res.json();
        if (isMounted) {
          setSessionInfo(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSession();

    // Poll for session updates while running
    const interval = setInterval(() => {
      if (isRunning) {
        fetchSession();
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [runId, isRunning]);

  const handleFullscreen = () => {
    if (sessionInfo?.debuggerFullscreenUrl) {
      window.open(sessionInfo.debuggerFullscreenUrl, '_blank');
    }
    setIsFullscreen(true);
  };

  const handleExternalLink = () => {
    if (sessionInfo?.debuggerUrl) {
      window.open(sessionInfo.debuggerUrl, '_blank');
    }
  };

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Live Browser
            {isRunning && sessionInfo?.hasSession && (
              <motion.span
                className="relative flex h-2 w-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green shadow-[0_0_8px_hsl(var(--neon-green)/0.8)]" />
              </motion.span>
            )}
          </CardTitle>
          {sessionInfo?.hasSession && sessionInfo.debuggerUrl && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleFullscreen} title="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleExternalLink} title="Open in new tab">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0">
        <div className="aspect-video bg-black/90 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Connecting to browser session...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <WifiOff className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground mb-2">Failed to connect to browser session</p>
              <p className="text-xs text-muted-foreground/70">{error}</p>
            </div>
          ) : !sessionInfo?.hasSession ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border border-neon-cyan/30 flex items-center justify-center mb-4">
                <Monitor className="h-8 w-8 text-neon-cyan opacity-70" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">No active browser session</p>
              <p className="text-xs text-muted-foreground/70">
                {sessionInfo?.message || 'A browser window will appear here when a test starts'}
              </p>
            </div>
          ) : sessionInfo.debuggerUrl ? (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <iframe
                src={sessionInfo.debuggerUrl}
                className="w-full h-full border-0"
                allow="clipboard-read; clipboard-write"
                title="Live Browser Session"
              />
              {/* Live indicator overlay */}
              {isRunning && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 text-neon-green px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border border-neon-green/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
                  </span>
                  LIVE
                </div>
              )}
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <Play className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">Session started but no debugger URL available</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Session info footer */}
      {sessionInfo?.hasSession && sessionInfo.sessionId && (
        <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground flex items-center justify-between">
          <span className="font-mono truncate max-w-[200px]">
            Session: {sessionInfo.sessionId.slice(0, 12)}...
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded-full',
            sessionInfo.isActive
              ? 'bg-neon-green/20 text-neon-green'
              : 'bg-muted text-muted-foreground'
          )}>
            {sessionInfo.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      )}
    </Card>
  );
}
