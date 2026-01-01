import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCustomers, useCustomerInvoices, useMarkStatementsGenerated } from '@/hooks/useSupabaseData';
import { formatCurrency } from '@/lib/data';
import { format } from 'date-fns';
import { FileDown, ClipboardList, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Statements() {
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customer') || '';
  
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const { data: customerInvoices = [], isLoading: invoicesLoading } = useCustomerInvoices(selectedCustomerId);
  const markStatementsMutation = useMarkStatementsGenerated();

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const totalOutstanding = useMemo(
    () =>
      customerInvoices
        .filter((inv) => inv.status !== 'Paid')
        .reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.amount_paid || 0)), 0),
    [customerInvoices]
  );

  const totalPaid = useMemo(
    () => customerInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0),
    [customerInvoices]
  );

  const formatDateStr = (date: string) => format(new Date(date), 'MMM d, yyyy');

  const generatePDF = () => {
    if (!selectedCustomer) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Debt Tracker', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Statement of Account', pageWidth - 20, 25, { align: 'right' });
    doc.text(format(new Date(), 'MMM d, yyyy'), pageWidth - 20, 32, { align: 'right' });

    // Customer Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(selectedCustomer.name, 20, 63);
    doc.text(selectedCustomer.contact, 20, 70);
    if (selectedCustomer.address) {
      doc.text(selectedCustomer.address, 20, 77);
    }

    // Invoice Table
    const tableData = customerInvoices.map((inv) => [
      inv.invoice_number,
      formatDateStr(inv.issue_date),
      formatDateStr(inv.due_date),
      formatCurrency(Number(inv.amount)),
      formatCurrency(Number(inv.amount_paid || 0)),
      formatCurrency(Number(inv.amount) - Number(inv.amount_paid || 0)),
      inv.status,
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Invoice #', 'Issue Date', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' },
      },
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(245, 245, 245);
    doc.rect(pageWidth - 100, finalY - 5, 80, 45, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Invoiced:', pageWidth - 95, finalY + 5);
    doc.text(formatCurrency(customerInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)), pageWidth - 25, finalY + 5, { align: 'right' });
    
    doc.text('Total Paid:', pageWidth - 95, finalY + 15);
    doc.setTextColor(34, 197, 94);
    doc.text(formatCurrency(totalPaid), pageWidth - 25, finalY + 15, { align: 'right' });
    
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Balance Due:', pageWidth - 95, finalY + 30);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(totalOutstanding), pageWidth - 25, finalY + 30, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Thank you for your business. Please remit payment at your earliest convenience.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' }
    );

    // Save
    doc.save(`Statement_${selectedCustomer.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    // Mark invoices as statement generated
    const invoiceIds = customerInvoices.map((inv) => inv.id);
    markStatementsMutation.mutate(invoiceIds);

    toast({
      title: 'Statement Generated',
      description: 'PDF has been downloaded successfully.',
    });
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
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Statements</h1>
          <p className="mt-1 text-muted-foreground">
            Generate PDF statements for your customers
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <ClipboardList className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Generate Statement</CardTitle>
                <CardDescription>
                  Select a customer to view and generate their statement
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-w-sm">
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
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
            </div>

            {invoicesLoading && selectedCustomerId && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {selectedCustomer && !invoicesLoading && customerInvoices.length > 0 && (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {invoice.invoice_number}
                              {invoice.statement_generated && (
                                <Check className="h-4 w-4 text-status-paid" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDateStr(invoice.issue_date)}</TableCell>
                          <TableCell>{formatDateStr(invoice.due_date)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(invoice.amount))}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(Number(invoice.amount_paid || 0))}
                          </TableCell>
                          <TableCell className="text-right font-medium text-orange-600">
                            {formatCurrency(Number(invoice.amount) - Number(invoice.amount_paid || 0))}
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusBadge status={invoice.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
                  </div>

                  <Button onClick={generatePDF} className="gap-2" disabled={markStatementsMutation.isPending}>
                    {markStatementsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    Download PDF Statement
                  </Button>
                </div>
              </>
            )}

            {selectedCustomer && !invoicesLoading && customerInvoices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No invoices found for this customer.
              </div>
            )}

            {!selectedCustomer && (
              <div className="text-center py-8 text-muted-foreground">
                Select a customer to view their invoices.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
