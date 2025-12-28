import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-soft',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  'font-medium',
                  trend.value > 0 ? 'text-status-overdue' : 'text-status-paid'
                )}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>{' '}
              {trend.label}
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            variant === 'default' && 'bg-primary/10 text-primary',
            variant === 'success' && 'bg-status-paid-bg text-status-paid',
            variant === 'warning' && 'bg-status-pending-bg text-status-pending',
            variant === 'danger' && 'bg-status-overdue-bg text-status-overdue'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
