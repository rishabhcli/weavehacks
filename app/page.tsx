import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PatchPilot</h1>
          <p className="text-muted-foreground">Self-healing QA agent for your codebase</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">
              Connect your GitHub account to access the dashboard and manage your test runs.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button asChild size="lg" className="w-full gap-2">
              <a href="/api/auth/github">
                <Github className="h-5 w-5" />
                Connect with GitHub
              </a>
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <span>Secured connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
