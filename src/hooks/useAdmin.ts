import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  total_users: number;
  active_trials: number;
  active_subscriptions: number;
  churned_users: number;
  total_customers: number;
  total_invoices: number;
  total_outstanding: number;
  conversion_rate: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
}

export interface FunnelStats {
  by_day: Array<{
    day_number: number;
    users_count: number;
    whatsapp_sent: number;
    email_sent: number;
    sms_sent: number;
  }>;
  by_phase: Array<{
    phase: string;
    users_count: number;
  }>;
  total_messages_sent: {
    whatsapp: number;
    email: number;
    sms: number;
  };
}

export interface UserAdmin {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  subscription_status: string;
  trial_start: string | null;
  trial_end: string | null;
  plan_name: string | null;
  customer_count: number;
  invoice_count: number;
  outstanding_total: number;
}

export interface RecentActivity {
  activity_type: string;
  user_email: string;
  description: string;
  created_at: string;
}

// Get platform stats - admin auth is checked at component level
export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_stats');

      if (error) throw error;
      return data as PlatformStats;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// Get funnel stats
export function useFunnelStatsAdmin() {
  return useQuery({
    queryKey: ['funnel-stats-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_funnel_stats');

      if (error) {
        // Return empty stats if function doesn't exist
        return { by_day: [], by_phase: [], total_messages_sent: { whatsapp: 0, email: 0, sms: 0 } } as FunnelStats;
      }
      return data as FunnelStats;
    },
  });
}

// Get all users (admin only)
export function useAllUsers() {
  return useQuery({
    queryKey: ['all-users-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users_admin');

      if (error) throw error;
      return data as UserAdmin[];
    },
  });
}

// Get recent activity
export function useRecentActivity(limit: number = 50) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_recent_activity', { p_limit: limit });

      if (error) throw error;
      return data as RecentActivity[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get audit log
export function useAuditLog(limit: number = 100) {
  return useQuery({
    queryKey: ['audit-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data;
    },
  });
}
