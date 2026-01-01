import { format } from 'date-fns';
import { useInvoicePayments, useDeletePayment } from '@/hooks/usePayments';
import { formatCurrency } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, Banknote, CreditCard, Smartphone, Building2, FileText, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethod } from '@/types';

interface PaymentHistoryProps {
  invoiceId: string;
  invoiceAmount: number;
  amountPaid: number;
}

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  bank_transfer: <Building2 className="h-4 w-4" />,
  mobile_money: <Smartphone className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  cheque: <FileText className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  card: 'Card',
  cheque: 'Cheque',
  other: 'Other',
};

export function PaymentHistory({ invoiceId, invoiceAmount, amountPaid }: PaymentHistoryProps) {
  const { data: payments = [], isLoading } = useInvoicePayments(invoiceId);
  const deletePayment = useDeletePayment();
  const { toast } = useToast();

  const balance = invoiceAmount - amountPaid;

  const handleDelete = async (paymentId: string) => {
    try {
      await deletePayment.mutateAsync(paymentId);
      toast({
        title: 'Payment deleted',
        description: 'The payment has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-muted-foreground text-xs mb-1">Invoice Total</div>
          <div className="font-semibold">{formatCurrency(invoiceAmount)}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-muted-foreground text-xs mb-1">Amount Paid</div>
          <div className="font-semibold text-green-600">{formatCurrency(amountPaid)}</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
          <div className="text-muted-foreground text-xs mb-1">Balance Due</div>
          <div className="font-semibold text-orange-600">{formatCurrency(balance)}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Payment Progress</span>
          <span>{Math.round((amountPaid / invoiceAmount) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${Math.min(100, (amountPaid / invoiceAmount) * 100)}%` }}
          />
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Payment History</h4>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No payments recorded yet</p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-full">
                    {PAYMENT_METHOD_ICONS[payment.payment_method as PaymentMethod] || PAYMENT_METHOD_ICONS.other}
                  </div>
                  <div>
                    <div className="font-medium">{formatCurrency(payment.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(payment.payment_date), 'MMM d, yyyy')} • {PAYMENT_METHOD_LABELS[payment.payment_method as PaymentMethod] || 'Other'}
                    </div>
                    {payment.notes && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Note: {payment.notes}
                      </div>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this {formatCurrency(payment.amount)} payment? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(payment.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deletePayment.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
