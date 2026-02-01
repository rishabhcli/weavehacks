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
<<<<<<< Current (Your changes)
<<<<<<< Current (Your changes)
<<<<<<< Current (Your changes)
<<<<<<< Current (Your changes)
<<<<<<< Current (Your changes)
        {/* pl-0 on mobile (sidebar is a drawer), pl-64 on lg+ (sidebar is fixed) */}
        <main className="pl-0 lg:pl-64">
          {/* Add padding-top on mobile to account for hamburger button */}
          <div className="pt-16 lg:pt-0">
            {children}
          </div>
=======
=======
>>>>>>> Incoming (Background Agent changes)
=======
>>>>>>> Incoming (Background Agent changes)
        <main className="lg:pl-64">
          {children}
>>>>>>> Incoming (Background Agent changes)
        </main>
=======
        {/* pl-0 on mobile, pl-64 on large screens to account for sidebar */}
        <main className="pl-0 lg:pl-64">{children}</main>
>>>>>>> Incoming (Background Agent changes)
=======
        {/* pl-0 on mobile (sidebar is drawer), pl-64 on lg+ (sidebar is fixed) */}
        <main className="pl-0 lg:pl-64 pt-16 lg:pt-0">{children}</main>
>>>>>>> Incoming (Background Agent changes)
      </div>
    </TooltipProvider>
  );
}
