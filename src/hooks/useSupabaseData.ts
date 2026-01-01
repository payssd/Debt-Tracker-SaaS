import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  address: string | null;
  outstanding_total: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
  statement_generated: boolean;
  created_at: string;
}

export function useCustomers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user,
  });
}

export function useCustomer(id: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!user && !!id,
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (customer: { name: string; contact: string; address?: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user!.id,
          name: customer.name,
          contact: customer.contact,
          address: customer.address || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useInvoices() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user,
  });
}

export function useCustomerInvoices(customerId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['invoices', 'customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user && !!customerId,
  });
}

export function useAddInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (invoice: {
      customer_id: string;
      invoice_number: string;
      issue_date: string;
      due_date: string;
      amount: number;
    }) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user!.id,
          customer_id: invoice.customer_id,
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          amount: invoice.amount,
          status: 'Pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update customer outstanding total
      await updateCustomerOutstanding(invoice.customer_id);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: 'Pending' | 'Paid' | 'Overdue' }) => {
      // Get customer_id first
      const { data: invoice } = await supabase
        .from('invoices')
        .select('customer_id')
        .eq('id', invoiceId)
        .single();
      
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId);
      
      if (error) throw error;
      
      // Update customer outstanding total
      if (invoice) {
        await updateCustomerOutstanding(invoice.customer_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useMarkStatementsGenerated() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const { error } = await supabase
        .from('invoices')
        .update({ statement_generated: true })
        .in('id', invoiceIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useBulkDeleteInvoices() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      // Get customer_ids first to update outstanding totals
      const { data: invoices } = await supabase
        .from('invoices')
        .select('customer_id')
        .in('id', invoiceIds);
      
      const customerIds = [...new Set(invoices?.map(inv => inv.customer_id) || [])];
      
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', invoiceIds);
      
      if (error) throw error;
      
      // Update customer outstanding totals
      for (const customerId of customerIds) {
        await updateCustomerOutstanding(customerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useBulkUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceIds, status }: { invoiceIds: string[]; status: 'Pending' | 'Paid' | 'Overdue' }) => {
      // Get customer_ids first
      const { data: invoices } = await supabase
        .from('invoices')
        .select('customer_id')
        .in('id', invoiceIds);
      
      const customerIds = [...new Set(invoices?.map(inv => inv.customer_id) || [])];
      
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .in('id', invoiceIds);
      
      if (error) throw error;
      
      // Update customer outstanding totals
      for (const customerId of customerIds) {
        await updateCustomerOutstanding(customerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // Get customer_id first to update outstanding total
      const { data: invoice } = await supabase
        .from('invoices')
        .select('customer_id')
        .eq('id', invoiceId)
        .single();
      
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);
      
      if (error) throw error;
      
      // Update customer outstanding total
      if (invoice) {
        await updateCustomerOutstanding(invoice.customer_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name, contact, address }: { id: string; name: string; contact: string; address?: string }) => {
      const { error } = await supabase
        .from('customers')
        .update({ name, contact, address: address || null })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, invoice_number, issue_date, due_date, amount, status }: {
      id: string;
      invoice_number: string;
      issue_date: string;
      due_date: string;
      amount: number;
      status: 'Pending' | 'Paid' | 'Overdue';
    }) => {
      // Get customer_id first
      const { data: invoice } = await supabase
        .from('invoices')
        .select('customer_id')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('invoices')
        .update({ invoice_number, issue_date, due_date, amount, status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update customer outstanding total
      if (invoice) {
        await updateCustomerOutstanding(invoice.customer_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

async function updateCustomerOutstanding(customerId: string) {
  // Calculate outstanding total (invoice amount - amount paid for non-Paid invoices)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('amount, amount_paid, status')
    .eq('customer_id', customerId);
  
  const total = invoices?.reduce((sum, inv) => {
    if (inv.status === 'Paid') return sum;
    // Outstanding = invoice amount - amount paid
    const balance = Number(inv.amount) - Number(inv.amount_paid || 0);
    return sum + Math.max(0, balance);
  }, 0) || 0;
  
  await supabase
    .from('customers')
    .update({ outstanding_total: total })
    .eq('id', customerId);
}
