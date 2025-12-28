import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Customer, Invoice, InvoiceStatus } from '@/types';
import { mockCustomers, mockInvoices, calculateOutstandingTotal } from '@/lib/data';

interface DataContextType {
  customers: Customer[];
  invoices: Invoice[];
  addCustomer: (customer: Omit<Customer, 'id' | 'outstandingTotal' | 'createdAt'>) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'statementGenerated'>) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  markStatementGenerated: (invoiceIds: string[]) => void;
  getCustomerById: (id: string) => Customer | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  const addCustomer = (customerData: Omit<Customer, 'id' | 'outstandingTotal' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      outstandingTotal: 0,
      createdAt: new Date(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'statementGenerated'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: crypto.randomUUID(),
      statementGenerated: false,
    };
    setInvoices((prev) => {
      const updated = [...prev, newInvoice];
      // Update customer outstanding total
      updateCustomerOutstanding(invoiceData.customerId, updated);
      return updated;
    });
  };

  const updateInvoiceStatus = (invoiceId: string, status: InvoiceStatus) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status } : inv
      );
      // Find the invoice to get customerId
      const invoice = prev.find((inv) => inv.id === invoiceId);
      if (invoice) {
        updateCustomerOutstanding(invoice.customerId, updated);
      }
      return updated;
    });
  };

  const markStatementGenerated = (invoiceIds: string[]) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        invoiceIds.includes(inv.id) ? { ...inv, statementGenerated: true } : inv
      )
    );
  };

  const updateCustomerOutstanding = (customerId: string, currentInvoices: Invoice[]) => {
    const total = calculateOutstandingTotal(customerId, currentInvoices);
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, outstandingTotal: total } : c))
    );
  };

  const getCustomerById = (id: string) => customers.find((c) => c.id === id);

  return (
    <DataContext.Provider
      value={{
        customers,
        invoices,
        addCustomer,
        addInvoice,
        updateInvoiceStatus,
        markStatementGenerated,
        getCustomerById,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
