'use client';

import { motion } from 'framer-motion';
import { 
  Rocket, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  FileX,
  Construction,
  Sparkles,
  Lightbulb,
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type EmptyStateVariant = 'default' | 'search' | 'error' | 'success' | 'coming-soon' | 'no-data';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: EmptyStateAction | React.ReactNode;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
  // Legacy props for backwards compatibility
  gradient?: string;
  suggestions?: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
  }>;
  tip?: string;
  children?: React.ReactNode;
}

const variantConfig: Record<EmptyStateVariant, { icon: LucideIcon; gradient: string; iconColor: string }> = {
  default: { icon: Rocket, gradient: 'from-violet-500/20 to-purple-600/20', iconColor: 'text-violet-400' },
  search: { icon: Search, gradient: 'from-blue-500/20 to-cyan-600/20', iconColor: 'text-blue-400' },
  error: { icon: AlertCircle, gradient: 'from-red-500/20 to-rose-600/20', iconColor: 'text-red-400' },
  success: { icon: CheckCircle2, gradient: 'from-emerald-500/20 to-teal-600/20', iconColor: 'text-emerald-400' },
  'coming-soon': { icon: Construction, gradient: 'from-amber-500/20 to-orange-600/20', iconColor: 'text-amber-400' },
  'no-data': { icon: FileX, gradient: 'from-slate-500/20 to-gray-600/20', iconColor: 'text-slate-400' },
};

