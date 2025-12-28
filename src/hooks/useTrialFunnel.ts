import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface FunnelTemplate {
  id: string;
  day_number: number;
  phase: 'trial' | 'conversion' | 'recovery';
  purpose: string;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_template: string | null;
  email_subject: string | null;
  email_template: string | null;
  sms_template: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFunnelStatus {
  id: string;
  user_id: string;
  day_number: number;
  phase: string;
  whatsapp_sent: boolean;
  whatsapp_sent_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  sms_sent: boolean;
  sms_sent_at: string | null;
  whatsapp_status: string;
  email_status: string;
  sms_status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunnelAnalytics {
  id: string;
  user_id: string;
  event_type: string;
  day_number: number | null;
  channel: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Get all funnel templates
export function useFunnelTemplates() {
  return useQuery({
    queryKey: ['funnel-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_funnel_templates')
        .select('*')
        .order('day_number', { ascending: true });

      if (error) throw error;
      return data as FunnelTemplate[];
    },
  });
}

// Get current user's funnel status
export function useUserFunnelStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-funnel-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_funnel_status')
        .select('*')
        .eq('user_id', user?.id)
        .order('day_number', { ascending: true });

      if (error) throw error;
      return data as UserFunnelStatus[];
    },
    enabled: !!user,
  });
}

// Get funnel analytics for current user
export function useUserFunnelAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-funnel-analytics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as FunnelAnalytics[];
    },
    enabled: !!user,
  });
}

// Update a funnel template
export function useUpdateFunnelTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<FunnelTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('trial_funnel_templates')
        .update({
          ...template,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-templates'] });
    },
  });
}

// Toggle template active status
export function useToggleFunnelTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('trial_funnel_templates')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-templates'] });
    },
  });
}

// Calculate user's current trial day
export function useTrialDay() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trial-day', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('trial_start, trial_end, status')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      if (!data?.trial_start) return null;

      const trialStart = new Date(data.trial_start);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));

      return {
        currentDay: daysDiff,
        trialStart: data.trial_start,
        trialEnd: data.trial_end,
        status: data.status,
        phase: daysDiff <= 6 ? 'trial' : daysDiff === 7 ? 'conversion' : 'recovery',
        daysRemaining: daysDiff <= 6 ? 7 - daysDiff : 0,
        isExpired: daysDiff > 7 && data.status !== 'active',
      };
    },
    enabled: !!user,
  });
}

// Manually trigger funnel processing (admin only)
export function useTriggerFunnel() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-trial-funnel');
      if (error) throw error;
      return data;
    },
  });
}

// Get funnel metrics summary
export function useFunnelMetrics() {
  return useQuery({
    queryKey: ['funnel-metrics'],
    queryFn: async () => {
      // Get total users in each phase
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('status, trial_start');

      if (subError) throw subError;

      const now = new Date();
      const metrics = {
        totalUsers: subscriptions?.length || 0,
        inTrial: 0,
        trialEnded: 0,
        converted: 0,
        churned: 0,
        byDay: {} as Record<number, number>,
      };

      subscriptions?.forEach((sub) => {
        if (sub.status === 'active') {
          metrics.converted++;
        } else if (sub.trial_start) {
          const daysDiff = Math.floor(
            (now.getTime() - new Date(sub.trial_start).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysDiff <= 6) {
            metrics.inTrial++;
            metrics.byDay[daysDiff] = (metrics.byDay[daysDiff] || 0) + 1;
          } else if (daysDiff <= 14) {
            metrics.trialEnded++;
          } else {
            metrics.churned++;
          }
        }
      });

      return metrics;
    },
  });
}
