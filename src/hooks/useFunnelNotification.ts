import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface FunnelNotification {
  day_number: number;
  phase: string;
  purpose: string;
  title: string;
  message: string;
  cta_text: string;
  cta_url: string;
  icon: string;
  dismissed: boolean;
}

// In-app notification messages for each funnel day
const FUNNEL_NOTIFICATIONS: Record<number, Omit<FunnelNotification, 'day_number' | 'dismissed'>> = {
  0: {
    phase: 'trial',
    purpose: 'Welcome',
    title: '🎉 Welcome to Debt Tracker!',
    message: 'Your 7-day FREE trial has started. Add your first customer and invoice to start tracking debts effortlessly.',
    cta_text: 'Add First Customer',
    cta_url: '/customers/new',
    icon: 'sparkles',
  },
  1: {
    phase: 'trial',
    purpose: 'Onboarding',
    title: '👋 Day 1: Quick Start Guide',
    message: 'Have you added your first customer yet? Most successful users add 5+ customers on day 1!',
    cta_text: 'Add Customer',
    cta_url: '/customers/new',
    icon: 'users',
  },
  2: {
    phase: 'trial',
    purpose: 'Pain Awareness',
    title: '💡 Save 5+ Hours Weekly',
    message: 'Stop chasing payments manually. Use automatic reminders and professional statements to get paid faster.',
    cta_text: 'Set Up Reminders',
    cta_url: '/reminders',
    icon: 'clock',
  },
  3: {
    phase: 'trial',
    purpose: 'Feature Highlight',
    title: '📊 Track Everything in One Place',
    message: 'Your dashboard shows total outstanding, overdue amounts, and customer insights. Check your analytics now!',
    cta_text: 'View Dashboard',
    cta_url: '/dashboard',
    icon: 'chart',
  },
  4: {
    phase: 'trial',
    purpose: 'Success Story',
    title: '⭐ Users Love Debt Tracker',
    message: '"I recovered ₦2.5M in 2 weeks!" - Join thousands of businesses getting paid faster.',
    cta_text: 'Send First Reminder',
    cta_url: '/reminders',
    icon: 'star',
  },
  5: {
    phase: 'trial',
    purpose: 'Urgency',
    title: '⏰ 2 Days Left in Your Trial!',
    message: 'Your free trial ends in 2 days. Make sure you\'ve experienced all the features before deciding.',
    cta_text: 'Explore Features',
    cta_url: '/dashboard',
    icon: 'alert',
  },
  6: {
    phase: 'trial',
    purpose: 'Trial Ending',
    title: '🔔 Last Day of Free Trial!',
    message: 'Tomorrow your trial ends. Subscribe now to keep tracking debts and sending reminders without interruption.',
    cta_text: 'Subscribe Now',
    cta_url: '/subscription',
    icon: 'bell',
  },
  7: {
    phase: 'conversion',
    purpose: 'Trial Expired',
    title: '⚠️ Your Trial Has Ended',
    message: 'Don\'t lose your progress! Subscribe now to continue using all features and keep your data.',
    cta_text: 'Choose a Plan',
    cta_url: '/subscription',
    icon: 'warning',
  },
  8: {
    phase: 'conversion',
    purpose: 'Value Reminder',
    title: '📈 Don\'t Lose Your Momentum',
    message: 'You\'ve added customers and invoices. Don\'t let that work go to waste. Reactivate now!',
    cta_text: 'Reactivate Account',
    cta_url: '/subscription',
    icon: 'trending',
  },
  10: {
    phase: 'conversion',
    purpose: 'Special Offer',
    title: '🎁 Special Offer: 20% Off!',
    message: 'We miss you! Use code COMEBACK20 for 20% off your first month. Limited time only.',
    cta_text: 'Claim Discount',
    cta_url: '/subscription',
    icon: 'gift',
  },
  12: {
    phase: 'recovery',
    purpose: 'Last Chance',
    title: '💔 We Hate Goodbyes',
    message: 'This might be our last message. If debt collection is still a pain, we\'re here to help.',
    cta_text: 'Give Us Another Try',
    cta_url: '/subscription',
    icon: 'heart',
  },
  14: {
    phase: 'recovery',
    purpose: 'Final Message',
    title: '👋 Until We Meet Again',
    message: 'Your account will remain inactive. Come back anytime - your data is safe with us.',
    cta_text: 'Reactivate Now',
    cta_url: '/subscription',
    icon: 'refresh',
  },
};

