import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useInvoices, useUpdateInvoiceStatus, useCustomers, useDeleteInvoice, useBulkDeleteInvoices, useBulkUpdateInvoiceStatus, Invoice } from '@/hooks/useSupabaseData';
import { EditInvoiceDialog } from '@/components/EditInvoiceDialog';
import { formatCurrency } from '@/lib/data';
import { generateInvoicePdf } from '@/lib/invoicePdf';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';
import { FileText, Plus, Search, Check, Loader2, Trash2, Pencil, X, Download } from 'lucide-react';
import { useState, useMemo } from 'react';
import { InvoiceStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

type FilterStatus = 'all' | InvoiceStatus;

export default function Invoices() {
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const { data: profile } = useProfile();
  const updateInvoiceStatusMutation = useUpdateInvoiceStatus();
  const deleteInvoiceMutation = useDeleteInvoice();
  const bulkDeleteMutation = useBulkDeleteInvoices();
  const bulkUpdateStatusMutation = useBulkUpdateInvoiceStatus();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  const getCustomerDetails = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    const customer = getCustomerDetails(invoice.customer_id);
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

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(query) ||
          getCustomerName(inv.customer_id).toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Sort by due date, most urgent first
    return filtered.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [invoices, customers, searchQuery, statusFilter]);

  const handleMarkPaid = (invoiceId: string) => {
    updateInvoiceStatusMutation.mutate({ invoiceId, status: 'Paid' });
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

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInvoices.map(inv => inv.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteMutation.mutateAsync([...selectedIds]);
      toast({
        title: 'Invoices deleted',
        description: `${selectedIds.size} invoice(s) have been removed.`,
      });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoices. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkStatusChange = async (status: 'Pending' | 'Paid' | 'Overdue') => {
    try {
      await bulkUpdateStatusMutation.mutateAsync({ invoiceIds: [...selectedIds], status });
      toast({
        title: 'Status updated',
        description: `${selectedIds.size} invoice(s) marked as ${status}.`,
      });
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (invoicesLoading) {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Invoices</h1>
            <p className="mt-1 text-muted-foreground">
              Track and manage all your invoices
            </p>
          </div>
          <Link to="/invoices/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection} className="gap-1">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
                <div className="h-4 w-px bg-border" />
                <Select onValueChange={(v) => handleBulkStatusChange(v as 'Pending' | 'Paid' | 'Overdue')}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Mark Pending</SelectItem>
                    <SelectItem value="Paid">Mark Paid</SelectItem>
                    <SelectItem value="Overdue">Mark Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {selectedIds.size} Invoice(s)</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} invoice(s)? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {bulkDeleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle>All Invoices</CardTitle>
                  <CardDescription>{invoices.length} total invoices</CardDescription>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-48"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as FilterStatus)}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length > 0 ? (
              <div className="rounded-lg border overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden sm:table-cell">Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className={selectedIds.has(invoice.id) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(invoice.id)}
                            onCheckedChange={() => toggleSelect(invoice.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{getCustomerName(invoice.customer_id)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(invoice.amount))}
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
                                className="gap-1 text-status-paid hover:text-status-paid hover:bg-status-paid-bg"
                                onClick={() => handleMarkPaid(invoice.id)}
                                disabled={updateInvoiceStatusMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                                <span className="hidden sm:inline">Paid</span>
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
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No invoices found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first invoice to get started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <EditInvoiceDialog
          invoice={selectedInvoice}
          open={editInvoiceOpen}
          onOpenChange={setEditInvoiceOpen}
        />
      </div>
    </Layout>
  );
}
