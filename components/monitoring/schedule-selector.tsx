'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MonitoringSchedule } from '@/lib/types';

interface ScheduleSelectorProps {
  value: MonitoringSchedule;
  onChange: (schedule: MonitoringSchedule) => void;
  disabled?: boolean;
}

const scheduleOptions: { value: MonitoringSchedule; label: string; description: string }[] = [
  { value: 'on_push', label: 'On Push', description: 'Run on every push to default branch' },
  { value: 'hourly', label: 'Hourly', description: 'Run every hour' },
  { value: 'daily', label: 'Daily', description: 'Run once per day at midnight' },
  { value: 'weekly', label: 'Weekly', description: 'Run once per week on Monday' },
];

export function ScheduleSelector({ value, onChange, disabled }: ScheduleSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select schedule" />
      </SelectTrigger>
      <SelectContent>
        {scheduleOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex flex-col">
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