// Get user's current funnel day based on trial start
export function useFunnelDay() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['funnel-day', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's subscription/trial info
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('trial_start, trial_end, status')
        .eq('user_id', user.id)
        .single();

      if (error || !subscription?.trial_start) {
        return null;
      }

      const trialStart = new Date(subscription.trial_start);
      const now = new Date();
      const diffTime = now.getTime() - trialStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Cap at day 14
      return Math.min(Math.max(0, diffDays), 14);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get notification for current funnel day
export function useFunnelNotification() {
  const { user } = useAuth();
  const { data: dayNumber, isLoading: dayLoading } = useFunnelDay();

  return useQuery({
    queryKey: ['funnel-notification', user?.id, dayNumber],
    queryFn: async (): Promise<FunnelNotification | null> => {
      if (!user || dayNumber === null || dayNumber === undefined) {
        return null;
      }

      // Check if notification was dismissed today
      const dismissKey = `funnel_notification_dismissed_${user.id}_day_${dayNumber}`;
      const dismissedAt = localStorage.getItem(dismissKey);
      
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt).toDateString();
        const today = new Date().toDateString();
        if (dismissedDate === today) {
          return null; // Already dismissed today
        }
      }

      // Get notification template for this day
      const notification = FUNNEL_NOTIFICATIONS[dayNumber];
      if (!notification) {
        return null;
      }

      return {
        day_number: dayNumber,
        ...notification,
        dismissed: false,
      };
    },
    enabled: !!user && dayNumber !== null && dayNumber !== undefined && !dayLoading,
    staleTime: 1000 * 60 * 5,
  });
}

// Dismiss notification for today
export function useDismissFunnelNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: dayNumber } = useFunnelDay();

  return useMutation({
    mutationFn: async () => {
      if (!user || dayNumber === null || dayNumber === undefined) {
        throw new Error('No user or day number');
      }

      const dismissKey = `funnel_notification_dismissed_${user.id}_day_${dayNumber}`;
      localStorage.setItem(dismissKey, new Date().toISOString());

      // Log analytics
      try {
        await supabase.from('funnel_analytics').insert({
          user_id: user.id,
          event_type: 'notification_dismissed',
          day_number: dayNumber,
          channel: 'in_app',
          metadata: { dismissed_at: new Date().toISOString() },
        });
      } catch (e) {
        // Silent fail for analytics
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-notification'] });
    },
  });
}

// Log notification view
export function useLogNotificationView() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (dayNumber: number) => {
      if (!user) return;

      try {
        await supabase.from('funnel_analytics').insert({
          user_id: user.id,
          event_type: 'notification_viewed',
          day_number: dayNumber,
          channel: 'in_app',
          metadata: { viewed_at: new Date().toISOString() },
        });
      } catch (e) {
        // Silent fail
      }
    },
  });
}

// Log CTA click
export function useLogNotificationClick() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ dayNumber, ctaUrl }: { dayNumber: number; ctaUrl: string }) => {
      if (!user) return;

      try {
        await supabase.from('funnel_analytics').insert({
          user_id: user.id,
          event_type: 'notification_clicked',
          day_number: dayNumber,
          channel: 'in_app',
          metadata: { clicked_at: new Date().toISOString(), cta_url: ctaUrl },
        });
      } catch (e) {
        // Silent fail
      }
    },
  });
}
