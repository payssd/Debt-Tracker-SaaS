import { InvoiceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        status === 'Paid' && 'status-paid',
        status === 'Pending' && 'status-pending',
        status === 'Partial' && 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        status === 'Overdue' && 'status-overdue',
        className
      )}
    >
      {status}
    </span>
  );
}
