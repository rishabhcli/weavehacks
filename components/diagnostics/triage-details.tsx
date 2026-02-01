'use client';

import { Brain, Target, Lightbulb, Link2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TriageDiagnostics } from '@/lib/types';

interface TriageDetailsProps {
  diagnostics: TriageDiagnostics;
  className?: string;
}

function ConfidenceBar({ score, label }: { score: number; label: string }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function TriageDetails({ diagnostics, className }: TriageDetailsProps) {
  const { diagnosis, reasoning, confidenceBreakdown, similarIssuesCount } = diagnostics;

  return (
    <div className={cn('space-y-4', className)}>
      {/* AI Reasoning */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reasoning}</p>
        </CardContent>
      </Card>

      {/* Diagnosis Details */}
      {diagnosis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-yellow-400" />
              Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Failure Type */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Failure Type</p>
              <span
                className={cn(
                  'inline-block px-2 py-1 rounded-full text-xs font-medium',
                  diagnosis.failureType === 'UI_BUG' && 'bg-blue-500/20 text-blue-400',
                  diagnosis.failureType === 'BACKEND_ERROR' && 'bg-red-500/20 text-red-400',
                  diagnosis.failureType === 'TEST_FLAKY' && 'bg-yellow-500/20 text-yellow-400',
                  diagnosis.failureType === 'DATA_ERROR' && 'bg-orange-500/20 text-orange-400',
                  diagnosis.failureType === 'UNKNOWN' && 'bg-muted text-muted-foreground'
                )}
              >
                {diagnosis.failureType.replace('_', ' ')}
              </span>
            </div>

            {/* Root Cause */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Root Cause</p>
              <p className="text-sm">{diagnosis.rootCause}</p>
            </div>

            {/* Localization */}
            {diagnosis.localization && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-mono text-primary mb-2">
                    {diagnosis.localization.file}:{diagnosis.localization.startLine}-
                    {diagnosis.localization.endLine}
                  </p>
                  {diagnosis.localization.codeSnippet && (
                    <pre className="text-xs font-mono overflow-x-auto">
                      {diagnosis.localization.codeSnippet}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confidence Breakdown */}
      {confidenceBreakdown && confidenceBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Confidence Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confidenceBreakdown.map((item) => (
                <ConfidenceBar key={item.category} score={item.score} label={item.category} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Issues */}
      {similarIssuesCount > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-400" />
              Similar Issues Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Found <span className="font-medium text-foreground">{similarIssuesCount}</span>{' '}
              similar issues in the knowledge base that may help inform the fix.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggested Fix */}
      {diagnosis?.suggestedFix && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-400" />
              Suggested Fix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{diagnosis.suggestedFix}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
