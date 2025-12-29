import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface OverdueInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
}

export interface OverdueStats {
  count: number;
  totalAmount: number;
  invoices: OverdueInvoice[];
}

// Hook to check and auto-update overdue invoices
export function useAutoUpdateOverdueInvoices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return { updated: 0 };

      const today = new Date().toISOString().split('T')[0];

      // Find all pending invoices that are past due date
      const { data: overdueInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('id, customer_id')
        .eq('user_id', user.id)
        .eq('status', 'Pending')
        .lt('due_date', today);

      if (fetchError) throw fetchError;

      if (!overdueInvoices || overdueInvoices.length === 0) {
        return { updated: 0 };
      }

      // Update all overdue invoices to 'Overdue' status
      const invoiceIds = overdueInvoices.map(inv => inv.id);
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'Overdue' })
        .in('id', invoiceIds);

      if (updateError) throw updateError;

      // Update customer outstanding totals
      const customerIds = [...new Set(overdueInvoices.map(inv => inv.customer_id))];
      for (const customerId of customerIds) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('amount, status')
          .eq('customer_id', customerId);

        const outstanding = invoices
          ?.filter(inv => inv.status !== 'Paid')
          .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        await supabase
          .from('customers')
          .update({ outstanding_total: outstanding })
          .eq('id', customerId);
      }

      return { updated: invoiceIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-stats'] });
    },
  });
}

// Hook to get overdue invoice statistics
export function useOverdueStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['overdue-stats', user?.id],
    queryFn: async (): Promise<OverdueStats> => {
      if (!user) return { count: 0, totalAmount: 0, invoices: [] };

      const today = new Date();

      // Get all overdue invoices with customer names
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          amount,
          due_date,
          customers!inner(name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'Overdue');

      if (error) throw error;

      const invoices: OverdueInvoice[] = (data || []).map((inv: any) => {
        const dueDate = new Date(inv.due_date);
        const diffTime = today.getTime() - dueDate.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          customer_id: inv.customer_id,
          customer_name: inv.customers?.name || 'Unknown',
          amount: Number(inv.amount),
          due_date: inv.due_date,
          days_overdue: daysOverdue,
        };
      });

      const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

      return {
        count: invoices.length,
        totalAmount,
        invoices: invoices.sort((a, b) => b.days_overdue - a.days_overdue),
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to check if overdue notification should be shown
export function useOverdueNotification() {
  const { user } = useAuth();
  const { data: overdueStats, isLoading } = useOverdueStats();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if notification was dismissed today
      const dismissKey = `overdue_notification_dismissed_${user.id}`;
      const dismissedAt = localStorage.getItem(dismissKey);
      
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt).toDateString();
        const today = new Date().toDateString();
        setDismissed(dismissedDate === today);
      } else {
        setDismissed(false);
      }
    }
  }, [user]);

  const dismissNotification = () => {
    if (user) {
      const dismissKey = `overdue_notification_dismissed_${user.id}`;
      localStorage.setItem(dismissKey, new Date().toISOString());
      setDismissed(true);
    }
  };

  const shouldShow = !isLoading && !dismissed && overdueStats && overdueStats.count > 0;

  return {
    shouldShow,
    overdueStats,
    dismissNotification,
    isLoading,
  };
}
