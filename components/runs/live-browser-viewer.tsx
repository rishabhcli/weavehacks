'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Maximize2,
  ExternalLink,
  Loader2,
  WifiOff,
  Play,
  RefreshCw,
  Eye,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

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

export function LiveBrowserViewer({
  runId,
  isRunning = false,
  className,
}: LiveBrowserViewerProps) {
  const [sessionInfo, setSessionInfo] = useState<SessionDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}/session`, {
          credentials: 'include',
        });
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
  };

  const handleExternalLink = () => {
    if (sessionInfo?.debuggerUrl) {
      window.open(sessionInfo.debuggerUrl, '_blank');
    }
  };

  const handleRefresh = () => {
    setIframeLoaded(false);
    setRetryCount((prev) => prev + 1);
    if (iframeRef.current && sessionInfo?.debuggerUrl) {
      iframeRef.current.src = sessionInfo.debuggerUrl + '?t=' + Date.now();
    }
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden border-2',
        isRunning && sessionInfo?.hasSession
          ? 'border-neon-cyan/30 shadow-[0_0_30px_hsl(var(--neon-cyan)/0.15)]'
          : 'border-border',
        className
      )}
    >
      {/* Browserbase-style header */}
      <CardHeader className="pb-3 bg-gradient-to-r from-[#0d0d0d] to-[#1a1a2e] border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              {isRunning && sessionInfo?.hasSession && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green shadow-[0_0_8px_hsl(var(--neon-green)/0.8)]" />
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white flex items-center gap-2">
                Live Browser
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">
                  BROWSERBASE
                </span>
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {sessionInfo?.hasSession
                  ? sessionInfo.isActive
                    ? 'Streaming live browser session'
                    : 'Session available'
                  : 'Waiting for session...'}
              </span>
            </div>
          </CardTitle>
          {sessionInfo?.hasSession && sessionInfo.debuggerUrl && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                title="Refresh"
                className="hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                title="Fullscreen"
                className="hover:bg-white/10"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExternalLink}
                title="Open in new tab"
                className="hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0 relative">
        {/* Browser chrome mockup */}
        <div className="bg-[#2a2a3e] border-b border-white/5 px-3 py-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-[#1a1a2e] rounded-md px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground max-w-md">
              <Eye className="h-3 w-3" />
              <span className="truncate">
                {sessionInfo?.hasSession
                  ? 'browserbase.com/session/' +
                    (sessionInfo.sessionId?.slice(0, 8) || '...')
                  : 'No active session'}
              </span>
            </div>
          </div>
        </div>

        {/* Browser viewport */}
        <div className="aspect-video bg-[#0a0a0f] relative overflow-hidden">
          {/* Scanline effect overlay for visual flair */}
          <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px]" />

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4 border border-orange-500/30">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connecting to browser session...
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Powered by Browserbase
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                  <WifiOff className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-sm text-red-400 mb-2">
                  Failed to connect to browser session
                </p>
                <p className="text-xs text-muted-foreground/70 max-w-xs">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRetryCount((prev) => prev + 1)}
                  className="mt-4"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Retry
                </Button>
              </motion.div>
            ) : !sessionInfo?.hasSession ? (
              <motion.div
                key="no-session"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-neon-violet/10 border border-neon-cyan/20 flex items-center justify-center">
                    <Monitor className="h-10 w-10 text-neon-cyan/60" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">
                  No active browser session
                </p>
                <p className="text-xs text-muted-foreground/70 max-w-xs">
                  {sessionInfo?.message ||
                    'A live browser window will appear here when a test starts running'}
                </p>
              </motion.div>
            ) : sessionInfo.debuggerUrl ? (
              <motion.div
                key="iframe"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                {/* Loading overlay while iframe loads */}
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f] z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                  </div>
                )}

                <iframe
                  ref={iframeRef}
                  key={retryCount}
                  src={sessionInfo.debuggerUrl}
                  className="w-full h-full border-0"
                  allow="clipboard-read; clipboard-write"
                  title="Live Browser Session - Browserbase"
                  onLoad={handleIframeLoad}
                />

                {/* Live indicator overlay */}
                {isRunning && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md text-neon-green px-3 py-1.5 rounded-full text-xs font-medium border border-neon-green/30 shadow-[0_0_15px_hsl(var(--neon-green)/0.3)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
                    </span>
                    LIVE
                  </div>
                )}

                {/* Browserbase branding */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] text-muted-foreground border border-white/10">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-500 to-red-600" />
                  Browserbase
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-debugger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                  <Play className="h-8 w-8 text-amber-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Session started but debugger URL not available
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  The session may still be initializing
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>

      {/* Session info footer */}
      <div
        className={cn(
          'px-4 py-2.5 border-t text-xs flex items-center justify-between',
          sessionInfo?.hasSession
            ? 'bg-gradient-to-r from-[#0d0d0d] to-[#1a1a2e]'
            : 'bg-muted/30'
        )}
      >
        <div className="flex items-center gap-3">
          {sessionInfo?.hasSession && sessionInfo.sessionId ? (
            <>
              <span className="font-mono text-muted-foreground">
                <span className="text-orange-400">session:</span>{' '}
                {sessionInfo.sessionId.slice(0, 12)}...
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">No active session</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sessionInfo?.hasSession && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium',
                sessionInfo.isActive
                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {sessionInfo.isActive ? '● Connected' : '○ Inactive'}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
