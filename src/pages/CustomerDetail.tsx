import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useCustomer, useCustomerInvoices, useUpdateInvoiceStatus, useDeleteCustomer, useDeleteInvoice, Invoice } from '@/hooks/useSupabaseData';
import { EditCustomerDialog } from '@/components/EditCustomerDialog';
import { EditInvoiceDialog } from '@/components/EditInvoiceDialog';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { formatCurrency } from '@/lib/data';
import { generateInvoicePdf } from '@/lib/invoicePdf';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  FileText,
  MessageSquare,
  Check,
  Loader2,
  Trash2,
  Pencil,
  Download,
  CreditCard,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: customer, isLoading: customerLoading } = useCustomer(id || '');
  const { data: invoices = [], isLoading: invoicesLoading } = useCustomerInvoices(id || '');
  const { data: profile } = useProfile();
  const updateInvoiceStatusMutation = useUpdateInvoiceStatus();
  const deleteCustomerMutation = useDeleteCustomer();
  const deleteInvoiceMutation = useDeleteInvoice();

  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const isLoading = customerLoading || invoicesLoading;

  const stats = useMemo(() => {
    const pending = invoices.filter((inv) => inv.status === 'Pending').length;
    const partial = invoices.filter((inv) => inv.status === 'Partial').length;
    const overdue = invoices.filter((inv) => inv.status === 'Overdue').length;
    const paid = invoices.filter((inv) => inv.status === 'Paid').length;
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
    return { pending, partial, overdue, paid, totalPaid };
  }, [invoices]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Customer not found</h2>
          <Link to="/customers" className="mt-4 inline-block">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleMarkPaid = (invoiceId: string) => {
    updateInvoiceStatusMutation.mutate({ invoiceId, status: 'Paid' });
  };

  const handleDeleteCustomer = async () => {
    try {
      await deleteCustomerMutation.mutateAsync(customer.id);
      toast({
        title: 'Customer deleted',
        description: `${customer.name} has been removed.`,
      });
      navigate('/customers');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await deleteInvoiceMutation.mutateAsync(invoiceId);
      toast({
        title: 'Invoice deleted',
        description: `Invoice ${invoiceNumber} has been removed.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    generateInvoicePdf({
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      amount: invoice.amount,
      status: invoice.status,
      customerName: customer?.name || 'Unknown',
      customerContact: customer?.contact || '',
      customerAddress: customer?.address,
    }, profile ? {
      company_name: profile.company_name,
      company_email: profile.company_email,
      company_phone: profile.company_phone,
      company_address: profile.company_address,
    } : undefined);
    toast({
      title: 'PDF Downloaded',
      description: `Invoice ${invoice.invoice_number} has been downloaded.`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <Button
          variant="ghost"
          className="gap-2 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary flex-shrink-0">
                  <User className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">{customer.name}</CardTitle>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {customer.contact}
                    </div>
                    {customer.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {customer.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/statements?customer=${customer.id}`}>
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Statement
                  </Button>
                </Link>
                <Link to={`/reminders?customer=${customer.id}`}>
                  <Button className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Reminder
                  </Button>
                </Link>
                <Button variant="outline" className="gap-2" onClick={() => setEditCustomerOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {customer.name}? This will also delete all their invoices. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteCustomer}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteCustomerMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(customer.outstanding_total))}</p>
              </div>
              <div className="rounded-lg bg-status-overdue-bg p-4">
                <p className="text-sm text-status-overdue">Overdue</p>
                <p className="text-2xl font-bold text-status-overdue">{stats.overdue}</p>
              </div>
              <div className="rounded-lg bg-status-pending-bg p-4">
                <p className="text-sm text-status-pending">Pending</p>
                <p className="text-2xl font-bold text-status-pending">{stats.pending}</p>
              </div>
              <div className="rounded-lg bg-status-paid-bg p-4">
                <p className="text-sm text-status-paid">Paid</p>
                <p className="text-2xl font-bold text-status-paid">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} for this customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="rounded-lg border overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Paid</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Balance</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(invoice.amount))}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell text-green-600">
                          {formatCurrency(Number(invoice.amount_paid || 0))}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell font-medium text-orange-600">
                          {formatCurrency(Number(invoice.amount) - Number(invoice.amount_paid || 0))}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {invoice.status !== 'Paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  setPaymentInvoice(invoice);
                                  setPaymentDialogOpen(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4" />
                                <span className="hidden sm:inline">Pay</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setEditInvoiceOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleDownloadPdf(invoice)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete invoice {invoice.invoice_number}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteInvoice(invoice.id, invoice.invoice_number)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No invoices for this customer yet.
                <Link to="/invoices/new" className="block mt-4">
                  <Button>Create Invoice</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <EditCustomerDialog
          customer={customer}
          open={editCustomerOpen}
          onOpenChange={setEditCustomerOpen}
        />
        <EditInvoiceDialog
          invoice={selectedInvoice}
          open={editInvoiceOpen}
          onOpenChange={setEditInvoiceOpen}
        />

        {paymentInvoice && (
          <RecordPaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            invoice={{
              id: paymentInvoice.id,
              invoice_number: paymentInvoice.invoice_number,
              amount: paymentInvoice.amount,
              amount_paid: paymentInvoice.amount_paid || 0,
              customer_name: customer?.name,
            }}
          />
        )}
      </div>
    </Layout>
  );
}
