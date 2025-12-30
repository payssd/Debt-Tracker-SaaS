import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

export type UserType = 'landlord' | 'shop_owner';

// Labels for different user types
export const USER_TYPE_LABELS = {
  landlord: {
    customer: 'Tenant',
    customers: 'Tenants',
    addCustomer: 'Add Tenant',
    newCustomer: 'New Tenant',
    customerName: 'Tenant Name',
    allCustomers: 'All Tenants',
    totalCustomers: 'Total Tenants',
    customerDetails: 'Tenant Details',
    noCustomers: 'No tenants yet',
    addFirstCustomer: 'Add your first tenant to get started',
    searchCustomers: 'Search tenants...',
    selectCustomer: 'Select Tenant',
    invoiceDescription: 'Rent Payment',
  },
  shop_owner: {
    customer: 'Customer',
    customers: 'Customers',
    addCustomer: 'Add Customer',
    newCustomer: 'New Customer',
    customerName: 'Customer Name',
    allCustomers: 'All Customers',
    totalCustomers: 'Total Customers',
    customerDetails: 'Customer Details',
    noCustomers: 'No customers yet',
    addFirstCustomer: 'Add your first customer to get started',
    searchCustomers: 'Search customers...',
    selectCustomer: 'Select Customer',
    invoiceDescription: 'Invoice Payment',
  },
} as const;

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  user_type: UserType;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  referral_code: string | null;
  referral_count: number;
  subscription_status: string | null;
  subscription_end_date: string | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      return data as UserProfile | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUserTypeLabels() {
  const { data: profile } = useProfile();
  
  return useMemo(() => {
    const userType = profile?.user_type || 'shop_owner';
    return USER_TYPE_LABELS[userType];
  }, [profile?.user_type]);
}

export function useUserType() {
  const { data: profile } = useProfile();
  return profile?.user_type || 'shop_owner';
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
