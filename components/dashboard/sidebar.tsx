'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Play,
  TestTube2,
  GitBranch,
  Settings,
  Github,
  Zap,
  Radio,
  Brain,
  Menu,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSession } from '@/lib/hooks/use-session';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Runs', href: '/dashboard/runs', icon: Play },
  { name: 'Learning', href: '/dashboard/learning', icon: Brain },
  { name: 'Monitoring', href: '/dashboard/monitoring', icon: Radio },
  { name: 'Tests', href: '/dashboard/tests', icon: TestTube2 },
  { name: 'Patches', href: '/dashboard/patches', icon: GitBranch },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface StoredRepo {
  id: string;
  name: string;
  fullName: string;
  active?: boolean;
}

function getStoredRepoName() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem('patchpilot_repos');
    if (!stored) return null;
    const repos = JSON.parse(stored) as StoredRepo[];
    const activeRepo = repos.find((repo) => repo.active) ?? repos[0];
    return activeRepo?.fullName || activeRepo?.name || null;
  } catch {
    return null;
  }
}

function getStoredCollapsedState(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sidebar_collapsed') === 'true';
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user, repos, isLoading } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedRepoName, setSelectedRepoName] = useState<string | null>(null);

  useEffect(() => {
    setIsCollapsed(getStoredCollapsedState());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedRepoName(null);
      return;
    }

    const storedRepo = getStoredRepoName();
    if (storedRepo) {
      setSelectedRepoName(storedRepo);
      return;
    }

    if (repos.length > 0) {
      setSelectedRepoName(repos[0].fullName || repos[0].name);
    } else {
      setSelectedRepoName(null);
    }
  }, [isAuthenticated, repos, pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
  };

  const connectionStatus = isLoading
    ? 'Checking connection...'
    : isAuthenticated
      ? 'Connected'
      : 'Not connected';
  const accountLabel = isLoading
    ? 'Loading account...'
    : isAuthenticated && user?.login
      ? `@${user.login}`
      : 'Connect GitHub';
  const repoLabel = isLoading
    ? 'Loading repository...'
    : selectedRepoName || 'No repo selected';

  return (
    <TooltipProvider delayDuration={100}>
      <>
        <button
          type="button"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsOpen((prev) => !prev)}
          className="lg:hidden fixed left-4 top-4 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background shadow-sm"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <motion.aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:translate-x-0'
          )}
          animate={{ width: isCollapsed ? 72 : 256 }}
          transition={{ duration: 0.2 }}
        >
          {/* Logo */}
          <div className={cn(
            "flex h-16 items-center gap-2 border-b border-sidebar-border",
            isCollapsed ? "justify-center px-2" : "px-6"
          )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  className="text-lg font-semibold text-sidebar-foreground whitespace-nowrap overflow-hidden"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  PatchPilot
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 space-y-1 py-4",
            isCollapsed ? "px-2" : "px-3"
          )}>
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              const navItem = (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors',
                    isCollapsed ? 'justify-center px-2' : 'px-3',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {navItem}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return navItem;
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="hidden lg:flex justify-center py-2 border-t border-sidebar-border">
            <button
              onClick={toggleCollapsed}
              className="p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Footer */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div 
                className="border-t border-sidebar-border p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-start gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-background/40 flex-shrink-0">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Github className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs font-medium text-sidebar-foreground truncate">
                      {connectionStatus}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {accountLabel}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {repoLabel}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Footer */}
          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center p-4 border-t border-sidebar-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent/50">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Github className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{connectionStatus}</p>
                <p className="text-xs text-muted-foreground">{accountLabel}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </motion.aside>
      </>
    </TooltipProvider>
  );
}
