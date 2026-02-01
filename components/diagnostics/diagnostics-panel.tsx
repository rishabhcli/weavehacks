'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Search,
  Wrench,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestFailureDetails } from './test-failure-details';
import { TriageDetails } from './triage-details';
import { PatchDetails } from './patch-details';
import { VerificationDetails } from './verification-details';
import type { DiagnosticsData } from '@/lib/types';

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticsData;
  className?: string;
}

type TabType = 'failure' | 'triage' | 'patch' | 'verification';

const tabs: {
  id: TabType;
  label: string;
  icon: typeof AlertCircle;
  dataKey: keyof DiagnosticsData;
}[] = [
  { id: 'failure', label: 'Test Failure', icon: AlertCircle, dataKey: 'testFailure' },
  { id: 'triage', label: 'Triage', icon: Search, dataKey: 'triage' },
  { id: 'patch', label: 'Patch', icon: Wrench, dataKey: 'patch' },
  { id: 'verification', label: 'Verification', icon: ShieldCheck, dataKey: 'verification' },
];

export function DiagnosticsPanel({ diagnostics, className }: DiagnosticsPanelProps) {
  // Find first available tab with data
  const firstAvailableTab = tabs.find((tab) => diagnostics[tab.dataKey])?.id || 'failure';
  const [activeTab, setActiveTab] = useState<TabType>(firstAvailableTab);

  // Check which tabs have data
  const hasData = (tab: TabType): boolean => {
    const dataKey = tabs.find((t) => t.id === tab)?.dataKey;
    return dataKey ? Boolean(diagnostics[dataKey]) : false;
  };

  const hasAnyData = tabs.some((tab) => hasData(tab.id));

  if (!hasAnyData) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <HelpCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No diagnostic data available yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Diagnostics will appear as the run progresses
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-0 border-b">
        <CardTitle className="text-lg mb-3">Diagnostics</CardTitle>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasTabData = hasData(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => hasTabData && setActiveTab(tab.id)}
                disabled={!hasTabData}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                  isActive
                    ? 'text-foreground bg-background border border-b-0 border-border'
                    : hasTabData
                      ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="diagnostics-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Tab Content */}
        {activeTab === 'failure' && diagnostics.testFailure && (
          <TestFailureDetails diagnostics={diagnostics.testFailure} />
        )}
        {activeTab === 'triage' && diagnostics.triage && (
          <TriageDetails diagnostics={diagnostics.triage} />
        )}
        {activeTab === 'patch' && diagnostics.patch && (
          <PatchDetails diagnostics={diagnostics.patch} />
        )}
        {activeTab === 'verification' && diagnostics.verification && (
          <VerificationDetails diagnostics={diagnostics.verification} />
        )}
      </CardContent>
    </Card>
  );
}
