import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-success text-success-foreground hover:bg-success/90 shadow-lg shadow-success/25',
        glass: 'bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 text-foreground',
        gradient: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40',
        'neon-cyan': 'border border-neon-cyan/50 bg-transparent text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.4)] transition-all duration-300',
        'neon-magenta': 'border border-neon-magenta/50 bg-transparent text-neon-magenta hover:bg-neon-magenta/10 hover:border-neon-magenta hover:shadow-[0_0_20px_hsl(var(--neon-magenta)/0.4)] transition-all duration-300',
        'neon-green': 'border border-neon-green/50 bg-transparent text-neon-green hover:bg-neon-green/10 hover:border-neon-green hover:shadow-[0_0_20px_hsl(var(--neon-green)/0.4)] transition-all duration-300',
        'neon-filled': 'bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-pink text-white shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)] hover:shadow-[0_0_30px_hsl(var(--neon-magenta)/0.5)] transition-all duration-300',
        'cyber-glass': 'bg-card/30 backdrop-blur-xl border border-neon-cyan/20 text-foreground hover:border-neon-cyan/50 hover:bg-neon-cyan/5 hover:shadow-[0_0_15px_hsl(var(--neon-cyan)/0.2)] transition-all duration-300',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      success = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // When asChild is true, just pass children directly (Slot expects single child)
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    // Determine what to show in the button
    const showLoading = loading && !success;
    const showSuccess = success && !loading;
    const showContent = !showLoading && !showSuccess;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading state */}
        {showLoading && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        )}

        {/* Success state */}
        {showSuccess && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center"
          >
            <Check className="mr-2 h-4 w-4" />
            {children}
          </motion.span>
        )}

        {/* Normal content */}
        {showContent && (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

// Icon Button variant
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'loadingText'> {
  icon: React.ReactNode;
  label: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className, size = 'icon', ...props }, ref) => (
    <Button
      ref={ref}
      size={size}
      className={cn('', className)}
      aria-label={label}
      {...props}
    >
      {icon}
    </Button>
  )
);
IconButton.displayName = 'IconButton';

// Button Group for related actions
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

function ButtonGroup({
  children,
  className,
  orientation = 'horizontal',
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal'
          ? 'flex-row [&>button:first-child]:rounded-r-none [&>button:last-child]:rounded-l-none [&>button:not(:first-child):not(:last-child)]:rounded-none [&>button:not(:last-child)]:border-r-0'
          : 'flex-col [&>button:first-child]:rounded-b-none [&>button:last-child]:rounded-t-none [&>button:not(:first-child):not(:last-child)]:rounded-none [&>button:not(:last-child)]:border-b-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// Floating Action Button
interface FABProps extends Omit<ButtonProps, 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ position = 'bottom-right', className, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    };

    return (
      <motion.div
        className={cn('fixed z-50', positionClasses[position])}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          ref={ref}
          size="icon-lg"
          className={cn(
            'rounded-full shadow-xl shadow-primary/30 bg-gradient-to-r from-primary to-purple-600',
            className
          )}
          {...props}
        />
      </motion.div>
    );
  }
);
FloatingActionButton.displayName = 'FloatingActionButton';

export { Button, buttonVariants, IconButton, ButtonGroup, FloatingActionButton };
