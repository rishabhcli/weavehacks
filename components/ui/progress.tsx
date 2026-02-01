'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-primary/20',
        neon: 'bg-neon-cyan/20',
        'neon-magenta': 'bg-neon-magenta/20',
        'neon-green': 'bg-neon-green/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const indicatorVariants = cva(
  'h-full w-full flex-1 transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        neon: 'bg-neon-cyan shadow-[0_0_10px_hsl(var(--neon-cyan)/0.5)]',
        'neon-magenta': 'bg-neon-magenta shadow-[0_0_10px_hsl(var(--neon-magenta)/0.5)]',
        'neon-green': 'bg-neon-green shadow-[0_0_10px_hsl(var(--neon-green)/0.5)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, className }))}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(indicatorVariants({ variant }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
