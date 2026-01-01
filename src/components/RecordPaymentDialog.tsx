import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddPayment } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/data';
import { Loader2, CreditCard } from 'lucide-react';
import { PaymentMethod } from '@/types';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    amount: number;
    amount_paid: number;
    customer_name?: string;
  };
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money (M-Pesa)' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export function RecordPaymentDialog({ open, onOpenChange, invoice }: RecordPaymentDialogProps) {
  const balance = invoice.amount - (invoice.amount_paid || 0);
  const [amount, setAmount] = useState(balance.toString());
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  
  const addPayment = useAddPayment();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }

    if (paymentAmount > balance) {
      toast({
        title: 'Amount exceeds balance',
        description: `The remaining balance is ${formatCurrency(balance)}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await addPayment.mutateAsync({
        invoice_id: invoice.id,
        amount: paymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes || undefined,
      });

      toast({
        title: 'Payment recorded',
        description: `${formatCurrency(paymentAmount)} payment recorded successfully`,
      });

      // Reset form and close
      setAmount(balance.toString());
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const handlePayFull = () => {
    setAmount(balance.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoice_number}
            {invoice.customer_name && ` • ${invoice.customer_name}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Amount:</span>
              <span className="font-medium">{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="font-medium text-green-600">{formatCurrency(invoice.amount_paid || 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span className="text-muted-foreground font-medium">Balance Due:</span>
              <span className="font-bold text-primary">{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
              <Button type="button" variant="outline" onClick={handlePayFull}>
                Pay Full
              </Button>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addPayment.isPending}>
              {addPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
