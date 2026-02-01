'use client';

import { Highlight, themes } from 'prism-react-renderer';
import { cn } from '@/lib/utils/cn';

interface DiffViewerProps {
  diff: string;
  language?: string;
  className?: string;
}

export function DiffViewer({ diff, language = 'diff', className }: DiffViewerProps) {
  // Split diff into lines for rendering
  const lines = diff.split('\n');

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      <div className="bg-muted px-4 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">Diff</span>
      </div>
      <Highlight theme={themes.nightOwl} code={diff} language={language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="p-4 text-xs font-mono overflow-x-auto"
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, lineIndex) => {
              const lineText = lines[lineIndex] || '';
              const isAddition = lineText.startsWith('+') && !lineText.startsWith('+++');
              const isDeletion = lineText.startsWith('-') && !lineText.startsWith('---');
              const isHeader = lineText.startsWith('@@');

              return (
                <div
                  key={lineIndex}
                  {...getLineProps({ line })}
                  className={cn(
                    'leading-relaxed',
                    isAddition && 'bg-success/10 text-success',
                    isDeletion && 'bg-destructive/10 text-destructive',
                    isHeader && 'text-primary bg-primary/5'
                  )}
                >
                  <span className="inline-block w-4 mr-2 text-muted-foreground select-none">
                    {isAddition ? '+' : isDeletion ? '-' : ' '}
                  </span>
                  {line.map((token, tokenIndex) => (
                    <span
                      key={tokenIndex}
                      {...getTokenProps({ token })}
                      style={isAddition || isDeletion || isHeader ? {} : getTokenProps({ token }).style}
                    />
                  ))}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
