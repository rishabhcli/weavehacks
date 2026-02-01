'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createContext, useContext, useCallback, useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string, options?: Partial<Toast>) => void;
  error: (title: string, description?: string, options?: Partial<Toast>) => void;
  warning: (title: string, description?: string, options?: Partial<Toast>) => void;
  info: (title: string, description?: string, options?: Partial<Toast>) => void;
  loading: (title: string, description?: string, options?: Partial<Toast>) => string;
  dismiss: (id: string) => void;
  update: (id: string, toast: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const toastStyles = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  loading: 'bg-primary/10 border-primary/20 text-primary',
};

const toastProgressColors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  loading: 'bg-primary',
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);
  const Icon = toastIcons[toast.type];
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (toast.type === 'loading') return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = endTime - now;
      const newProgress = Math.max(0, (remaining / duration) * 100);
      setProgress(newProgress);

      if (newProgress > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);
    const timeout = setTimeout(() => onRemove(toast.id), duration);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeout);
    };
  }, [toast.id, toast.type, duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative w-full max-w-sm overflow-hidden rounded-xl border backdrop-blur-xl',
        'bg-card/80 shadow-lg shadow-black/10',
        toastStyles[toast.type]
      )}
    >
      {/* Progress bar */}
      {toast.type !== 'loading' && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-border/50">
          <motion.div
            className={cn('h-full', toastProgressColors[toast.type])}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 p-4">
        <div className={cn('mt-0.5 flex-shrink-0', toast.type === 'loading' && 'animate-spin')}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground">{toast.title}</h4>
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onRemove(toast.id);
              }}
              className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string, options?: Partial<Toast>) => {
      addToast({ type: 'success', title, description, ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string, options?: Partial<Toast>) => {
      addToast({ type: 'error', title, description, duration: 6000, ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string, options?: Partial<Toast>) => {
      addToast({ type: 'warning', title, description, ...options });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string, options?: Partial<Toast>) => {
      addToast({ type: 'info', title, description, ...options });
    },
    [addToast]
  );

  const loading = useCallback(
    (title: string, description?: string, options?: Partial<Toast>) => {
      return addToast({ type: 'loading', title, description, ...options });
    },
    [addToast]
  );

  const update = useCallback((id: string, toast: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...toast } : t))
    );
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    loading,
    dismiss: removeToast,
    update,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Hook for promise-based toasts
export function usePromiseToast() {
  const toast = useToast();

  return useCallback(
    async <T,>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
      }
    ): Promise<T> => {
      const id = toast.loading(loading);

      try {
        const data = await promise;
        const successMessage = typeof success === 'function' ? success(data) : success;
        toast.update(id, {
          type: 'success',
          title: successMessage,
          duration: 4000,
        });
        return data;
      } catch (err) {
        const errorMessage = typeof error === 'function' ? error(err as Error) : error;
        toast.update(id, {
          type: 'error',
          title: errorMessage,
          duration: 6000,
        });
        throw err;
      }
    },
    [toast]
  );
}
