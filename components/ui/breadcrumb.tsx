'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  homeHref?: string;
}

function Breadcrumb({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4" />,
  homeHref = '/dashboard',
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {/* Home */}
        <li>
          <Link
            href={homeHref}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {/* Separator */}
        <li className="text-muted-foreground/50">{separator}</li>

        {/* Breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;

          return (
            <React.Fragment key={index}>
              <li>
                {isLast || !item.href ? (
                  <span
                    className={cn(
                      'flex items-center gap-1.5',
                      isLast && 'font-medium text-foreground'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                )}
              </li>

              {!isLast && (
                <li className="text-muted-foreground/50">{separator}</li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// Page header with breadcrumb integration
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// Compact breadcrumb for mobile or tight spaces
function CompactBreadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const currentItem = items[items.length - 1];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      {items.length > 1 && items[items.length - 2]?.href ? (
        <Link
          href={items[items.length - 2].href!}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          Back
        </Link>
      ) : (
        <span className="font-medium text-foreground flex items-center gap-1.5">
          {currentItem.icon && <currentItem.icon className="h-4 w-4" />}
          {currentItem.label}
        </span>
      )}
    </nav>
  );
}

export { Breadcrumb, PageHeader, CompactBreadcrumb };
export type { BreadcrumbItem };
