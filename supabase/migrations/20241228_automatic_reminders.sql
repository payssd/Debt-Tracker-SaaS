-- Automatic Reminders Feature - Database Schema
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- 1. REMINDER SETTINGS TABLE (Global per user)
-- ============================================
CREATE TABLE IF NOT EXISTS reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Global settings
  auto_reminders_enabled BOOLEAN DEFAULT true,
  
  -- Reminder timing
  days_before_due INTEGER DEFAULT 3,           -- Send reminder X days before due date
  days_after_overdue INTEGER DEFAULT 1,        -- Send first reminder X days after overdue
  repeat_interval_days INTEGER DEFAULT 7,      -- Repeat reminder every X days while overdue
  max_reminders_per_invoice INTEGER DEFAULT 5, -- Max reminders per invoice
  
  -- Channel preferences
  whatsapp_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- API credentials (encrypted in production)
  whatsapp_api_key TEXT,
  whatsapp_phone_number_id TEXT,
  email_api_key TEXT,
  email_from_address TEXT,
  sms_api_key TEXT,
  sms_from_number TEXT,
  
  -- Message templates
  pre_due_template TEXT DEFAULT 'Hello {customer_name},

This is a friendly reminder that invoice {invoice_number} for {amount} is due on {due_date}.

Please arrange payment before the due date to avoid any late fees.

Thank you for your business!',

  overdue_template TEXT DEFAULT 'Hello {customer_name},

This is a reminder that invoice {invoice_number} for {amount} was due on {due_date} and is now {days_overdue} days overdue.

Outstanding invoices:
{invoice_list}

Total Outstanding: {total_amount}

Kindly arrange payment at your earliest convenience.

Thank you!',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================
-- 2. CUSTOMER REMINDER SETTINGS (Per customer overrides)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Override global settings
  auto_reminders_enabled BOOLEAN DEFAULT true,
  preferred_channel TEXT DEFAULT 'whatsapp' CHECK (preferred_channel IN ('whatsapp', 'email', 'sms')),
  
  -- Customer-specific contact info
  whatsapp_number TEXT,
  email_address TEXT,
  sms_number TEXT,
  
  -- Custom timing (NULL = use global settings)
  days_before_due INTEGER,
  repeat_interval_days INTEGER,
  max_reminders INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id)
);

-- ============================================
-- 3. REMINDER HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reminder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Reminder details
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('pre_due', 'overdue', 'manual')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms', 'manual_copy')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  
  -- Message content
  message_content TEXT NOT NULL,
  
  -- Response tracking
  external_message_id TEXT,        -- ID from WhatsApp/Email/SMS provider
  error_message TEXT,
  
  -- Metadata
  invoices_included UUID[],        -- Array of invoice IDs included in this reminder
  total_amount DECIMAL(12, 2),
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. SCHEDULED REMINDERS QUEUE
-- ============================================
CREATE TABLE IF NOT EXISTS reminder_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('pre_due', 'overdue')),
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Reference to history after sent
  reminder_history_id UUID REFERENCES reminder_history(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user ON reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_reminder_settings_customer ON customer_reminder_settings(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_reminder_settings_user ON customer_reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_user ON reminder_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_customer ON reminder_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_invoice ON reminder_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_created ON reminder_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminder_queue_scheduled ON reminder_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reminder_queue_user ON reminder_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_queue_status ON reminder_queue(status);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_queue ENABLE ROW LEVEL SECURITY;

-- Reminder Settings Policies
CREATE POLICY "Users can view own reminder settings"
  ON reminder_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder settings"
  ON reminder_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminder settings"
  ON reminder_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Customer Reminder Settings Policies
CREATE POLICY "Users can view own customer reminder settings"
  ON customer_reminder_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customer reminder settings"
  ON customer_reminder_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customer reminder settings"
  ON customer_reminder_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customer reminder settings"
  ON customer_reminder_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Reminder History Policies
CREATE POLICY "Users can view own reminder history"
  ON reminder_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder history"
  ON reminder_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reminder Queue Policies
CREATE POLICY "Users can view own reminder queue"
  ON reminder_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminder queue"
  ON reminder_queue FOR ALL
  USING (auth.uid() = user_id);

-- Service role bypass for edge functions
CREATE POLICY "Service role full access to reminder_settings"
  ON reminder_settings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to customer_reminder_settings"
  ON customer_reminder_settings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to reminder_history"
  ON reminder_history FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to reminder_queue"
  ON reminder_queue FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to get reminder count for an invoice
CREATE OR REPLACE FUNCTION get_invoice_reminder_count(p_invoice_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM reminder_history
    WHERE invoice_id = p_invoice_id
    AND status IN ('sent', 'delivered', 'read')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get last reminder date for a customer
CREATE OR REPLACE FUNCTION get_last_reminder_date(p_customer_id UUID)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN (
    SELECT MAX(sent_at)
    FROM reminder_history
    WHERE customer_id = p_customer_id
    AND status IN ('sent', 'delivered', 'read')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reminder_settings_updated_at
  BEFORE UPDATE ON reminder_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_reminder_settings_updated_at
  BEFORE UPDATE ON customer_reminder_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_queue_updated_at
  BEFORE UPDATE ON reminder_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. DEFAULT REMINDER SETTINGS FOR EXISTING USERS
-- ============================================
-- This inserts default settings for all existing users who don't have settings yet
INSERT INTO reminder_settings (user_id)
SELECT DISTINCT user_id FROM customers
WHERE user_id NOT IN (SELECT user_id FROM reminder_settings)
ON CONFLICT (user_id) DO NOTHING;
