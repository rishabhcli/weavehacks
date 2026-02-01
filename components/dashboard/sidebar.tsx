'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSession } from '@/lib/hooks/use-session';

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

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user, repos, isLoading } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRepoName, setSelectedRepoName] = useState<string | null>(null);

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

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">PatchPilot</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-start gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-background/40">
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
        </div>
      </aside>
    </>
  );
}
