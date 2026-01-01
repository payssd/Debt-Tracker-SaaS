import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Payment, PaymentMethod } from '@/types';

export interface PaymentWithInvoice extends Payment {
  invoice?: {
    invoice_number: string;
    customer_id: string;
    amount: number;
  };
}

export function usePayments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(invoice_number, customer_id, amount)
        `)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as PaymentWithInvoice[];
    },
    enabled: !!user,
  });
}

export function useInvoicePayments(invoiceId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user && !!invoiceId,
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (payment: {
      invoice_id: string;
      amount: number;
      payment_date: string;
      payment_method: PaymentMethod;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: user!.id,
          invoice_id: payment.invoice_id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          payment_method: payment.payment_method,
          notes: payment.notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'invoice', variables.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      amount?: number;
      payment_date?: string;
      payment_method?: PaymentMethod;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useRecentPayments(limit: number = 5) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payments', 'recent', limit, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            invoice_number,
            customer_id,
            amount,
            customer:customers(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function usePaymentStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payments', 'stats', user?.id],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Get all payments
      const { data: allPayments, error } = await supabase
        .from('payments')
        .select('amount, payment_date');

      if (error) throw error;

      const stats = {
        totalCollected: 0,
        thisMonth: 0,
        thisWeek: 0,
        today: 0,
      };

      allPayments?.forEach(payment => {
        const amount = Number(payment.amount);
        stats.totalCollected += amount;
        
        if (payment.payment_date >= startOfMonth) {
          stats.thisMonth += amount;
        }
        if (payment.payment_date >= startOfWeek) {
          stats.thisWeek += amount;
        }
        if (payment.payment_date === today) {
          stats.today += amount;
        }
      });

      return stats;
    },
    enabled: !!user,
  });
}
