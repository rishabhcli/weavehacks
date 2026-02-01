'use client';

import { FileCode, Plus, Minus, Brain } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PatchDiagnostics } from '@/lib/types';

interface PatchDetailsProps {
  diagnostics: PatchDiagnostics;
  className?: string;
}

function CodeBlock({ code, title }: { code: string; title: string }) {
  // Detect language from file extension in the code or use typescript as default
  const language = 'typescript';

  return (
    <div className="rounded-lg overflow-hidden border">
      <div className="px-3 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
        {title}
      </div>
      <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(className, 'text-xs p-3 overflow-x-auto max-h-64 overflow-y-auto')}
            style={style}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-right mr-4 text-muted-foreground/50 select-none">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

export function PatchDetails({ diagnostics, className }: PatchDetailsProps) {
  const { beforeCode, afterCode, filePath, llmReasoning, linesAdded, linesRemoved } = diagnostics;

  return (
    <div className={cn('space-y-4', className)}>
      {/* File & Stats */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FileCode className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-mono text-sm text-primary">{filePath}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs flex items-center gap-1 text-emerald-400">
                    <Plus className="h-3 w-3" />
                    {linesAdded} added
                  </span>
                  <span className="text-xs flex items-center gap-1 text-red-400">
                    <Minus className="h-3 w-3" />
                    {linesRemoved} removed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLM Reasoning */}
      {llmReasoning && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              AI Reasoning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{llmReasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* Code Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Minus className="h-4 w-4 text-red-400" />
            Before
          </h4>
          <CodeBlock code={beforeCode} title="Original Code" />
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-400" />
            After
          </h4>
          <CodeBlock code={afterCode} title="Patched Code" />
        </div>
      </div>
    </div>
  );
}
