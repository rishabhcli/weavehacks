import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-success text-success-foreground hover:bg-success/80',
        warning:
          'border-transparent bg-warning text-warning-foreground hover:bg-warning/80',
        'neon-cyan':
          'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_hsl(var(--neon-cyan)/0.2)] hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_hsl(var(--neon-cyan)/0.3)]',
        'neon-magenta':
          'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta shadow-[0_0_10px_hsl(var(--neon-magenta)/0.2)] hover:bg-neon-magenta/20 hover:shadow-[0_0_15px_hsl(var(--neon-magenta)/0.3)]',
        'neon-success':
          'border-neon-green/50 bg-neon-green/10 text-neon-green shadow-[0_0_10px_hsl(var(--neon-green)/0.2)] hover:bg-neon-green/20 hover:shadow-[0_0_15px_hsl(var(--neon-green)/0.3)]',
        'neon-danger':
          'border-neon-pink/50 bg-neon-pink/10 text-neon-pink shadow-[0_0_10px_hsl(var(--neon-pink)/0.2)] hover:bg-neon-pink/20 hover:shadow-[0_0_15px_hsl(var(--neon-pink)/0.3)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** When true, applies role="status" for screen readers to announce status changes */
  isStatus?: boolean;
}

function Badge({ className, variant, isStatus, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      role={isStatus ? 'status' : undefined}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
