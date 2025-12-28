import { Customer, Invoice } from '@/types';

// Mock data for demonstration
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Mama Njeri Groceries',
    contact: '+254 712 345 678',
    address: 'Kikuyu Road, Nairobi',
    outstandingTotal: 45000,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Kamau Hardware',
    contact: '+254 723 456 789',
    address: 'Thika Road, Nairobi',
    outstandingTotal: 127500,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Wanjiku Textiles',
    contact: '+254 734 567 890',
    address: 'Gikomba Market',
    outstandingTotal: 0,
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    name: 'Ochieng Distributors',
    contact: '+254 745 678 901',
    address: 'Industrial Area',
    outstandingTotal: 89000,
    createdAt: new Date('2024-04-05'),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    customerId: '1',
    customerName: 'Mama Njeri Groceries',
    issueDate: new Date('2024-11-01'),
    dueDate: new Date('2024-11-15'),
    amount: 25000,
    status: 'Overdue',
    statementGenerated: false,
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    customerId: '1',
    customerName: 'Mama Njeri Groceries',
    issueDate: new Date('2024-12-01'),
    dueDate: new Date('2024-12-30'),
    amount: 20000,
    status: 'Pending',
    statementGenerated: false,
  },
  {
    id: '3',
    invoiceNumber: 'INV-003',
    customerId: '2',
    customerName: 'Kamau Hardware',
    issueDate: new Date('2024-10-15'),
    dueDate: new Date('2024-10-30'),
    amount: 75000,
    status: 'Overdue',
    statementGenerated: true,
  },
  {
    id: '4',
    invoiceNumber: 'INV-004',
    customerId: '2',
    customerName: 'Kamau Hardware',
    issueDate: new Date('2024-12-10'),
    dueDate: new Date('2024-12-25'),
    amount: 52500,
    status: 'Pending',
    statementGenerated: false,
  },
  {
    id: '5',
    invoiceNumber: 'INV-005',
    customerId: '3',
    customerName: 'Wanjiku Textiles',
    issueDate: new Date('2024-11-20'),
    dueDate: new Date('2024-12-04'),
    amount: 38000,
    status: 'Paid',
    statementGenerated: true,
  },
  {
    id: '6',
    invoiceNumber: 'INV-006',
    customerId: '4',
    customerName: 'Ochieng Distributors',
    issueDate: new Date('2024-11-25'),
    dueDate: new Date('2024-12-10'),
    amount: 89000,
    status: 'Overdue',
    statementGenerated: false,
  },
];

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getCustomerInvoices(customerId: string, invoices: Invoice[]): Invoice[] {
  return invoices.filter((inv) => inv.customerId === customerId);
}

export function calculateOutstandingTotal(customerId: string, invoices: Invoice[]): number {
  return invoices
    .filter((inv) => inv.customerId === customerId && inv.status !== 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
}

export function getPendingInvoicesCount(customerId: string, invoices: Invoice[]): number {
  return invoices.filter(
    (inv) => inv.customerId === customerId && (inv.status === 'Pending' || inv.status === 'Overdue')
  ).length;
}

export function hasOverdueInvoices(customerId: string, invoices: Invoice[]): boolean {
  return invoices.some((inv) => inv.customerId === customerId && inv.status === 'Overdue');
}

export function generateWhatsAppMessage(customer: Customer, invoice: Invoice): string {
  return `Hello ${customer.name}, invoice ${invoice.invoiceNumber} (${formatCurrency(invoice.amount)}) is due on ${formatDate(invoice.dueDate)}. Kindly advise on payment. Thank you.`;
}

export function generateBulkReminderMessage(customer: Customer, invoices: Invoice[]): string {
  const pendingInvoices = invoices.filter(
    (inv) => inv.customerId === customer.id && inv.status !== 'Paid'
  );
  const total = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  const invoiceList = pendingInvoices
    .map((inv) => `• ${inv.invoiceNumber}: ${formatCurrency(inv.amount)} (Due: ${formatDate(inv.dueDate)})`)
    .join('\n');

  return `Hello ${customer.name},\n\nThis is a friendly reminder about your outstanding invoices:\n\n${invoiceList}\n\nTotal Outstanding: ${formatCurrency(total)}\n\nKindly advise on payment. Thank you for your business!`;
}
