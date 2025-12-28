import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  referral_code: string;
  referred_by: string | null;
  subscription_status: 'Active' | 'FreeTrial' | 'Expired';
  subscription_end_date: string | null;
  referral_count: number;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'Pending' | 'Completed';
  created_at: string;
  referred_profile?: Profile;
}

export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useReferrals() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      // Get referrals made by this user
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (refError) throw refError;
      
      if (!referrals || referrals.length === 0) return [];
      
      // Get profiles of referred users
      const referredIds = referrals.map(r => r.referred_id);
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', referredIds);
      
      if (profError) throw profError;
      
      // Combine data
      return referrals.map(r => ({
        ...r,
        referred_profile: profiles?.find(p => p.id === r.referred_id),
      })) as Referral[];
    },
    enabled: !!user,
  });
}

export function getReferralLink(referralCode: string) {
  return `${window.location.origin}/auth?ref=${referralCode}`;
}
