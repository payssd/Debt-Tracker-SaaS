-- =====================================================
-- TRIAL FUNNEL SYSTEM
-- 7-Day Free Trial + 7-Day Follow-Up Conversion Funnel
-- =====================================================

-- Table to store funnel message templates
CREATE TABLE IF NOT EXISTS trial_funnel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL, -- 0-14
  phase TEXT NOT NULL CHECK (phase IN ('trial', 'conversion', 'recovery')),
  purpose TEXT NOT NULL,
  whatsapp_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  whatsapp_template TEXT,
  email_subject TEXT,
  email_template TEXT,
  sms_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track which funnel messages have been sent to each user
CREATE TABLE IF NOT EXISTS user_funnel_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  phase TEXT NOT NULL,
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  whatsapp_status TEXT DEFAULT 'pending',
  email_status TEXT DEFAULT 'pending',
  sms_status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

-- Table to store funnel analytics/metrics
CREATE TABLE IF NOT EXISTS funnel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'trial_started', 'message_sent', 'message_opened', 'link_clicked', 'converted', 'churned'
  day_number INTEGER,
  channel TEXT, -- 'whatsapp', 'email', 'sms'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_funnel_status_user_id ON user_funnel_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_funnel_status_day ON user_funnel_status(day_number);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_user_id ON funnel_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_event ON funnel_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_trial_funnel_templates_day ON trial_funnel_templates(day_number);

-- Enable RLS
ALTER TABLE trial_funnel_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_funnel_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trial_funnel_templates (read-only for authenticated users)
CREATE POLICY "Users can view funnel templates"
  ON trial_funnel_templates FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_funnel_status
CREATE POLICY "Users can view own funnel status"
  ON user_funnel_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage funnel status"
  ON user_funnel_status FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for funnel_analytics
CREATE POLICY "Users can view own analytics"
  ON funnel_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage analytics"
  ON funnel_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- INSERT DEFAULT FUNNEL TEMPLATES
-- =====================================================

-- Phase 1: Free Trial (Day 0-6)
INSERT INTO trial_funnel_templates (day_number, phase, purpose, whatsapp_template, email_subject, email_template, sms_template) VALUES

-- Day 0: Welcome + Trial Start
(0, 'trial', 'Welcome + Trial Start',
'🎉 Welcome to Debt Tracker, {{name}}!

Your 7-day FREE trial has started. Here''s what you can do:

✅ Track all customer debts
✅ Generate PDF statements
✅ Send WhatsApp reminders
✅ View analytics & reports

👉 Start now: {{app_url}}

Questions? Reply to this message!',

'Welcome to Debt Tracker - Your 7-Day Free Trial Starts Now! 🎉',

'Hi {{name}},

Welcome to Debt Tracker! Your 7-day free trial is now active.

During your trial, you have FULL ACCESS to:
• Track unlimited customer debts
• Generate professional PDF statements
• Send automated WhatsApp reminders
• View detailed analytics and reports

Get started now: {{app_url}}

If you have any questions, just reply to this email.

Best regards,
The Debt Tracker Team',

'Welcome to Debt Tracker {{name}}! Your 7-day FREE trial is active. Start tracking debts now: {{app_url}}'),

-- Day 1: Onboarding
(1, 'trial', 'Onboarding',
'Hi {{name}} 👋

Day 1 of your trial! Have you added your first customer yet?

Quick start:
1️⃣ Add a customer
2️⃣ Create an invoice
3️⃣ Send a reminder

Need help? Check our guide: {{guide_url}}

💡 Tip: Most users add 5+ customers on day 1!',

'Day 1: Let''s Get You Set Up! 🚀',

'Hi {{name}},

It''s Day 1 of your Debt Tracker trial!

Here''s your quick-start checklist:
☐ Add your first customer
☐ Create your first invoice
☐ Send your first reminder

Most successful users complete these steps on Day 1 and see immediate results.

Need help? Check our quick-start guide: {{guide_url}}

Happy tracking!
The Debt Tracker Team',

'Day 1 {{name}}! Add your first customer & invoice today. Most users track 5+ debts on day 1! {{app_url}}'),

