import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatCurrency } from './data';

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  status: string;
  customerName: string;
  customerContact: string;
  customerAddress?: string | null;
}

export function generateInvoicePdf(invoice: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth / 2, 30, { align: 'center' });
  
  // Invoice details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Left side - Company info (placeholder)
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Company Name', 20, 58);
  doc.text('your@email.com', 20, 66);
  
  // Right side - Invoice info
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', pageWidth - 80, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 80, 58);
  doc.text(`Issue Date: ${format(new Date(invoice.issue_date), 'MMM d, yyyy')}`, pageWidth - 80, 66);
  doc.text(`Due Date: ${format(new Date(invoice.due_date), 'MMM d, yyyy')}`, pageWidth - 80, 74);
  
  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerName, 20, 103);
  doc.text(invoice.customerContact, 20, 111);
  if (invoice.customerAddress) {
    doc.text(invoice.customerAddress, 20, 119);
  }
  
  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    'Pending': [234, 179, 8],
    'Paid': [34, 197, 94],
    'Overdue': [239, 68, 68],
  };
  const [r, g, b] = statusColors[invoice.status] || [128, 128, 128];
  doc.setFillColor(r, g, b);
  doc.roundedRect(pageWidth - 50, 85, 35, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(invoice.status, pageWidth - 32.5, 93, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  
  // Invoice table
  autoTable(doc, {
    startY: 135,
    head: [['Description', 'Amount']],
    body: [
      ['Invoice Amount', formatCurrency(invoice.amount)],
    ],
    foot: [['Total Due', formatCurrency(invoice.status === 'Paid' ? 0 : invoice.amount)]],
    headStyles: { 
      fillColor: [59, 130, 246],
      fontSize: 12,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: [0, 0, 0],
      fontSize: 12,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 11,
      cellPadding: 8,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', pageWidth / 2, finalY, { align: 'center' });
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy')}`, pageWidth / 2, finalY + 8, { align: 'center' });
  
  // Download
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
}
