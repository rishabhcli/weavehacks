import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  current: number;
  previous: number;
  unit: string;
  lowerIsBetter?: boolean;
}

export function ImprovementMetricCard({
  title,
  current,
  previous,
  unit,
  lowerIsBetter = false,
}: Props) {
  const change = current - previous;
  const percentChange = previous > 0 ? (change / previous) * 100 : 0;
  const isImprovement = lowerIsBetter ? change < 0 : change > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-3xl font-bold mt-1">
          {current.toFixed(1)}
          {unit}
        </div>
        <div
          className={`flex items-center gap-1 mt-2 text-sm ${
            isImprovement ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {isImprovement ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{Math.abs(percentChange).toFixed(1)}% vs last week</span>
        </div>
      </CardContent>
    </Card>
  );
}