-- Day 2: Pain Awareness
(2, 'trial', 'Pain Awareness',
'{{name}}, quick question 🤔

How much time do you spend chasing payments each week?

Our users save 5+ hours/week by:
• Auto-tracking due dates
• One-click reminders
• Professional statements

Don''t let unpaid invoices pile up!

👉 {{app_url}}',

'Are Unpaid Invoices Costing You Time & Money?',

'Hi {{name}},

Quick question: How much time do you spend each week chasing unpaid invoices?

The average small business owner spends 5+ hours per week on debt collection. That''s time you could spend growing your business.

With Debt Tracker, you can:
• See all outstanding debts at a glance
• Send reminders in seconds
• Generate professional statements automatically

Don''t let unpaid invoices drain your time and cash flow.

Take control today: {{app_url}}

The Debt Tracker Team',

NULL), -- No SMS on Day 2

-- Day 3: Engagement
(3, 'trial', 'Engagement (dashboard usage)',
'{{name}}, have you checked your dashboard today? 📊

Your dashboard shows:
• Total outstanding: {{outstanding_total}}
• Overdue invoices: {{overdue_count}}
• Customers tracked: {{customer_count}}

Stay on top of your cash flow!

👉 {{app_url}}',

'Your Debt Tracker Dashboard Awaits 📊',

'Hi {{name}},

Have you explored your Debt Tracker dashboard yet?

Your current stats:
• Total Outstanding: {{outstanding_total}}
• Overdue Invoices: {{overdue_count}}
• Customers Tracked: {{customer_count}}

The dashboard gives you a complete picture of your business''s cash flow health. Check it daily to stay on top of collections.

View your dashboard: {{app_url}}

The Debt Tracker Team',

NULL), -- No SMS on Day 3

-- Day 4: Mid-Trial Reminder
(4, 'trial', 'Mid-Trial Reminder',
'{{name}}, you''re halfway through your trial! ⏰

3 days left to explore:
✅ Bulk invoice management
✅ Customer payment history
✅ Automated reminders

Have questions? Reply here!

👉 {{app_url}}',

'Halfway There! 3 Days Left in Your Trial ⏰',

'Hi {{name}},

You''re halfway through your 7-day trial!

Here are some features you might not have tried yet:
• Bulk invoice management - handle multiple invoices at once
• Customer payment history - see who pays on time
• Automated reminders - set it and forget it

Only 3 days left to explore everything Debt Tracker has to offer.

Continue exploring: {{app_url}}

Questions? Just reply to this email.

The Debt Tracker Team',

NULL), -- No SMS on Day 4

-- Day 5: Social Proof
(5, 'trial', 'Social Proof',
'{{name}}, here''s what other businesses are saying 💬

"Debt Tracker helped me collect ₦2.5M in overdue payments in just 2 weeks!" - Chidi, Lagos

"I used to spend hours tracking debts. Now it takes minutes." - Amaka, Abuja

Join 500+ businesses using Debt Tracker!

👉 {{app_url}}',

'See Why 500+ Businesses Trust Debt Tracker',

'Hi {{name}},

Don''t just take our word for it. Here''s what other business owners are saying:

⭐⭐⭐⭐⭐
"Debt Tracker helped me collect ₦2.5M in overdue payments in just 2 weeks!"
- Chidi O., Wholesale Distributor, Lagos

⭐⭐⭐⭐⭐
"I used to spend hours tracking debts in spreadsheets. Now it takes minutes."
- Amaka N., Supplier, Abuja

⭐⭐⭐⭐⭐
"The WhatsApp reminders are a game-changer. My customers pay faster now."
- Emeka K., Retailer, Port Harcourt

Join 500+ businesses already using Debt Tracker to improve their cash flow.

Start collecting: {{app_url}}

The Debt Tracker Team',

'{{name}}, 500+ businesses trust Debt Tracker! "Collected ₦2.5M in 2 weeks" - See why: {{app_url}}'),

-- Day 6: Trial Ending Tomorrow
(6, 'trial', 'Trial Ending Tomorrow',
'⚠️ {{name}}, your trial ends TOMORROW!

Don''t lose access to:
❌ Your customer data
❌ Invoice tracking
❌ Payment reminders

Subscribe now to keep your account active:
👉 {{subscribe_url}}

Questions? Reply here!',

'⚠️ Your Trial Ends Tomorrow - Don''t Lose Access!',

'Hi {{name}},

Your 7-day free trial ends TOMORROW.

After tomorrow, you''ll lose access to:
• All your customer data
• Invoice tracking and management
• Payment reminders and statements
• Dashboard and analytics

Don''t let your hard work go to waste!

Subscribe now to keep your account active: {{subscribe_url}}

Plans start at just ₦2,500/month - less than the cost of one unpaid invoice.

Questions? Reply to this email and we''ll help you out.

The Debt Tracker Team',

'⚠️ {{name}}, trial ends TOMORROW! Subscribe now to keep access: {{subscribe_url}}'),

