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
        status === 'Overdue' && 'status-overdue',
        className
      )}
    >
      {status}
    </span>
  );
}
