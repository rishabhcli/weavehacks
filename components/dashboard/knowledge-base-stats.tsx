import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

interface KBStats {
  totalPatterns: number;
  totalFixes: number;
  successfulFixes: number;
  byType: Record<string, number>;
}

export function KnowledgeBaseStats({ stats }: { stats: KBStats | null }) {
  if (!stats) return null;

  const successRate =
    stats.totalFixes > 0
      ? Number(((stats.successfulFixes / stats.totalFixes) * 100).toFixed(0))
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Knowledge Base
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-3xl font-bold">{stats.totalPatterns}</div>
            <div className="text-sm text-muted-foreground">Patterns Learned</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-3xl font-bold">{successRate}%</div>
            <div className="text-sm text-muted-foreground">Fix Success Rate</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Bug Types Learned:</div>
          {Object.entries(stats.byType ?? {}).length > 0 ? (
            Object.entries(stats.byType).map(([type, count]) => (
              <div
                key={type}
                className="flex justify-between items-center"
              >
                <span className="text-sm text-muted-foreground">{type}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              No types categorized yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