-- Phase 2: Trial End + Conversion (Day 7)
(7, 'conversion', 'Trial Ended → Upgrade Prompt',
'{{name}}, your free trial has ended 😢

But don''t worry! Your data is safe for 7 more days.

Subscribe now to:
✅ Restore full access
✅ Keep all your data
✅ Continue tracking debts

🎁 Special offer: Use code WELCOME20 for 20% off!

👉 {{subscribe_url}}',

'Your Trial Has Ended - But Your Data is Safe! 🔒',

'Hi {{name}},

Your 7-day free trial has ended.

But here''s the good news: Your data is safe and waiting for you. We''ll keep it for 7 more days.

Subscribe now to:
✅ Restore full access immediately
✅ Keep all your customer data
✅ Continue tracking and collecting debts

🎁 SPECIAL OFFER: Use code WELCOME20 at checkout for 20% off your first month!

Subscribe now: {{subscribe_url}}

Don''t let unpaid invoices pile up while you''re away.

The Debt Tracker Team',

'{{name}}, trial ended but data is safe! Use code WELCOME20 for 20% off: {{subscribe_url}}'),

-- Phase 3: Post-Trial Recovery (Day 8-14)
-- Day 8: Gentle Reminder
(8, 'recovery', 'Gentle Reminder',
'Hi {{name}} 👋

We noticed you haven''t subscribed yet.

Your data is still safe, but you only have 6 days left before it''s deleted.

Need help deciding? Reply with your questions!

👉 {{subscribe_url}}',

'We Miss You! Your Data is Waiting 💙',

'Hi {{name}},

We noticed you haven''t subscribed to Debt Tracker yet.

Your customer data and invoices are still safe in your account, but they''ll be deleted in 6 days.

Is something holding you back? Common concerns:

❓ "Is it worth the cost?"
→ Most users collect more in the first week than a year''s subscription costs.

❓ "I''m not sure how to use it"
→ Reply to this email and we''ll give you a free walkthrough.

❓ "I need to think about it"
→ Your data won''t wait forever. Subscribe now and cancel anytime.

Restore your access: {{subscribe_url}}

The Debt Tracker Team',

'Hi {{name}}, your Debt Tracker data is waiting! 6 days left before deletion. {{subscribe_url}}'),

-- Day 10: Social Proof
(10, 'recovery', 'Social Proof',
'{{name}}, while you''ve been away...

📈 Our users collected ₦50M+ in outstanding debts this month!

You could be collecting too.

Your data is still waiting. 4 days left.

👉 {{subscribe_url}}',

'While You Were Away: ₦50M+ Collected This Month 📈',

'Hi {{name}},

While you''ve been thinking about it, Debt Tracker users have been busy:

📈 ₦50M+ collected in outstanding debts this month
📊 10,000+ reminders sent
💰 Average user collects 3x their subscription cost

Your competitors might already be using Debt Tracker. Don''t fall behind.

Your data is still safe, but only for 4 more days.

Get back in the game: {{subscribe_url}}

The Debt Tracker Team',

NULL), -- No SMS on Day 10

-- Day 12: Urgency
(12, 'recovery', 'Urgency',
'⚠️ {{name}}, URGENT!

Your account data will be DELETED in 2 days.

This includes:
❌ {{customer_count}} customers
❌ {{invoice_count}} invoices
❌ All payment history

Don''t start from scratch!

👉 {{subscribe_url}}',

'⚠️ URGENT: Your Data Will Be Deleted in 2 Days',

'Hi {{name}},

This is an urgent reminder.

Your Debt Tracker account data will be PERMANENTLY DELETED in 2 days.

You will lose:
❌ {{customer_count}} customer records
❌ {{invoice_count}} invoice records
❌ All payment history and analytics

Once deleted, this data CANNOT be recovered.

Don''t start from scratch. Subscribe now and keep everything: {{subscribe_url}}

The Debt Tracker Team',

'⚠️ URGENT {{name}}! Data deleted in 2 days. {{customer_count}} customers at risk. Save now: {{subscribe_url}}'),

