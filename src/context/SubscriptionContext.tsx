import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { UserSubscription, SubscriptionPlan, SubscriptionStatus } from '@/types';

type InitializePaymentResult = {
  authorizationUrl: string | null;
  error?: {
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
  };
};

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  isTrialing: boolean;
  isActive: boolean;
  isExpired: boolean;
  trialDaysLeft: number;
  hasAccess: boolean;
  refreshSubscription: () => Promise<void>;
  initializePayment: (planId: string, billingInterval: 'monthly' | 'yearly') => Promise<InitializePaymentResult>;
  verifyPayment: (reference: string) => Promise<{ success: boolean; error?: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return;
    }

    // Parse features from JSONB
    const parsedPlans = data?.map(plan => ({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]'),
    })) || [];

    setPlans(parsedPlans);
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
    }

    if (data) {
      // Parse plan features if exists
      const subscriptionData = {
        ...data,
        plan: data.plan ? {
          ...data.plan,
          features: Array.isArray(data.plan.features) 
            ? data.plan.features 
            : JSON.parse(data.plan.features || '[]'),
        } : undefined,
      };
      setSubscription(subscriptionData);
    }

    setLoading(false);
  }, [user]);

  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    await fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Calculate subscription status
  const isTrialing = subscription?.status === 'trialing';
  const isActive = subscription?.status === 'active';
  const isExpired = subscription?.status === 'expired' || subscription?.status === 'canceled';

  // Calculate trial days left
  const trialDaysLeft = React.useMemo(() => {
    if (subscription?.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      const now = new Date();
      // Set both to start of day for accurate day counting
      trialEnd.setHours(23, 59, 59, 999);
      now.setHours(0, 0, 0, 0);
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    // If no subscription record but user exists, give them 7 days from account creation
    if (user?.created_at) {
      const createdAt = new Date(user.created_at);
      const trialEnd = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      // Set both to start of day for accurate day counting
      trialEnd.setHours(23, 59, 59, 999);
      now.setHours(0, 0, 0, 0);
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    return 0;
  }, [subscription?.trial_end, user?.created_at]);

  // Check if trial has expired
  const trialExpired = isTrialing && trialDaysLeft <= 0;

  // User has access if:
  // 1. Active paid subscription
  // 2. Still in valid trial period (with subscription record)
  // 3. New user without subscription record but within 7 days of account creation
  const hasAccess = isActive || (isTrialing && trialDaysLeft > 0) || (!subscription && user && trialDaysLeft > 0);

  const initializePayment = async (
    planId: string,
    billingInterval: 'monthly' | 'yearly'
  ): Promise<InitializePaymentResult> => {
    try {
      // Refresh the session to ensure token is valid before calling edge function
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        return {
          authorizationUrl: null,
          error: {
            message: 'Session expired. Please log in again.',
            details: refreshError,
          },
        };
      }

      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          planId,
          billingInterval,
          callbackUrl: `${window.location.origin}/subscription/callback`,
        },
      });

      if (error) {
        console.error('Payment initialization error:', error);
        return {
          authorizationUrl: null,
          error: {
            message: error.message,
            status: (error as any)?.status,
            code: (error as any)?.code,
            details: (error as any),
          },
        };
      }

      const authorizationUrl = (data as any)?.authorization_url as string | undefined;
      if (!authorizationUrl) {
        console.error('Payment initialization returned no authorization_url:', data);
        return {
          authorizationUrl: null,
          error: {
            message: 'No authorization URL returned from payment provider',
            details: data,
          },
        };
      }

      return { authorizationUrl };
    } catch (err: unknown) {
      console.error('Error initializing payment:', err);
      return {
        authorizationUrl: null,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          details: err,
        },
      };
    }
  };

  const verifyPayment = async (reference: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Refresh the session to ensure token is valid before calling edge function
      await supabase.auth.refreshSession();

      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference },
      });

      if (error) {
        console.error('Payment verification invoke error:', error);

        // supabase-js does not expose the response body for non-2xx statuses.
        // Fetch directly so we can log the real error payload (helps debug RLS/constraints/schema issues).
        let errorMessage = error.message || 'Network error calling verification service';
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          const supabaseUrl = (supabase as any)?.supabaseUrl as string | undefined;
          const supabaseKey = (supabase as any)?.supabaseKey as string | undefined;

          if (supabaseUrl && accessToken) {
            const res = await fetch(`${supabaseUrl}/functions/v1/paystack-verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(supabaseKey ? { apikey: supabaseKey } : {}),
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ reference }),
            });

            const body = await res.json().catch(() => null);
            console.error('paystack-verify raw response:', { status: res.status, body });
            if (body?.error) {
              errorMessage = body.error;
              if (body.details) {
                errorMessage += `: ${JSON.stringify(body.details)}`;
              }
            }
          }
        } catch (debugErr) {
          console.error('Failed to fetch paystack-verify raw response:', debugErr);
        }

        return { success: false, error: errorMessage };
      }

      const success = (data as any)?.success === true;
      if (!success) {
        console.error('Payment verification failed:', data);
        const errorMsg = (data as any)?.error || 'Verification returned unsuccessful';
        const details = (data as any)?.details;
        return { 
          success: false, 
          error: details ? `${errorMsg}: ${JSON.stringify(details)}` : errorMsg 
        };
      }

      await refreshSubscription();
      return { success: true };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plans,
        loading,
        isTrialing,
        isActive,
        isExpired,
        trialDaysLeft,
        hasAccess,
        refreshSubscription,
        initializePayment,
        verifyPayment,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
