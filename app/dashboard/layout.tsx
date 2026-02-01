import type { Metadata } from 'next';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'PatchPilot Dashboard',
  description: 'Self-healing QA agent dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="dark min-h-screen bg-background text-foreground">
        <Sidebar />
        {/* pl-0 on mobile (sidebar is drawer), pl-64 on lg+ (sidebar is fixed) */}
        <main className="pl-0 lg:pl-64 pt-16 lg:pt-0">{children}</main>
      </div>
    </TooltipProvider>
  );
}
