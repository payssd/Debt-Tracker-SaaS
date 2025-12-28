import { Customer, Invoice } from '@/types';
import { formatCurrency, getPendingInvoicesCount, hasOverdueInvoices } from '@/lib/data';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, ChevronRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  invoices: Invoice[];
}

export function CustomerCard({ customer, invoices }: CustomerCardProps) {
  const pendingCount = getPendingInvoicesCount(customer.id, invoices);
  const isOverdue = hasOverdueInvoices(customer.id, invoices);

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-soft',
        isOverdue && 'border-status-overdue/30 bg-status-overdue-bg/20'
      )}
    >
      {isOverdue && (
        <div className="absolute -top-2 -right-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-status-overdue text-primary-foreground animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground truncate">{customer.contact}</p>
          {customer.address && (
            <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">{customer.address}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(customer.outstandingTotal)}
          </p>
          <p className="text-xs text-muted-foreground">Outstanding</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <StatusBadge status={isOverdue ? 'Overdue' : 'Pending'} />
          ) : (
            <StatusBadge status="Paid" />
          )}
          <span className="text-xs text-muted-foreground">
            {pendingCount} pending invoice{pendingCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/statements?customer=${customer.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <FileText className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/reminders?customer=${customer.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/customers/${customer.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
