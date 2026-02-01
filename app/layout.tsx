import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toaster';
import { ThemeProvider } from '@/lib/providers/theme-provider';
import { CommandPalette } from '@/components/ui/command-palette';

export const metadata: Metadata = {
  title: 'PatchPilot',
  description: 'Self-Healing QA Agent',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <CommandPalette />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
