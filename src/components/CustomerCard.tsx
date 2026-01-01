import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/data';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, ChevronRight, AlertTriangle, Plus, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { Customer, Invoice } from '@/hooks/useSupabaseData';

interface CustomerCardProps {
  customer: Customer;
  invoices: Invoice[];
}

export function CustomerCard({ customer, invoices }: CustomerCardProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Calculate payment stats for this customer
  const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);
  const pendingCount = customerInvoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue' || inv.status === 'Partial').length;
  const isOverdue = customerInvoices.some(inv => inv.status === 'Overdue');
  const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
  const hasPartialPayments = totalPaid > 0 && totalPaid < totalInvoiced;
  
  // Get the oldest overdue invoice to show "Overdue by X days"
  const overdueInfo = useMemo(() => {
    const overdueInvoices = customerInvoices.filter(inv => inv.status === 'Overdue');
    if (overdueInvoices.length === 0) return null;
    
    const oldestOverdue = overdueInvoices.reduce((oldest, inv) => {
      const invDate = new Date(inv.due_date);
      const oldestDate = new Date(oldest.due_date);
      return invDate < oldestDate ? inv : oldest;
    });
    
    const daysOverdue = differenceInDays(new Date(), new Date(oldestOverdue.due_date));
    return { days: daysOverdue, count: overdueInvoices.length };
  }, [customerInvoices]);
  
  // Find first unpaid invoice for quick payment
  const firstUnpaidInvoice = customerInvoices.find(inv => inv.status !== 'Paid');
  
  const handleQuickPayment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (firstUnpaidInvoice) {
      setSelectedInvoice(firstUnpaidInvoice);
      setPaymentDialogOpen(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          'group relative rounded-xl border-2 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-soft',
          isOverdue 
            ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' 
            : 'border-transparent'
        )}
      >
        {isOverdue && (
          <div className="absolute -top-2 -right-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white animate-pulse shadow-lg">
              <AlertTriangle className="h-4 w-4" />
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
            <p className={cn(
              "text-lg font-bold",
              isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"
            )}>
              {formatCurrency(customer.outstanding_total)}
            </p>
            <p className="text-xs text-muted-foreground">Balance Due</p>
          </div>
        </div>

        {/* Payment Info - Show Paid amount if any */}
        {totalPaid > 0 && (
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-green-600 dark:text-green-400 font-medium">
              Paid: {formatCurrency(totalPaid)}
            </span>
            {hasPartialPayments && (
              <span className="text-orange-600 dark:text-orange-400">
                of {formatCurrency(totalInvoiced)}
              </span>
            )}
          </div>
        )}

        {/* Overdue Warning */}
        {overdueInfo && (
          <div className="mt-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-md">
            <p className="text-xs font-medium text-red-700 dark:text-red-300">
              ⚠️ Overdue by {overdueInfo.days} day{overdueInfo.days !== 1 ? 's' : ''} 
              {overdueInfo.count > 1 && ` (${overdueInfo.count} invoices)`}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasPartialPayments ? (
              <StatusBadge status="Partial" />
            ) : pendingCount > 0 ? (
              <StatusBadge status={isOverdue ? 'Overdue' : 'Pending'} />
            ) : (
              <StatusBadge status="Paid" />
            )}
            <span className="text-xs text-muted-foreground">
              {pendingCount} pending
            </span>
          </div>

          {/* Quick Actions - Always visible */}
          <div className="flex items-center gap-1">
            <Link to={`/invoices/add?customer=${customer.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Debt
              </Button>
            </Link>
            {firstUnpaidInvoice && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 gap-1 text-xs text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={handleQuickPayment}
              >
                <Banknote className="h-3 w-3" />
                Pay
              </Button>
            )}
          </div>
        </div>

        {/* Secondary Actions - Show on hover */}
        <div className="mt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/statements?customer=${customer.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <FileText className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link to={`/reminders?customer=${customer.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link to={`/customers/${customer.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Payment Dialog */}
      {selectedInvoice && (
        <RecordPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={selectedInvoice}
        />
      )}
    </>
  );
}