-- Day 14: Final Offer / Scarcity
(14, 'recovery', 'Final Offer / Scarcity',
'{{name}}, FINAL NOTICE 🚨

Your data will be deleted TODAY at midnight.

🎁 LAST CHANCE: 30% off with code LASTCHANCE30

After today, you''ll need to start over.

👉 {{subscribe_url}}',

'🚨 FINAL NOTICE: Data Deletion Today + 30% Off Last Chance',

'Hi {{name}},

This is your FINAL notice.

Your Debt Tracker account and all associated data will be permanently deleted TODAY at midnight.

We don''t want to see you lose everything you''ve built.

🎁 LAST CHANCE OFFER: Use code LASTCHANCE30 for 30% off your first 3 months.

This is our best offer, and it expires when your data does - tonight at midnight.

Save your data now: {{subscribe_url}}

After today, you''ll need to start completely from scratch.

We hope to see you back.

The Debt Tracker Team',

'🚨 FINAL {{name}}! Data deleted TONIGHT. 30% off code: LASTCHANCE30 {{subscribe_url}}');

-- Function to get user's trial day
CREATE OR REPLACE FUNCTION get_user_trial_day(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_trial_start TIMESTAMPTZ;
  v_days INTEGER;
BEGIN
  SELECT trial_start INTO v_trial_start
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  IF v_trial_start IS NULL THEN
    RETURN -1;
  END IF;
  
  v_days := EXTRACT(DAY FROM (NOW() - v_trial_start))::INTEGER;
  RETURN v_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user should receive funnel message today
CREATE OR REPLACE FUNCTION should_send_funnel_message(p_user_id UUID, p_day_number INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_already_sent BOOLEAN;
  v_user_converted BOOLEAN;
BEGIN
  -- Check if already sent
  SELECT EXISTS(
    SELECT 1 FROM user_funnel_status
    WHERE user_id = p_user_id AND day_number = p_day_number
    AND (whatsapp_sent OR email_sent OR sms_sent)
  ) INTO v_already_sent;
  
  IF v_already_sent THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has converted (has active subscription)
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id AND status = 'active'
  ) INTO v_user_converted;
  
  IF v_user_converted THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users needing funnel messages today
CREATE OR REPLACE FUNCTION get_users_for_funnel_day(p_day_number INTEGER)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  phone TEXT,
  trial_start TIMESTAMPTZ,
  customer_count BIGINT,
  invoice_count BIGINT,
  outstanding_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    au.email,
    COALESCE(p.name, split_part(au.email, '@', 1)) as name,
    p.phone,
    us.trial_start,
    (SELECT COUNT(*) FROM customers c WHERE c.user_id = us.user_id) as customer_count,
    (SELECT COUNT(*) FROM invoices i WHERE i.user_id = us.user_id) as invoice_count,
    COALESCE((SELECT SUM(c.outstanding_total) FROM customers c WHERE c.user_id = us.user_id), 0) as outstanding_total
  FROM user_subscriptions us
  JOIN auth.users au ON au.id = us.user_id
  LEFT JOIN profiles p ON p.id = us.user_id
  WHERE 
    us.trial_start IS NOT NULL
    AND EXTRACT(DAY FROM (NOW() - us.trial_start))::INTEGER = p_day_number
    AND us.status IN ('trialing', 'expired')
    AND should_send_funnel_message(us.user_id, p_day_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log funnel analytics
CREATE OR REPLACE FUNCTION log_funnel_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.whatsapp_sent AND (OLD IS NULL OR NOT OLD.whatsapp_sent) THEN
      INSERT INTO funnel_analytics (user_id, event_type, day_number, channel)
      VALUES (NEW.user_id, 'message_sent', NEW.day_number, 'whatsapp');
    END IF;
    IF NEW.email_sent AND (OLD IS NULL OR NOT OLD.email_sent) THEN
      INSERT INTO funnel_analytics (user_id, event_type, day_number, channel)
      VALUES (NEW.user_id, 'message_sent', NEW.day_number, 'email');
    END IF;
    IF NEW.sms_sent AND (OLD IS NULL OR NOT OLD.sms_sent) THEN
      INSERT INTO funnel_analytics (user_id, event_type, day_number, channel)
      VALUES (NEW.user_id, 'message_sent', NEW.day_number, 'sms');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_funnel_event
  AFTER INSERT OR UPDATE ON user_funnel_status
  FOR EACH ROW
  EXECUTE FUNCTION log_funnel_event();

-- Add updated_at trigger
CREATE TRIGGER update_trial_funnel_templates_updated_at
  BEFORE UPDATE ON trial_funnel_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_funnel_status_updated_at
  BEFORE UPDATE ON user_funnel_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
