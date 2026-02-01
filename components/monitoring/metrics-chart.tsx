'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ImprovementMetrics } from '@/lib/types';

interface MetricsChartProps {
  metrics: ImprovementMetrics[];
  title?: string;
}

export function MetricsChart({ metrics, title = 'Improvement Trends' }: MetricsChartProps) {
  const chartData = useMemo(() => {
    if (metrics.length === 0) return null;

    const maxPassRate = 100;
    const height = 200;
    const width = 600;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const barWidth = Math.min(40, (chartWidth - 20) / metrics.length);
    const gap = (chartWidth - barWidth * metrics.length) / (metrics.length + 1);

    const bars = metrics.map((m, i) => {
      const x = padding.left + gap + i * (barWidth + gap);
      const barHeight = (m.passRate / maxPassRate) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        label: m.periodKey,
        passRate: m.passRate,
        totalRuns: m.totalRuns,
      };
    });

    // Create path for trend line
    const points = bars.map((bar) => ({
      x: bar.x + bar.width / 2,
      y: bar.y,
    }));

    const pathD = points.length > 1
      ? `M ${points[0].x} ${points[0].y} ${points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')}`
      : '';

    return { bars, pathD, height, width, padding, chartHeight };
  }, [metrics]);

  if (!chartData || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No metrics data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="w-full h-auto"
          style={{ maxHeight: '250px' }}
        >
          {/* Y-axis labels */}
          <text
            x={chartData.padding.left - 10}
            y={chartData.padding.top}
            textAnchor="end"
            className="text-xs fill-muted-foreground"
          >
            100%
          </text>
          <text
            x={chartData.padding.left - 10}
            y={chartData.padding.top + chartData.chartHeight / 2}
            textAnchor="end"
            className="text-xs fill-muted-foreground"
          >
            50%
          </text>
          <text
            x={chartData.padding.left - 10}
            y={chartData.padding.top + chartData.chartHeight}
            textAnchor="end"
            className="text-xs fill-muted-foreground"
          >
            0%
          </text>

          {/* Grid lines */}
          <line
            x1={chartData.padding.left}
            y1={chartData.padding.top}
            x2={chartData.width - chartData.padding.right}
            y2={chartData.padding.top}
            className="stroke-muted"
            strokeDasharray="4 2"
          />
          <line
            x1={chartData.padding.left}
            y1={chartData.padding.top + chartData.chartHeight / 2}
            x2={chartData.width - chartData.padding.right}
            y2={chartData.padding.top + chartData.chartHeight / 2}
            className="stroke-muted"
            strokeDasharray="4 2"
          />
          <line
            x1={chartData.padding.left}
            y1={chartData.padding.top + chartData.chartHeight}
            x2={chartData.width - chartData.padding.right}
            y2={chartData.padding.top + chartData.chartHeight}
            className="stroke-muted"
          />

          {/* Bars */}
          {chartData.bars.map((bar, i) => (
            <g key={i}>
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                className="fill-primary/60 hover:fill-primary transition-colors"
                rx={2}
              />
              {/* X-axis label */}
              <text
                x={bar.x + bar.width / 2}
                y={chartData.padding.top + chartData.chartHeight + 20}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground"
              >
                {bar.label.replace('2026-', '').replace('-W', ' W')}
              </text>
              {/* Value label */}
              <text
                x={bar.x + bar.width / 2}
                y={bar.y - 5}
                textAnchor="middle"
                className="text-[10px] fill-foreground font-medium"
              >
                {bar.passRate.toFixed(0)}%
              </text>
            </g>
          ))}

          {/* Trend line */}
          {chartData.pathD && (
            <path
              d={chartData.pathD}
              fill="none"
              className="stroke-primary"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {chartData.bars.map((bar, i) => (
            <circle
              key={i}
              cx={bar.x + bar.width / 2}
              cy={bar.y}
              r={4}
              className="fill-primary stroke-background"
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t flex justify-around text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {metrics.reduce((sum, m) => sum + m.totalRuns, 0)}
            </div>
            <div className="text-muted-foreground">Total Runs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {(metrics.reduce((sum, m) => sum + m.passRate, 0) / metrics.length).toFixed(0)}%
            </div>
            <div className="text-muted-foreground">Avg Pass Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {metrics.reduce((sum, m) => sum + m.successfulPatches, 0)}
            </div>
            <div className="text-muted-foreground">Patches Applied</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
