-- =====================================================
-- ADMIN SYSTEM
-- Platform-wide analytics and admin access
-- =====================================================

-- Table to store admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions JSONB DEFAULT '{"view_users": true, "view_analytics": true, "manage_funnel": true, "manage_subscriptions": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table to store platform-wide analytics snapshots
CREATE TABLE IF NOT EXISTS platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_users INTEGER DEFAULT 0,
  new_users_today INTEGER DEFAULT 0,
  active_trials INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  revenue_today DECIMAL(12,2) DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  total_invoices INTEGER DEFAULT 0,
  total_outstanding DECIMAL(12,2) DEFAULT 0,
  funnel_day_0 INTEGER DEFAULT 0,
  funnel_day_1 INTEGER DEFAULT 0,
  funnel_day_2 INTEGER DEFAULT 0,
  funnel_day_3 INTEGER DEFAULT 0,
  funnel_day_4 INTEGER DEFAULT 0,
  funnel_day_5 INTEGER DEFAULT 0,
  funnel_day_6 INTEGER DEFAULT 0,
  funnel_day_7 INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Table to log admin actions for audit trail
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'subscription', 'funnel', etc.
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage admin_users"
  ON admin_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- RLS Policies for platform_analytics
CREATE POLICY "Admins can view platform_analytics"
  ON platform_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert platform_analytics"
  ON platform_analytics FOR INSERT
  WITH CHECK (true);

-- RLS Policies for admin_audit_log
CREATE POLICY "Admins can view audit_log"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert audit_log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics(date);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);

-- =====================================================
-- ADMIN HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM admin_users
  WHERE user_id = p_user_id;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform overview stats
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
  v_new_users_month INTEGER;
BEGIN
  -- Total users
  SELECT COUNT(*) INTO v_total_users FROM auth.users;
  
  -- Subscription stats
  SELECT 
    COUNT(*) FILTER (WHERE status = 'trialing') INTO v_active_trials,
    COUNT(*) FILTER (WHERE status = 'active') INTO v_active_subs,
    COUNT(*) FILTER (WHERE status IN ('expired', 'canceled')) INTO v_churned
  FROM user_subscriptions;
  
  -- Customer and invoice stats
  SELECT COUNT(*) INTO v_total_customers FROM customers;
  SELECT COUNT(*) INTO v_total_invoices FROM invoices;
  SELECT COALESCE(SUM(amount), 0) INTO v_total_outstanding 
  FROM invoices WHERE status != 'Paid';
  
  -- Conversion rate
  IF v_total_users > 0 THEN
    v_conversion_rate := (v_active_subs::DECIMAL / v_total_users::DECIMAL) * 100;
  ELSE
    v_conversion_rate := 0;
  END IF;
  
  -- New users
  SELECT COUNT(*) INTO v_new_users_today 
  FROM auth.users 
  WHERE created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO v_new_users_week 
  FROM auth.users 
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  SELECT COUNT(*) INTO v_new_users_month 
  FROM auth.users 
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  v_stats := json_build_object(
    'total_users', v_total_users,
    'active_trials', v_active_trials,
    'active_subscriptions', v_active_subs,
    'churned_users', v_churned,
    'total_customers', v_total_customers,
    'total_invoices', v_total_invoices,
    'total_outstanding', v_total_outstanding,
    'conversion_rate', ROUND(v_conversion_rate, 2),
    'new_users_today', v_new_users_today,
    'new_users_week', v_new_users_week,
    'new_users_month', v_new_users_month
  );
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get funnel stats
CREATE OR REPLACE FUNCTION get_funnel_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'by_day', (
      SELECT json_agg(day_stats)
      FROM (
        SELECT 
          day_number,
          COUNT(*) as users_count,
          COUNT(*) FILTER (WHERE whatsapp_sent) as whatsapp_sent,
          COUNT(*) FILTER (WHERE email_sent) as email_sent,
          COUNT(*) FILTER (WHERE sms_sent) as sms_sent
        FROM user_funnel_status
        GROUP BY day_number
        ORDER BY day_number
      ) day_stats
    ),
    'by_phase', (
      SELECT json_agg(phase_stats)
      FROM (
        SELECT 
          phase,
          COUNT(DISTINCT user_id) as users_count
        FROM user_funnel_status
        GROUP BY phase
      ) phase_stats
    ),
    'total_messages_sent', (
      SELECT json_build_object(
        'whatsapp', COUNT(*) FILTER (WHERE whatsapp_sent),
        'email', COUNT(*) FILTER (WHERE email_sent),
        'sms', COUNT(*) FILTER (WHERE sms_sent)
      )
      FROM user_funnel_status
    )
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users with their subscription status (for admin)
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
    COALESCE(u.raw_user_meta_data->>'name', u.email)::TEXT as name,
    u.created_at,
    COALESCE(us.status, 'none')::TEXT as subscription_status,
    us.trial_start,
    us.trial_end,
    sp.name::TEXT as plan_name,
    COALESCE((SELECT COUNT(*) FROM customers c WHERE c.user_id = u.id), 0) as customer_count,
    COALESCE((SELECT COUNT(*) FROM invoices i WHERE i.user_id = u.id), 0) as invoice_count,
    COALESCE((SELECT SUM(amount) FROM invoices i WHERE i.user_id = u.id AND i.status != 'Paid'), 0) as outstanding_total
  FROM auth.users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id
  LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activity
CREATE OR REPLACE FUNCTION get_recent_activity(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  activity_type TEXT,
  user_email TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  (
    -- New user signups
    SELECT 
      'signup'::TEXT as activity_type,
      u.email::TEXT as user_email,
      'New user signed up'::TEXT as description,
      u.created_at
    FROM auth.users u
    ORDER BY u.created_at DESC
    LIMIT p_limit
  )
  UNION ALL
  (
    -- Subscription changes
    SELECT 
      'subscription'::TEXT,
      (SELECT email FROM auth.users WHERE id = sh.user_id)::TEXT,
      ('Subscription ' || sh.action)::TEXT,
      sh.created_at
    FROM subscription_history sh
    ORDER BY sh.created_at DESC
    LIMIT p_limit
  )
  UNION ALL
  (
    -- Funnel messages
    SELECT 
      'funnel'::TEXT,
      (SELECT email FROM auth.users WHERE id = ufs.user_id)::TEXT,
      ('Day ' || ufs.day_number || ' funnel message sent')::TEXT,
      ufs.created_at
    FROM user_funnel_status ufs
    ORDER BY ufs.created_at DESC
    LIMIT p_limit
  )
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSERT YOUR ADMIN ACCOUNT
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- =====================================================

-- To make yourself an admin, run this after getting your user_id:
-- INSERT INTO admin_users (user_id, role) VALUES ('YOUR_USER_ID', 'super_admin');

-- Or use this to find your user_id by email:
-- SELECT id FROM auth.users WHERE email = 'your@email.com';
