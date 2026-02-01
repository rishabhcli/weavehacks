'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils/cn';

// Theme colors that work with dark mode
const COLORS = {
  primary: 'hsl(262, 85%, 65%)',
  secondary: 'hsl(217, 91%, 60%)',
  success: 'hsl(142, 71%, 45%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 72%, 51%)',
  muted: 'hsl(215, 16%, 64%)',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.destructive,
];

// Custom tooltip for charts
function CustomTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-card/95 backdrop-blur-xl p-3 shadow-xl">
      {label && <p className="text-sm font-medium text-foreground mb-2">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Line Chart Component
interface LineChartProps {
  data: Array<Record<string, number | string>>;
  lines: Array<{
    key: string;
    name: string;
    color?: string;
    area?: boolean;
  }>;
  xAxisKey: string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  yAxisFormatter?: (value: number) => string;
}

function LineChartComponent({
  data,
  lines,
  xAxisKey,
  className,
  height = 300,
  showGrid = true,
  yAxisFormatter,
}: LineChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(215, 20%, 18%)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(215, 16%, 64%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(215, 16%, 64%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip content={<CustomTooltip formatter={yAxisFormatter} />} />
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Area Chart Component
interface AreaChartProps extends LineChartProps {
  gradient?: boolean;
}

function AreaChartComponent({
  data,
  lines,
  xAxisKey,
  className,
  height = 300,
  showGrid = true,
  yAxisFormatter,
  gradient = true,
}: AreaChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {lines.map((line, index) => (
              <linearGradient
                key={line.key}
                id={`gradient-${line.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={line.color || CHART_COLORS[index % CHART_COLORS.length]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={line.color || CHART_COLORS[index % CHART_COLORS.length]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(215, 20%, 18%)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(215, 16%, 64%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(215, 16%, 64%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip content={<CustomTooltip formatter={yAxisFormatter} />} />
          {lines.map((line, index) => (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              fill={gradient ? `url(#gradient-${line.key})` : 'transparent'}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar Chart Component
interface BarChartProps {
  data: Array<Record<string, number | string>>;
  bars: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  xAxisKey: string;
  className?: string;
  height?: number;
  showGrid?: boolean;
  layout?: 'vertical' | 'horizontal';
}

function BarChartComponent({
  data,
  bars,
  xAxisKey,
  className,
  height = 300,
  showGrid = true,
  layout = 'horizontal',
}: BarChartProps) {
  const isVertical = layout === 'vertical';

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(215, 20%, 18%)"
              horizontal={!isVertical}
              vertical={isVertical}
            />
          )}
          {isVertical ? (
            <>
              <XAxis
                type="number"
                stroke="hsl(215, 16%, 64%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                stroke="hsl(215, 16%, 64%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke="hsl(215, 16%, 64%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(215, 16%, 64%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || CHART_COLORS[index % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie/Donut Chart Component
interface PieChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  className?: string;
  height?: number;
  donut?: boolean;
  innerRadius?: number;
  showLegend?: boolean;
}

function PieChartComponent({
  data,
  className,
  height = 300,
  donut = false,
  innerRadius = 60,
  showLegend = true,
}: PieChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={donut ? innerRadius : 0}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sparkline for inline stats
interface SparklineProps {
  data: number[];
  className?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
}

function Sparkline({
  data,
  className,
  color = COLORS.primary,
  height = 40,
  showArea = true,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={showArea ? 'url(#sparkline-gradient)' : 'transparent'}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Chart Card wrapper
interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

function ChartCard({
  title,
  description,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden',
        className
      )}
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {action}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export {
  LineChartComponent,
  AreaChartComponent,
  BarChartComponent,
  PieChartComponent,
  Sparkline,
  ChartCard,
  COLORS,
};
