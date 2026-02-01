'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      {/* Main content area - adjusts for sidebar width */}
      <main className="pl-0 lg:pl-64 pt-16 lg:pt-0 transition-[padding] duration-200">
        {children}
      </main>
      <OnboardingWizard />
    </div>
  );
}