// Animated illustration for empty states
function EmptyIllustration({ variant }: { variant: EmptyStateVariant }) {
  const illustrations: Record<EmptyStateVariant, React.ReactNode> = {
    default: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <defs>
          <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(262, 85%, 65%)" />
            <stop offset="100%" stopColor="hsl(280, 85%, 65%)" />
          </linearGradient>
        </defs>
        {/* Stars */}
        <motion.circle cx="20" cy="20" r="2" fill="hsl(262, 85%, 65%)" opacity="0.5"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        />
        <motion.circle cx="100" cy="15" r="1.5" fill="hsl(262, 85%, 65%)" opacity="0.5"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.circle cx="15" cy="80" r="1" fill="hsl(262, 85%, 65%)" opacity="0.5"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        {/* Rocket */}
        <motion.g
          initial={{ y: 0 }}
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M60 25 L50 65 L60 75 L70 65 Z" fill="url(#rocketGrad)" />
          <circle cx="60" cy="50" r="8" fill="white" opacity="0.9" />
          <path d="M50 65 L45 85 L55 75 Z" fill="hsl(262, 60%, 50%)" />
          <path d="M70 65 L75 85 L65 75 Z" fill="hsl(262, 60%, 50%)" />
        </motion.g>
        {/* Flame */}
        <motion.path
          d="M55 75 L60 95 L65 75 Z"
          fill="hsl(25, 95%, 53%)"
          animate={{ opacity: [0.6, 1, 0.6], scaleY: [0.8, 1.2, 0.8] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ originY: 0.5 }}
        />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <circle cx="55" cy="55" r="25" stroke="hsl(217, 91%, 60%)" strokeWidth="4" fill="none" opacity="0.5" />
          <motion.circle
            cx="55" cy="55" r="25"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="157"
            animate={{ strokeDashoffset: [157, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <line x1="73" y1="73" x2="95" y2="95" stroke="hsl(217, 91%, 60%)" strokeWidth="4" strokeLinecap="round" />
        </motion.g>
      </svg>
    ),
    error: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <motion.g
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <circle cx="60" cy="60" r="35" stroke="hsl(0, 72%, 51%)" strokeWidth="4" fill="none" opacity="0.3" />
          <circle cx="60" cy="60" r="35" stroke="hsl(0, 72%, 51%)" strokeWidth="4" fill="none" />
          <motion.line
            x1="45" y1="45" x2="75" y2="75"
            stroke="hsl(0, 72%, 51%)"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
          <motion.line
            x1="75" y1="45" x2="45" y2="75"
            stroke="hsl(0, 72%, 51%)"
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />
        </motion.g>
      </svg>
    ),
    success: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <motion.g>
          <circle cx="60" cy="60" r="35" stroke="hsl(142, 71%, 45%)" strokeWidth="4" fill="none" opacity="0.3" />
          <motion.circle
            cx="60" cy="60"
            r="35"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth="4"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d="M45 60 L55 70 L75 45"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          />
        </motion.g>
      </svg>
    ),
    'coming-soon': (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <motion.g>
          <rect x="30" y="40" width="60" height="40" rx="5" stroke="hsl(38, 92%, 50%)" strokeWidth="3" fill="none" />
          <motion.line
            x1="45" y1="30" x2="45" y2="40"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ y1: [30, 25, 30] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.line
            x1="60" y1="25" x2="60" y2="40"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ y1: [25, 20, 25] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.line
            x1="75" y1="30" x2="75" y2="40"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ y1: [30, 25, 30] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
        </motion.g>
      </svg>
    ),
    'no-data': (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <rect x="35" y="30" width="50" height="60" rx="3" stroke="hsl(215, 16%, 47%)" strokeWidth="3" fill="none" />
          <line x1="45" y1="45" x2="75" y2="45" stroke="hsl(215, 16%, 47%)" strokeWidth="2" opacity="0.5" />
          <line x1="45" y1="55" x2="75" y2="55" stroke="hsl(215, 16%, 47%)" strokeWidth="2" opacity="0.5" />
          <line x1="45" y1="65" x2="65" y2="65" stroke="hsl(215, 16%, 47%)" strokeWidth="2" opacity="0.5" />
          <motion.line
            x1="85" y1="25" x2="35" y2="95"
            stroke="hsl(215, 16%, 47%)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </motion.g>
      </svg>
    ),
  };

  return (
    <div className="w-24 h-24 mx-auto">
      {illustrations[variant]}
    </div>
  );
}

// Helper to check if action is an object or ReactNode
function isActionObject(action: EmptyStateAction | React.ReactNode): action is EmptyStateAction {
  return action !== null && 
         typeof action === 'object' && 
         'label' in action && 
         'onClick' in action;
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon: CustomIcon,
  action,
  secondaryAction,
  className,
  compact = false,
  gradient: legacyGradient,
  suggestions,
  tip,
  children,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-4 rounded-xl bg-muted/30', className)}>
        <div className={cn('p-2 rounded-lg bg-gradient-to-br', config.gradient)}>
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
        {action && isActionObject(action) && (
          <Button 
            size="sm" 
            variant={action.variant || 'outline'} 
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
        {action && !isActionObject(action) && action}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('flex flex-col items-center text-center py-12 px-4', className)}
    >
      {/* Icon */}
      <div className={cn(
        'h-20 w-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br flex items-center justify-center',
        legacyGradient || config.gradient
      )}>
        <Icon className={cn('h-10 w-10', config.iconColor)} />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && isActionObject(action) && (
            <Button 
              onClick={action.onClick} 
              variant={action.variant || 'default'}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          )}
          {action && !isActionObject(action) && action}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {children}

      {/* Legacy suggestions support */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-card/50 border border-white/5 hover:border-white/10 transition-colors"
            >
              <suggestion.icon className="h-6 w-6 text-muted-foreground mb-2" />
              <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
              <p className="text-xs text-muted-foreground">{suggestion.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {tip && (
        <div className="mt-8 flex items-start gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-lg">
          <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">{tip}</p>
        </div>
      )}
    </motion.div>
  );
}

// Specialized empty states for common use cases
export function NoRunsEmptyState({ onCreateRun }: { onCreateRun: () => void }) {
  return (
    <EmptyState
      variant="default"
      title="No runs yet"
      description="Start your first run to see PatchPilot in action. Our AI agents will test your app, find bugs, and auto-generate fixes."
      action={{ label: 'Start First Run', onClick: onCreateRun }}
    />
  );
}

export function NoSearchResultsEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description="We couldn't find any runs matching your search. Try adjusting your filters or search terms."
      action={{ label: 'Clear Filters', onClick: onClear, variant: 'outline' }}
    />
  );
}

export function ErrorEmptyState({ 
  onRetry,
  message = "Something went wrong while loading your data."
}: { 
  onRetry: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      variant="error"
      title="Failed to load"
      description={message}
      action={{ label: 'Try Again', onClick: onRetry }}
    />
  );
}

export function ComingSoonEmptyState() {
  return (
    <EmptyState
      variant="coming-soon"
      title="Coming soon"
      description="This feature is currently in development. Stay tuned for updates!"
    />
  );
}
