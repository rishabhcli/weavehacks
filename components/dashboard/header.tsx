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
      className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6"
      role="banner"
    >
      <div className="flex items-center gap-4">
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {/* Search / Command Palette Trigger */}
        <button
          onClick={triggerCommandPalette}
          className="relative hidden md:flex items-center gap-2 h-9 w-64 px-3 rounded-lg bg-secondary text-sm text-muted-foreground hover:bg-secondary/80 transition-colors"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>Search...</span>
          <kbd className="ml-auto flex items-center gap-0.5 rounded bg-background/50 px-1.5 py-0.5 text-xs">
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
          className="relative"
          aria-label="Notifications (3 unread)"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center animate-pulse"
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
                  className="h-8 w-8 rounded-full ring-2 ring-border"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                  <User className="h-4 w-4 text-primary" aria-hidden="true" />
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
