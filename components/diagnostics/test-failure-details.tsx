'use client';

import { AlertCircle, ExternalLink, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScreenshotViewer } from './screenshot-viewer';
import { ConsoleLogViewer } from './console-log-viewer';
import type { TestFailureDiagnostics } from '@/lib/types';

interface TestFailureDetailsProps {
  diagnostics: TestFailureDiagnostics;
  className?: string;
}

export function TestFailureDetails({ diagnostics, className }: TestFailureDetailsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Error Summary */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-400 mb-1">Test Failure</h3>
              <p className="text-sm text-foreground">{diagnostics.errorMessage}</p>
              {diagnostics.failedStep !== undefined && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <MousePointer className="h-3 w-3" />
                  <span>Failed at step {diagnostics.failedStep}</span>
                </div>
              )}
              {diagnostics.url && (
                <a
                  href={diagnostics.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {diagnostics.url}
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot */}
      {diagnostics.screenshotUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Screenshot at Failure</CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenshotViewer screenshotUrl={diagnostics.screenshotUrl} />
          </CardContent>
        </Card>
      )}

      {/* Console Logs */}
      {diagnostics.consoleLogs && diagnostics.consoleLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Console Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsoleLogViewer logs={diagnostics.consoleLogs} />
          </CardContent>
        </Card>
      )}

      {/* DOM Snapshot */}
      {diagnostics.domSnapshot && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">DOM Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto font-mono">
              {diagnostics.domSnapshot}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
