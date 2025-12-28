import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ReminderSettings {
  id: string;
  user_id: string;
  auto_reminders_enabled: boolean;
  days_before_due: number;
  days_after_overdue: number;
  repeat_interval_days: number;
  max_reminders_per_invoice: number;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_api_key: string | null;
  whatsapp_phone_number_id: string | null;
  email_api_key: string | null;
  email_from_address: string | null;
  sms_api_key: string | null;
  sms_from_number: string | null;
  pre_due_template: string;
  overdue_template: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerReminderSettings {
  id: string;
  customer_id: string;
  user_id: string;
  auto_reminders_enabled: boolean;
  preferred_channel: 'whatsapp' | 'email' | 'sms';
  whatsapp_number: string | null;
  email_address: string | null;
  sms_number: string | null;
  days_before_due: number | null;
  repeat_interval_days: number | null;
  max_reminders: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderHistory {
  id: string;
  user_id: string;
  customer_id: string;
  invoice_id: string | null;
  reminder_type: 'pre_due' | 'overdue' | 'manual';
  channel: 'whatsapp' | 'email' | 'sms' | 'manual_copy';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  message_content: string;
  external_message_id: string | null;
  error_message: string | null;
  invoices_included: string[];
  total_amount: number;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  customer?: {
    id: string;
    name: string;
    contact: string;
  };
}

// Fetch user's reminder settings
export function useReminderSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reminder-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ReminderSettings | null;
    },
    enabled: !!user,
  });
}

// Create or update reminder settings
export function useUpdateReminderSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<ReminderSettings>) => {
      const { data: existing } = await supabase
        .from('reminder_settings')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('reminder_settings')
          .update(settings)
          .eq('user_id', user!.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('reminder_settings')
          .insert({ ...settings, user_id: user!.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
    },
  });
}

// Fetch customer-specific reminder settings
export function useCustomerReminderSettings(customerId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer-reminder-settings', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_reminder_settings')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CustomerReminderSettings | null;
    },
    enabled: !!user && !!customerId,
  });
}

// Update customer reminder settings
export function useUpdateCustomerReminderSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      customerId,
      settings,
    }: {
      customerId: string;
      settings: Partial<CustomerReminderSettings>;
    }) => {
      const { data: existing } = await supabase
        .from('customer_reminder_settings')
        .select('id')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('customer_reminder_settings')
          .update(settings)
          .eq('customer_id', customerId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('customer_reminder_settings')
          .insert({
            ...settings,
            customer_id: customerId,
            user_id: user!.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-reminder-settings', variables.customerId],
      });
    },
  });
}

// Fetch reminder history
export function useReminderHistory(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reminder-history', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder_history')
        .select(`
          *,
          customer:customers(id, name, contact)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ReminderHistory[];
    },
    enabled: !!user,
  });
}

// Fetch reminder history for a specific customer
export function useCustomerReminderHistory(customerId: string, limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reminder-history', 'customer', customerId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ReminderHistory[];
    },
    enabled: !!user && !!customerId,
  });
}

// Record a manual reminder (when user copies/sends manually)
export function useRecordManualReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      customerId,
      invoiceIds,
      message,
      channel,
      totalAmount,
    }: {
      customerId: string;
      invoiceIds: string[];
      message: string;
      channel: 'whatsapp' | 'manual_copy';
      totalAmount: number;
    }) => {
      const { data, error } = await supabase
        .from('reminder_history')
        .insert({
          user_id: user!.id,
          customer_id: customerId,
          invoice_id: invoiceIds.length === 1 ? invoiceIds[0] : null,
          reminder_type: 'manual',
          channel,
          status: 'sent',
          message_content: message,
          invoices_included: invoiceIds,
          total_amount: totalAmount,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-history'] });
    },
  });
}

// Get customers needing reminders (overdue or approaching due date)
export function useCustomersNeedingReminders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customers-needing-reminders', user?.id],
    queryFn: async () => {
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Get all pending/overdue invoices
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, name, contact, address)
        `)
        .eq('user_id', user!.id)
        .in('status', ['Pending', 'Overdue'])
        .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Group by customer and calculate stats
      const customerMap = new Map<string, {
        customer: { id: string; name: string; contact: string; address: string | null };
        invoices: any[];
        overdueCount: number;
        preDueCount: number;
        totalAmount: number;
        oldestDueDate: string;
      }>();

      for (const inv of invoices || []) {
        const customerId = inv.customer_id;
        const dueDate = new Date(inv.due_date);
        const isOverdue = dueDate < today;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customer: inv.customer,
            invoices: [],
            overdueCount: 0,
            preDueCount: 0,
            totalAmount: 0,
            oldestDueDate: inv.due_date,
          });
        }

        const entry = customerMap.get(customerId)!;
        entry.invoices.push(inv);
        entry.totalAmount += Number(inv.amount);
        
        if (isOverdue) {
          entry.overdueCount++;
        } else {
          entry.preDueCount++;
        }

        if (inv.due_date < entry.oldestDueDate) {
          entry.oldestDueDate = inv.due_date;
        }
      }

      return Array.from(customerMap.values()).sort((a, b) => {
        // Sort by overdue first, then by oldest due date
        if (a.overdueCount > 0 && b.overdueCount === 0) return -1;
        if (a.overdueCount === 0 && b.overdueCount > 0) return 1;
        return new Date(a.oldestDueDate).getTime() - new Date(b.oldestDueDate).getTime();
      });
    },
    enabled: !!user,
  });
}
