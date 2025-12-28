import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'super_admin';
  permissions: {
    view_users: boolean;
    view_analytics: boolean;
    manage_funnel: boolean;
    manage_subscriptions: boolean;
  };
  created_at: string;
}

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

// Check if current user is admin
export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('is_admin', { p_user_id: user?.id });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
  });
}

// Get admin role
export function useAdminRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_admin_role', { p_user_id: user?.id });

      if (error) throw error;
      return data as string | null;
    },
    enabled: !!user,
  });
}

// Get platform stats
export function usePlatformStats() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_stats');

      if (error) throw error;
      return data as PlatformStats;
    },
    enabled: !!isAdmin,
    refetchInterval: 60000, // Refresh every minute
  });
}

// Get funnel stats
export function useFunnelStatsAdmin() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['funnel-stats-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_funnel_stats');

      if (error) throw error;
      return data as FunnelStats;
    },
    enabled: !!isAdmin,
  });
}

// Get all users (admin only)
export function useAllUsers() {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['all-users-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users_admin');

      if (error) throw error;
      return data as UserAdmin[];
    },
    enabled: !!isAdmin,
  });
}

// Get recent activity
export function useRecentActivity(limit: number = 50) {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_recent_activity', { p_limit: limit });

      if (error) throw error;
      return data as RecentActivity[];
    },
    enabled: !!isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Log admin action
export function useLogAdminAction() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      action,
      targetType,
      targetId,
      details,
    }: {
      action: string;
      targetType?: string;
      targetId?: string;
      details?: Record<string, any>;
    }) => {
      // Get admin user id
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!adminUser) throw new Error('Not an admin');

      const { error } = await supabase.from('admin_audit_log').insert({
        admin_user_id: adminUser.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      });

      if (error) throw error;
    },
  });
}

// Get audit log
export function useAuditLog(limit: number = 100) {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['audit-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });
}
