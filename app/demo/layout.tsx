'use client';

import Link from 'next/link';
import { ShoppingCart, Home, UserPlus, Zap, ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { name: 'Products', href: '/demo', icon: Home },
  { name: 'Cart', href: '/demo/cart', icon: ShoppingCart },
  { name: 'Sign Up', href: '/demo/signup', icon: UserPlus },
];

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Back Link */}
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-lg">Demo Store</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
