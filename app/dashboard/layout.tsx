import type { Metadata } from 'next';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'PatchPilot Dashboard',
  description: 'Self-healing QA agent dashboard',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="dark min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="pl-64">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
