'use client';

import { Bell, Search, User, LogOut, Settings, UserCircle, Command, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/lib/hooks/use-session';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/components/ui/toaster';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, isAuthenticated, disconnect } = useSession();
  const router = useRouter();
  const { info } = useToast();

  const handleSignOut = async () => {
    await disconnect();
    info('Signed out successfully');
    router.push('/');
  };

  const triggerCommandPalette = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    document.dispatchEvent(event);
  };

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center justify-between bg-background/80 backdrop-blur-xl px-6 border-b border-neon-cyan/20 shadow-[0_1px_20px_hsl(var(--neon-cyan)/0.05)]"
      role="banner"
    >
      {/* Neon accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />

      <div className="flex items-center gap-4">
        {title && <h1 className="text-xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {/* Search / Command Palette Trigger */}
        <button
          onClick={triggerCommandPalette}
          className="relative hidden md:flex items-center gap-2 h-9 w-64 px-3 rounded-lg bg-card/50 backdrop-blur-sm border border-neon-cyan/20 text-sm text-muted-foreground hover:border-neon-cyan/40 hover:bg-neon-cyan/5 hover:shadow-[0_0_15px_hsl(var(--neon-cyan)/0.1)] transition-all duration-200"
        >
          <Search className="h-4 w-4 text-neon-cyan/70" aria-hidden="true" />
          <span>Search...</span>
          <kbd className="ml-auto flex items-center gap-0.5 rounded bg-neon-cyan/10 border border-neon-cyan/20 px-1.5 py-0.5 text-xs text-neon-cyan">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={triggerCommandPalette}
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Help */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex"
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
            document.dispatchEvent(event);
            // The shortcuts view will need to be triggered differently
            setTimeout(() => {
              const helpButton = document.querySelector('[data-help-trigger]') as HTMLElement;
              helpButton?.click();
            }, 100);
          }}
          aria-label="Keyboard shortcuts"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-neon-magenta/10 hover:text-neon-magenta transition-all duration-200"
          aria-label="Notifications (3 unread)"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-neon-magenta text-[10px] font-medium text-white flex items-center justify-center animate-neon-pulse shadow-[0_0_10px_hsl(var(--neon-magenta)/0.5)]"
            aria-hidden="true"
          >
            3
          </span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="User menu"
            >
              {isAuthenticated && user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.login}'s avatar`}
                  className="h-8 w-8 rounded-full ring-2 ring-neon-cyan/50 shadow-[0_0_10px_hsl(var(--neon-cyan)/0.3)]"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-neon-cyan/10 flex items-center justify-center ring-2 ring-neon-cyan/30">
                  <User className="h-4 w-4 text-neon-cyan" aria-hidden="true" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {isAuthenticated && user ? (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">@{user.login}</span>
                  {user.name && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {user.name}
                    </span>
                  )}
                </div>
              ) : (
                'My Account'
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <UserCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
