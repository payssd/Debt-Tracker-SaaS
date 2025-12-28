import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers, useCustomerInvoices } from '@/hooks/useSupabaseData';
import { formatCurrency } from '@/lib/data';
import { format } from 'date-fns';
import { MessageSquare, Copy, Check, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Reminders() {
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customer') || '';

  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const { data: allInvoices = [], isLoading: invoicesLoading } = useCustomerInvoices(selectedCustomerId);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const pendingInvoices = useMemo(
    () => allInvoices.filter((inv) => inv.status !== 'Paid'),
    [allInvoices]
  );

  const selectedInvoices = useMemo(
    () => pendingInvoices.filter((inv) => selectedInvoiceIds.includes(inv.id)),
    [pendingInvoices, selectedInvoiceIds]
  );

  const formatDateStr = (date: string) => format(new Date(date), 'MMM d, yyyy');

  const reminderMessage = useMemo(() => {
    if (!selectedCustomer || selectedInvoices.length === 0) return '';

    const total = selectedInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const invoiceList = selectedInvoices
      .map(
        (inv) =>
          `• ${inv.invoice_number}: ${formatCurrency(Number(inv.amount))} (Due: ${formatDateStr(inv.due_date)})`
      )
      .join('\n');

    return `Hello ${selectedCustomer.name},

This is a friendly reminder about your outstanding invoice${selectedInvoices.length > 1 ? 's' : ''}:

${invoiceList}

Total Outstanding: ${formatCurrency(total)}

Kindly advise on payment. Thank you for your business!`;
  }, [selectedCustomer, selectedInvoices]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(pendingInvoices.map((inv) => inv.id));
    } else {
      setSelectedInvoiceIds([]);
    }
  };

  const handleInvoiceToggle = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds((prev) => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reminderMessage);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Reminder message copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy message.',
        variant: 'destructive',
      });
    }
  };

  const openWhatsApp = () => {
    if (!selectedCustomer) return;
    
    // Clean phone number for WhatsApp
    const phone = selectedCustomer.contact.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(reminderMessage);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedInvoiceIds([]);
  };

  if (customersLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Reminder Generator
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create and send payment reminders via WhatsApp or email
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Invoice Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <MessageSquare className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Select Invoices</CardTitle>
                  <CardDescription>
                    Choose which invoices to include in the reminder
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {invoicesLoading && selectedCustomerId && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {selectedCustomer && !invoicesLoading && pendingInvoices.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox
                      id="select-all"
                      checked={selectedInvoiceIds.length === pendingInvoices.length && pendingInvoices.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Select All ({pendingInvoices.length} invoices)
                    </label>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pendingInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={invoice.id}
                            checked={selectedInvoiceIds.includes(invoice.id)}
                            onCheckedChange={(checked) =>
                              handleInvoiceToggle(invoice.id, checked as boolean)
                            }
                          />
                          <div>
                            <p className="font-medium text-sm">{invoice.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {formatDateStr(invoice.due_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {formatCurrency(Number(invoice.amount))}
                          </span>
                          <StatusBadge status={invoice.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCustomer && !invoicesLoading && pendingInvoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No pending invoices for this customer.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Message Preview</CardTitle>
              <CardDescription>
                Review the reminder message before sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={reminderMessage}
                readOnly
                className="min-h-[200px] resize-none font-mono text-sm"
                placeholder="Select a customer and invoices to generate the reminder message..."
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={copyToClipboard}
                  disabled={!reminderMessage}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Message'}
                </Button>
                <Button
                  className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-primary-foreground"
                  onClick={openWhatsApp}
                  disabled={!reminderMessage}
                >
                  <Send className="h-4 w-4" />
                  Send WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
