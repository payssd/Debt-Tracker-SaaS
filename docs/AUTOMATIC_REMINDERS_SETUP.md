# Automatic Reminders Setup Guide

This guide explains how to set up the automatic payment reminders feature for Debt Tracker.

## Overview

The automatic reminders system sends payment reminders to customers via:
- **WhatsApp** (via Meta Business API)
- **Email** (via Resend API)
- **SMS** (via Twilio)

Reminders are sent:
- **Pre-due**: X days before invoice due date
- **Overdue**: Starting X days after due date, repeating every Y days

---

## Step 1: Run Database Migration

Run the SQL migration in your Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20241228_automatic_reminders.sql`
3. Run the migration

This creates the following tables:
- `reminder_settings` - Global user settings
- `customer_reminder_settings` - Per-customer overrides
- `reminder_history` - Log of all sent reminders
- `reminder_queue` - Scheduled reminders queue

---

## Step 2: Deploy the Edge Function

Deploy the `process-reminders` edge function:

```bash
cd /c/Users/pc/Desktop/Debt-Tracker-main/Debt-Tracker-main
supabase functions deploy process-reminders
```

---

## Step 3: Set Up Cron Job

The `process-reminders` function needs to run on a schedule (e.g., every hour or daily).

### Option A: Supabase Cron (pg_cron)

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every hour
SELECT cron.schedule(
  'process-reminders-hourly',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://ldwrsrrhfanhvvjmtrjn.supabase.co/functions/v1/process-reminders',
    headers := '{"Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Option B: External Cron Service

Use services like:
- **cron-job.org** (free)
- **EasyCron**
- **GitHub Actions** (scheduled workflow)

Set up a POST request to:
```
https://ldwrsrrhfanhvvjmtrjn.supabase.co/functions/v1/process-reminders
```

---

## Step 4: Configure Messaging APIs

### WhatsApp Business API

1. Create a Meta Business account at [business.facebook.com](https://business.facebook.com)
2. Set up WhatsApp Business API in Meta Developer Console
3. Get your:
   - **Access Token** (permanent token recommended)
   - **Phone Number ID**
4. Enter these in Debt Tracker → Reminders → Settings → WhatsApp

**Note**: WhatsApp Business API requires business verification and has messaging limits.

### Email (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Enter in Debt Tracker → Reminders → Settings → Email:
   - **API Key**: Your Resend API key
   - **From Address**: `noreply@yourdomain.com`

### SMS (Twilio)

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number
3. Find your Account SID and Auth Token
4. Enter in Debt Tracker → Reminders → Settings → SMS:
   - **Account SID:Auth Token**: `ACXXXXXXX:your_auth_token`
   - **From Number**: `+1234567890`

---

## Step 5: Configure Reminder Settings

In the app, go to **Reminders → Settings** to configure:

### Timing
- **Days before due**: Send pre-due reminder X days before (default: 3)
- **Days after overdue**: Send first overdue reminder after X days (default: 1)
- **Repeat interval**: Repeat overdue reminders every X days (default: 7)
- **Max reminders**: Stop after X reminders per invoice (default: 5)

### Channels
Enable/disable each channel and enter API credentials.

---

## How It Works

1. **Cron job** triggers `process-reminders` function (hourly/daily)
2. Function checks all users with `auto_reminders_enabled = true`
3. For each user, finds invoices that need reminders:
   - Pending invoices within X days of due date → Pre-due reminder
   - Overdue invoices → Overdue reminder (respecting repeat interval)
4. Sends reminders via enabled channels (WhatsApp → Email → SMS fallback)
5. Records all attempts in `reminder_history` table

---

## Troubleshooting

### Reminders not sending?

1. Check `reminder_settings` table - is `auto_reminders_enabled` true?
2. Check if API keys are configured correctly
3. Check `reminder_history` for failed attempts and error messages
4. Verify the cron job is running (check Supabase logs)

### WhatsApp messages failing?

- Ensure phone numbers include country code (e.g., `254712345678`)
- Check WhatsApp Business API limits
- Verify your access token hasn't expired

### Emails going to spam?

- Set up SPF, DKIM, and DMARC records for your domain
- Use a professional from address
- Avoid spam trigger words in templates

---

## Security Notes

- API keys are stored in the database (consider using Supabase Vault for production)
- The Edge Function uses service role key for database access
- RLS policies ensure users can only see their own data

---

## Cost Considerations

- **WhatsApp Business API**: ~$0.005-0.08 per message (varies by country)
- **Resend**: Free tier: 100 emails/day, then $20/month for 50k
- **Twilio SMS**: ~$0.0075 per SMS (varies by country)

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20241228_automatic_reminders.sql` | Database schema |
| `supabase/functions/process-reminders/index.ts` | Edge function for processing |
| `src/hooks/useReminders.ts` | React hooks for reminder data |
| `src/pages/Reminders.tsx` | Updated UI with settings & history |
