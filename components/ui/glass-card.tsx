'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'premium' | 'subtle' | 'elevated';
  hover?: boolean;
  animate?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  default: 'bg-card/40 backdrop-blur-xl border-white/10',
  premium: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-white/20',
  subtle: 'bg-card/30 backdrop-blur-md border-white/5',
  elevated: 'bg-card/50 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/20',
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', hover = false, animate = false, children, ...props }, ref) => {
    const baseStyles = cn(
      'rounded-2xl border',
      variantStyles[variant],
      hover && 'transition-all duration-300 hover:border-white/20 hover:bg-card/50',
      className
    );

    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={baseStyles}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseStyles} {...props}>
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCardHeader = React.forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCardHeader.displayName = 'GlassCardHeader';

interface GlassCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const GlassCardTitle = React.forwardRef<HTMLHeadingElement, GlassCardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    >
      {children}
    </h3>
  )
);
GlassCardTitle.displayName = 'GlassCardTitle';

interface GlassCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const GlassCardDescription = React.forwardRef<HTMLParagraphElement, GlassCardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  )
);
GlassCardDescription.displayName = 'GlassCardDescription';

interface GlassCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCardContent = React.forwardRef<HTMLDivElement, GlassCardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
);
GlassCardContent.displayName = 'GlassCardContent';

interface GlassCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCardFooter = React.forwardRef<HTMLDivElement, GlassCardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCardFooter.displayName = 'GlassCardFooter';

// Premium stat card with glow effect
interface PremiumStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient?: string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

function PremiumStatCard({
  title,
  value,
  description,
  icon: Icon,
  gradient = 'from-violet-500 to-purple-600',
  trend,
  className,
}: PremiumStatCardProps) {
  return (
    <div className={cn('relative group', className)}>
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20',
          gradient
        )}
      />

      {/* Card */}
      <GlassCard variant="elevated" hover className="relative h-full">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'p-3 rounded-xl bg-gradient-to-br shadow-lg',
                gradient
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            {trend && (
              <div
                className={cn(
                  'flex items-center text-xs font-medium',
                  trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                <span className={trend.isPositive ? '' : 'rotate-180'}>↑</span>
                {trend.value}%
              </div>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight tabular-nums">{value}</h3>
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-2">{description}</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  PremiumStatCard,
};
