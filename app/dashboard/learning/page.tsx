'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LearningCurveChart } from '@/components/dashboard/learning-curve-chart';
import { ImprovementMetricCard } from '@/components/dashboard/improvement-metric-card';
import { KnowledgeBaseStats } from '@/components/dashboard/knowledge-base-stats';
import { RecentLearnings } from '@/components/dashboard/recent-learnings';

interface Metrics {
  passRate?: number;
  previousPassRate?: number;
  avgTimeToFix?: number;
  previousAvgTimeToFix?: number;
  firstTryRate?: number;
  previousFirstTryRate?: number;
  knowledgeReuseRate?: number;
  previousKnowledgeReuseRate?: number;
  improvementPercent?: number;
}

interface TrendData {
  labels: string[];
  passRates: number[];
  timeToFix?: number[];
}

interface KBStats {
  totalPatterns: number;
  totalFixes: number;
  successfulFixes: number;
  byType: Record<string, number>;
}

export default function LearningPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [kbStats, setKbStats] = useState<KBStats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/learning/metrics').then((r) => r.json()),
      fetch('/api/learning/trend').then((r) => r.json()),
      fetch('/api/learning/knowledge-base').then((r) => r.json()),
    ]).then(([m, t, k]) => {
      setMetrics(m);
      setTrend(t);
      setKbStats(k);
    });
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Self-Improvement</h1>
          <p className="text-muted-foreground">
            Watch QAgent get smarter over time
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-green-500">
            +{metrics?.improvementPercent ?? 0}%
          </div>
          <div className="text-sm text-muted-foreground">
            Improvement this week
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ImprovementMetricCard
          title="Pass Rate"
          current={metrics?.passRate ?? 0}
          previous={metrics?.previousPassRate ?? 0}
          unit="%"
        />
        <ImprovementMetricCard
          title="Avg Time to Fix"
          current={metrics?.avgTimeToFix ?? 0}
          previous={metrics?.previousAvgTimeToFix ?? 0}
          unit="s"
          lowerIsBetter
        />
        <ImprovementMetricCard
          title="First-Try Success"
          current={metrics?.firstTryRate ?? 0}
          previous={metrics?.previousFirstTryRate ?? 0}
          unit="%"
        />
        <ImprovementMetricCard
          title="Knowledge Reuse"
          current={metrics?.knowledgeReuseRate ?? 0}
          previous={metrics?.previousKnowledgeReuseRate ?? 0}
          unit="%"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Curve (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <LearningCurveChart data={trend} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <KnowledgeBaseStats stats={kbStats} />
        <RecentLearnings />
      </div>
    </div>
  );
}
