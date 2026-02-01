'use client';

import { useMemo } from 'react';

interface TrendData {
  labels: string[];
  passRates: number[];
  timeToFix?: number[];
}

export function LearningCurveChart({ data }: { data: TrendData | null }) {
  const chartData = useMemo(() => {
    if (!data || data.labels.length === 0) return null;

    const height = 250;
    const width = 800;
    const padding = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxPassRate = 100;
    const passRatePoints = data.passRates.map((rate, i) => ({
      x:
        padding.left +
        (data.labels.length > 1 ? (i / (data.labels.length - 1)) * chartWidth : 0),
      y: padding.top + chartHeight - (rate / maxPassRate) * chartHeight,
    }));

    const passRatePath =
      passRatePoints.length > 1
        ? `M ${passRatePoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`
        : '';

    const firstRate = data.passRates[0] ?? 0;
    const lastRate = data.passRates[data.passRates.length - 1] ?? 0;
    const improvement = lastRate - firstRate;

    return {
      passRatePoints,
      passRatePath,
      height,
      width,
      padding,
      chartHeight,
      improvement,
      labels: data.labels,
    };
  }, [data]);

  if (!chartData) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data yet. Run some tests to see your learning curve!
      </div>
    );
  }

  const areaPath =
    chartData.passRatePoints.length > 0
      ? `${chartData.passRatePath} L ${chartData.passRatePoints[chartData.passRatePoints.length - 1].x} ${chartData.padding.top + chartData.chartHeight} L ${chartData.passRatePoints[0].x} ${chartData.padding.top + chartData.chartHeight} Z`
      : '';

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${chartData.width} ${chartData.height}`}
        className="w-full"
      >
        <defs>
          <linearGradient
            id="passRateGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((pct) => (
          <g key={pct}>
            <line
              x1={chartData.padding.left}
              y1={
                chartData.padding.top +
                chartData.chartHeight * (1 - pct / 100)
              }
              x2={chartData.width - chartData.padding.right}
              y2={
                chartData.padding.top +
                chartData.chartHeight * (1 - pct / 100)
              }
              stroke="#333"
              strokeDasharray="4 2"
            />
            <text
              x={chartData.padding.left - 10}
              y={
                chartData.padding.top +
                chartData.chartHeight * (1 - pct / 100)
              }
              textAnchor="end"
              className="text-xs fill-muted-foreground"
            >
              {pct}%
            </text>
          </g>
        ))}

        {areaPath && (
          <path
            d={areaPath}
            fill="url(#passRateGradient)"
          />
        )}

        <path
          d={chartData.passRatePath}
          fill="none"
          stroke="rgb(34, 197, 94)"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {chartData.passRatePoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="rgb(34, 197, 94)"
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {chartData.labels.map((label, i) => {
          const denom = Math.max(1, chartData.labels.length - 1);
          const x =
            chartData.padding.left +
            (i / denom) *
              (chartData.width -
                chartData.padding.left -
                chartData.padding.right);
          return (
            <text
              key={i}
              x={x}
              y={chartData.height - 10}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
            >
              {label}
            </text>
          );
        })}
      </svg>

      <div className="absolute top-4 right-4 bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
        {chartData.improvement >= 0 ? '+' : ''}
        {chartData.improvement.toFixed(1)}% improvement
      </div>
    </div>
  );
}
