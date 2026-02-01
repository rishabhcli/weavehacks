import { cn } from '@/lib/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'circle' | 'image';
  lines?: number;
}

function Skeleton({
  className,
  variant = 'default',
  lines = 1,
  ...props
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-muted rounded-lg';

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseStyles,
              i === lines - 1 ? 'w-3/4' : 'w-full',
              'h-4'
            )}
          />
        ))}
      </div>
    );
  }

  const variantStyles = {
    default: 'h-4 w-full',
    card: 'h-32 w-full',
    text: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    image: 'h-48 w-full',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    />
  );
}

// Shimmer skeleton with animated gradient
function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'shimmer rounded-lg',
        className
      )}
      {...props}
    />
  );
}

// Skeleton specifically for stats cards
function StatsCardSkeleton() {
  return (
    <div className="relative group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 opacity-0 blur-xl" />
      <div className="relative rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-12 rounded bg-muted animate-pulse" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="mt-2 h-3 w-40 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// Skeleton for run list items
function RunListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block space-y-1">
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// Dashboard page skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-fuchsia-600/10 border border-white/10 p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Quick Actions & Recent Runs Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 space-y-4">
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 space-y-4">
          <div className="flex justify-between">
            <div className="h-6 w-32 rounded bg-muted animate-pulse" />
            <div className="h-6 w-16 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-3">
            <RunListItemSkeleton />
            <RunListItemSkeleton />
            <RunListItemSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings page skeleton
function SettingsSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-6 max-w-3xl">
      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-64 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded bg-muted animate-pulse mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-10 w-full sm:w-48 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
          <div className="h-3 w-48 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Data table skeleton
function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-muted/30">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        <div className="h-4 w-20 rounded bg-muted animate-pulse ml-auto" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-6 w-20 rounded-full bg-muted animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  ShimmerSkeleton,
  StatsCardSkeleton,
  RunListItemSkeleton,
  DashboardSkeleton,
  SettingsSkeleton,
  DataTableSkeleton,
};
