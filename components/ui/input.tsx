import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const inputVariants = cva(
  'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        neon: 'border-neon-cyan/30 bg-card/50 backdrop-blur-sm focus-visible:border-neon-cyan focus-visible:shadow-[0_0_15px_hsl(var(--neon-cyan)/0.3),inset_0_0_10px_hsl(var(--neon-cyan)/0.05)] focus-visible:ring-0',
        'neon-magenta': 'border-neon-magenta/30 bg-card/50 backdrop-blur-sm focus-visible:border-neon-magenta focus-visible:shadow-[0_0_15px_hsl(var(--neon-magenta)/0.3),inset_0_0_10px_hsl(var(--neon-magenta)/0.05)] focus-visible:ring-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
