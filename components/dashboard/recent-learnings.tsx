import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, CheckCircle } from 'lucide-react';

export function RecentLearnings() {
  const learnings = [
    {
      id: 1,
      pattern: '"onClick is undefined" → Add null check',
      successRate: 95,
      timesUsed: 12,
    },
    {
      id: 2,
      pattern: '"404 on /api/users" → Verify route params',
      successRate: 87,
      timesUsed: 8,
    },
    {
      id: 3,
      pattern: '"TypeError: map of undefined" → Validate array',
      successRate: 91,
      timesUsed: 15,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recent Learnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {learnings.map((learning) => (
          <div
            key={learning.id}
            className="p-3 bg-muted/30 rounded-lg space-y-1"
          >
            <div className="text-sm font-medium">{learning.pattern}</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {learning.successRate}% success
              </span>
              <span>Used {learning.timesUsed} times</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
