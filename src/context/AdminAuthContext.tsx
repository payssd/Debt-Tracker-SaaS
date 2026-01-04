import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = 'debt_tracker_admin_session';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing admin session on mount
  useEffect(() => {
    const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        // Verify session is still valid (check expiry)
        if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
          setAdmin(parsed.admin);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch (e) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      // Call the admin_login function
      const { data, error } = await supabase.rpc('admin_login', {
        p_email: email.toLowerCase().trim(),
        p_password: password,
      });

      if (error) {
        console.error('Admin login error:', error);
        return { error: error.message || 'Login failed' };
      }

      if (!data || !data.success) {
        return { error: data?.message || 'Invalid email or password' };
      }

      // Store admin session
      const adminUser: AdminUser = {
        id: data.admin_id,
        email: data.email,
        role: data.role,
      };

      // Session expires in 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        admin: adminUser,
        expiresAt: expiresAt.toISOString(),
      }));

      setAdmin(adminUser);
      return { error: null };
    } catch (err: any) {
      console.error('Admin login exception:', err);
      return { error: err.message || 'An error occurred during login' };
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdmin(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ error: string | null }> => {
    if (!admin) {
      return { error: 'Not logged in' };
    }

    try {
      const { data, error } = await supabase.rpc('admin_change_password', {
        p_admin_id: admin.id,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });

      if (error) {
        return { error: error.message || 'Failed to change password' };
      }

      if (!data || !data.success) {
        return { error: data?.message || 'Failed to change password' };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An error occurred' };
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, changePassword }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
