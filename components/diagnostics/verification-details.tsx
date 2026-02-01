'use client';

import {
  Rocket,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { VerificationDiagnostics } from '@/lib/types';

interface VerificationDetailsProps {
  diagnostics: VerificationDiagnostics;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  building: {
    icon: Loader2,
    label: 'Building',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  ready: {
    icon: CheckCircle,
    label: 'Deployed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  error: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
};

export function VerificationDetails({ diagnostics, className }: VerificationDetailsProps) {
  const {
    deploymentUrl,
    deploymentStatus,
    buildLogs,
    retestPassed,
    retestDuration,
  } = diagnostics;

  const status = statusConfig[deploymentStatus];
  const StatusIcon = status.icon;
  const isBuilding = deploymentStatus === 'building';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Deployment Status */}
      <Card className={cn('border', status.bgColor)}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  status.bgColor
                )}
              >
                <StatusIcon
                  className={cn('h-5 w-5', status.color, isBuilding && 'animate-spin')}
                />
              </div>
              <div>
                <p className={cn('font-semibold', status.color)}>{status.label}</p>
                {deploymentUrl && (
                  <a
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {deploymentUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            {deploymentUrl && deploymentStatus === 'ready' && (
              <Button size="sm" asChild>
                <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                  <Rocket className="h-4 w-4 mr-2" />
                  View Deployment
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Re-test Results */}
      {retestPassed !== undefined && (
        <Card className={cn(retestPassed ? 'border-emerald-500/30' : 'border-red-500/30')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {retestPassed ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Verification Passed</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400">Verification Failed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {retestPassed
                ? 'The fix was successfully verified. All tests now pass.'
                : 'The fix did not resolve the issue. Another iteration may be needed.'}
            </p>
            {retestDuration && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Re-test completed in {(retestDuration / 1000).toFixed(1)}s
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Build Logs */}
      {buildLogs && buildLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Build Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background rounded-lg border p-3 max-h-48 overflow-y-auto">
              {buildLogs.map((log, index) => (
                <p key={index} className="text-xs font-mono text-muted-foreground">
                  {log}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
