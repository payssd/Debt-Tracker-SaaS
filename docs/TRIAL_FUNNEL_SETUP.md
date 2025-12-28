# Trial Funnel Setup Guide

## Overview

The Trial Funnel is a 14-day automated messaging system designed to convert free trial users into paying customers.

### Funnel Phases

| Phase | Days | Purpose |
|-------|------|---------|
| **Trial** | 0-6 | Full access, build engagement |
| **Conversion** | 7 | Trial ended, upgrade prompt |
| **Recovery** | 8-14 | Win-back churned users |

### Message Schedule

| Day | Phase | Channels | Purpose |
|-----|-------|----------|---------|
| 0 | Trial | WhatsApp, Email, SMS | Welcome + Trial Start |
| 1 | Trial | WhatsApp, Email, SMS | Onboarding |
| 2 | Trial | WhatsApp, Email | Pain Awareness |
| 3 | Trial | WhatsApp, Email | Engagement |
| 4 | Trial | WhatsApp, Email | Mid-Trial Reminder |
| 5 | Trial | WhatsApp, Email, SMS | Social Proof |
| 6 | Trial | WhatsApp, Email, SMS | Trial Ending Tomorrow |
| 7 | Conversion | WhatsApp, Email, SMS | Trial Ended → Upgrade |
| 8 | Recovery | WhatsApp, Email, SMS | Gentle Reminder |
| 10 | Recovery | WhatsApp, Email | Social Proof |
| 12 | Recovery | WhatsApp, Email, SMS | Urgency |
| 14 | Recovery | WhatsApp, Email, SMS | Final Offer |

---

## Setup Instructions

### Step 1: Run SQL Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `supabase/migrations/20241228_trial_funnel.sql`
3. Click **Run** to execute

This creates:
- `trial_funnel_templates` - Message templates for each day
- `user_funnel_status` - Tracks which messages each user received
- `funnel_analytics` - Analytics and metrics

### Step 2: Deploy Edge Function

```bash
cd /c/Users/pc/Desktop/Debt-Tracker-main/Debt-Tracker-main
supabase functions deploy process-trial-funnel
```

### Step 3: Set Environment Variables

In Supabase Dashboard → **Edge Functions** → **process-trial-funnel** → **Secrets**:

```
APP_URL=https://debttracker-three.vercel.app
WHATSAPP_API_KEY=your_whatsapp_business_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
TWILIO_API_KEY=ACCOUNT_SID:AUTH_TOKEN
TWILIO_FROM_NUMBER=+1234567890
```

### Step 4: Set Up Cron Job

The funnel should run daily. Use one of these options:

#### Option A: Supabase pg_cron (Pro plan)

```sql
SELECT cron.schedule(
  'process-trial-funnel-daily',
  '0 9 * * *',  -- Run at 9 AM daily
  $$
  SELECT net.http_post(
    url := 'https://ldwrsrrhfanhvvjmtrjn.supabase.co/functions/v1/process-trial-funnel',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### Option B: External Cron (Free)

Use [cron-job.org](https://cron-job.org):
- **URL**: `https://ldwrsrrhfanhvvjmtrjn.supabase.co/functions/v1/process-trial-funnel`
- **Method**: POST
- **Schedule**: Daily at 9:00 AM

---

## Customizing Templates

### Via Admin UI

1. Go to **Trial Funnel** page in the app
2. Click **Edit** on any template
3. Modify WhatsApp, Email, or SMS content
4. Click **Save Changes**

### Template Variables

Use these placeholders in your templates:

| Variable | Description |
|----------|-------------|
| `{{name}}` | User's name |
| `{{email}}` | User's email |
| `{{app_url}}` | App URL |
| `{{subscribe_url}}` | Subscription page URL |
| `{{guide_url}}` | Getting started guide URL |
| `{{customer_count}}` | Number of customers |
| `{{invoice_count}}` | Number of invoices |
| `{{outstanding_total}}` | Total outstanding amount |

### Enable/Disable Days

Toggle the switch on any day to enable/disable that message.

---

## Monitoring & Analytics

### Funnel Metrics

The Funnel page shows:
- **Total Users** - All users in the system
- **In Trial** - Users on Day 0-6
- **Converted** - Users with active subscriptions
- **Churned** - Users past Day 14 without subscription

### User History

Each user can see their funnel history showing which messages they received.

### Manual Trigger

Click **Run Funnel Now** to manually process the funnel (useful for testing).

---

## Best Practices

1. **Timing**: Run the funnel at 9 AM local time when users are most likely to engage
2. **Personalization**: Use template variables to personalize messages
3. **A/B Testing**: Create variations and track conversion rates
4. **Urgency**: Increase urgency in recovery phase messages
5. **Value**: Focus on value delivered, not just features
6. **Social Proof**: Include testimonials and success stories

---

## Troubleshooting

### Messages not sending

1. Check API keys are set correctly in Supabase secrets
2. Verify user has phone number (for WhatsApp/SMS)
3. Check `user_funnel_status` table for error messages
4. Review Edge Function logs in Supabase Dashboard

### User not receiving Day X message

1. Check if user already received that day's message
2. Verify user's trial_start date is correct
3. Ensure template is active (is_active = true)
4. Check if user has already converted

### Cron not running

1. Verify cron job is set up correctly
2. Check Supabase Edge Function logs
3. Try manual trigger to test function
