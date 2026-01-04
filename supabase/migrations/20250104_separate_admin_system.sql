-- =====================================================
-- SEPARATE ADMIN SYSTEM
-- Completely isolated from user auth
-- =====================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table to store admin accounts (separate from auth.users)
CREATE TABLE IF NOT EXISTS admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on admin_accounts to allow login function to work
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to call login function (it validates credentials)
CREATE POLICY "Allow public read for login" ON admin_accounts
  FOR SELECT USING (true);

-- =====================================================
-- ADMIN LOGIN FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION admin_login(p_email TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  v_admin admin_accounts%ROWTYPE;
  v_result JSON;
BEGIN
  -- Find admin by email
  SELECT * INTO v_admin
  FROM admin_accounts
  WHERE LOWER(email) = LOWER(p_email);
  
  -- Check if admin exists
  IF v_admin.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid email or password');
  END IF;
  
  -- Verify password
  IF v_admin.password_hash != crypt(p_password, v_admin.password_hash) THEN
    RETURN json_build_object('success', false, 'message', 'Invalid email or password');
  END IF;
  
  -- Success - return admin info
  RETURN json_build_object(
    'success', true,
    'admin_id', v_admin.id,
    'email', v_admin.email,
    'role', v_admin.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADMIN CHANGE PASSWORD FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION admin_change_password(
  p_admin_id UUID,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin admin_accounts%ROWTYPE;
BEGIN
  -- Find admin
  SELECT * INTO v_admin
  FROM admin_accounts
  WHERE id = p_admin_id;
  
  IF v_admin.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Admin not found');
  END IF;
  
  -- Verify current password
  IF v_admin.password_hash != crypt(p_current_password, v_admin.password_hash) THEN
    RETURN json_build_object('success', false, 'message', 'Current password is incorrect');
  END IF;
  
  -- Update password
  UPDATE admin_accounts
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_admin_id;
  
  RETURN json_build_object('success', true, 'message', 'Password changed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PLATFORM STATS FUNCTION (accessible to admin dashboard)
-- =====================================================
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
  v_total_users INTEGER;
  v_active_trials INTEGER;
  v_active_subs INTEGER;
  v_churned INTEGER;
  v_total_customers INTEGER;
  v_total_invoices INTEGER;
  v_total_outstanding DECIMAL;
  v_conversion_rate DECIMAL;
  v_new_users_today INTEGER;
  v_new_users_week INTEGER;
BEGIN
  -- Total users
  SELECT COUNT(*) INTO v_total_users FROM auth.users;
  
  -- Subscription stats (handle if table doesn't exist)
  BEGIN
    SELECT 
      COUNT(*) FILTER (WHERE status = 'trialing'),
      COUNT(*) FILTER (WHERE status = 'active'),
      COUNT(*) FILTER (WHERE status IN ('expired', 'canceled'))
    INTO v_active_trials, v_active_subs, v_churned
    FROM user_subscriptions;
  EXCEPTION WHEN undefined_table THEN
    v_active_trials := 0;
    v_active_subs := 0;
    v_churned := 0;
  END;
  
  -- Customer and invoice stats
  SELECT COUNT(*) INTO v_total_customers FROM customers;
  SELECT COUNT(*) INTO v_total_invoices FROM invoices;
  SELECT COALESCE(SUM(amount - COALESCE(amount_paid, 0)), 0) INTO v_total_outstanding 
  FROM invoices WHERE status != 'Paid';
  
  -- Conversion rate
  IF v_total_users > 0 THEN
    v_conversion_rate := (COALESCE(v_active_subs, 0)::DECIMAL / v_total_users::DECIMAL) * 100;
  ELSE
    v_conversion_rate := 0;
  END IF;
  
  -- New users
  SELECT COUNT(*) INTO v_new_users_today FROM auth.users WHERE created_at >= CURRENT_DATE;
  SELECT COUNT(*) INTO v_new_users_week FROM auth.users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  v_stats := json_build_object(
    'total_users', v_total_users,
    'active_trials', COALESCE(v_active_trials, 0),
    'active_subscriptions', COALESCE(v_active_subs, 0),
    'churned_users', COALESCE(v_churned, 0),
    'total_customers', v_total_customers,
    'total_invoices', v_total_invoices,
    'total_outstanding', v_total_outstanding,
    'conversion_rate', ROUND(COALESCE(v_conversion_rate, 0), 2),
    'new_users_today', v_new_users_today,
    'new_users_week', v_new_users_week
  );
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET ALL USERS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ,
  subscription_status TEXT,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  plan_name TEXT,
  customer_count BIGINT,
  invoice_count BIGINT,
  outstanding_total DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::TEXT,
    COALESCE(u.raw_user_meta_data->>'name', p.name, u.email)::TEXT as name,
    u.created_at,
    COALESCE(us.status, 'none')::TEXT as subscription_status,
    us.trial_start,
    us.trial_end,
    COALESCE(sp.name, '')::TEXT as plan_name,
    COALESCE((SELECT COUNT(*) FROM customers c WHERE c.user_id = u.id), 0) as customer_count,
    COALESCE((SELECT COUNT(*) FROM invoices i WHERE i.user_id = u.id), 0) as invoice_count,
    COALESCE((SELECT SUM(amount - COALESCE(amount_paid, 0)) FROM invoices i WHERE i.user_id = u.id AND i.status != 'Paid'), 0) as outstanding_total
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN user_subscriptions us ON u.id = us.user_id
  LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET RECENT ACTIVITY FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_recent_activity(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  activity_type TEXT,
  user_email TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'signup'::TEXT as activity_type,
    u.email::TEXT as user_email,
    'New user signed up'::TEXT as description,
    u.created_at
  FROM auth.users u
  ORDER BY u.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE DEFAULT ADMIN ACCOUNT
-- Email: admin@debttrackerapp.com
-- Password: Admin@2024
-- =====================================================
INSERT INTO admin_accounts (email, password_hash, role)
VALUES (
  'admin@debttrackerapp.com',
  crypt('Admin@2024', gen_salt('bf')),
  'super_admin'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = crypt('Admin@2024', gen_salt('bf')),
  role = 'super_admin',
  updated_at = NOW();
