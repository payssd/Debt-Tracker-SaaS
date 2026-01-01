import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserType = 'landlord' | 'shop_owner';

interface CompanyInfo {
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  userType?: UserType;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, referralCode?: string, companyInfo?: CompanyInfo) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile data from user metadata on login
  const syncProfileFromMetadata = async (user: User) => {
    try {
      const metadata = user.user_metadata;
      if (!metadata?.name && !metadata?.company_name) return; // No data to sync
      
      // Check if profile exists and needs updating
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, company_name')
        .eq('id', user.id)
        .maybeSingle();
      
      // If profile doesn't have name/company but metadata does, sync it
      const needsSync = profile && (
        (!profile.name && metadata?.name) ||
        (!profile.company_name && metadata?.company_name)
      );
      
      if (!profile) {
        // Create profile with metadata
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email || '',
          name: metadata?.name || null,
          company_name: metadata?.company_name || null,
          company_email: metadata?.company_email || user.email || null,
          company_phone: metadata?.company_phone || null,
          user_type: metadata?.user_type || 'shop_owner',
        });
        console.log('Created profile from signup metadata');
      } else if (needsSync) {
        // Update profile with metadata
        await supabase.from('profiles').update({
          name: metadata?.name || profile.name,
          company_name: metadata?.company_name || profile.company_name,
          company_email: metadata?.company_email || null,
          company_phone: metadata?.company_phone || null,
          user_type: metadata?.user_type || 'shop_owner',
        }).eq('id', user.id);
        console.log('Synced profile from signup metadata');
      }
    } catch (error) {
      console.error('Failed to sync profile from metadata:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Sync profile data on login (after email verification)
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to avoid blocking auth flow
          setTimeout(() => syncProfileFromMetadata(session.user), 100);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Also sync on initial load if user is logged in
      if (session?.user) {
        syncProfileFromMetadata(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, referralCode?: string, companyInfo?: CompanyInfo) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          referral_code: referralCode || null,
          company_name: companyInfo?.companyName || null,
          company_email: companyInfo?.companyEmail || email,
          company_phone: companyInfo?.companyPhone || null,
          user_type: companyInfo?.userType || 'shop_owner',
        },
      },
    });
    
    // Fallback: Save profile data directly after signup (in case edge function doesn't trigger)
    if (data?.user && !error) {
      try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (!existingProfile) {
          // Create profile with signup data
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            name: name,
            company_name: companyInfo?.companyName || null,
            company_email: companyInfo?.companyEmail || email,
            company_phone: companyInfo?.companyPhone || null,
            user_type: companyInfo?.userType || 'shop_owner',
          });
        } else {
          // Update existing profile with signup data
          await supabase.from('profiles').update({
            name: name,
            company_name: companyInfo?.companyName || null,
            company_email: companyInfo?.companyEmail || email,
            company_phone: companyInfo?.companyPhone || null,
            user_type: companyInfo?.userType || 'shop_owner',
          }).eq('id', data.user.id);
        }
      } catch (profileError) {
        console.error('Failed to save profile during signup:', profileError);
        // Don't fail signup if profile save fails - user can update in settings
      }
    }
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
