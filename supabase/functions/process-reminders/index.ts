// Process Scheduled Reminders - Supabase Edge Function
// This function should be triggered by a cron job (e.g., every hour)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  amount: number;
  due_date: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string | null;
}

interface ReminderSettings {
  user_id: string;
  auto_reminders_enabled: boolean;
  days_before_due: number;
  days_after_overdue: number;
  repeat_interval_days: number;
  max_reminders_per_invoice: number;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_api_key: string | null;
  whatsapp_phone_number_id: string | null;
  email_api_key: string | null;
  email_from_address: string | null;
  sms_api_key: string | null;
  sms_from_number: string | null;
  pre_due_template: string;
  overdue_template: string;
}

interface CustomerReminderSettings {
  customer_id: string;
  auto_reminders_enabled: boolean;
  preferred_channel: string;
  whatsapp_number: string | null;
  email_address: string | null;
  sms_number: string | null;
  days_before_due: number | null;
  repeat_interval_days: number | null;
  max_reminders: number | null;
}

// Format currency for Kenya
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Calculate days difference
function daysDiff(date1: Date, date2: Date): number {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Replace template variables
function fillTemplate(
  template: string,
  customer: Customer,
  invoices: Invoice[],
  daysOverdue?: number
): string {
  const total = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const invoiceList = invoices
    .map(inv => `• ${inv.invoice_number}: ${formatCurrency(Number(inv.amount))} (Due: ${formatDate(inv.due_date)})`)
    .join('\n');

  let message = template
    .replace(/{customer_name}/g, customer.name)
    .replace(/{total_amount}/g, formatCurrency(total))
    .replace(/{invoice_list}/g, invoiceList);

  // Single invoice replacements
  if (invoices.length === 1) {
    const inv = invoices[0];
    message = message
      .replace(/{invoice_number}/g, inv.invoice_number)
      .replace(/{amount}/g, formatCurrency(Number(inv.amount)))
      .replace(/{due_date}/g, formatDate(inv.due_date));
  }

  if (daysOverdue !== undefined) {
    message = message.replace(/{days_overdue}/g, daysOverdue.toString());
  }

  return message;
}

// Send WhatsApp message via Meta Business API
async function sendWhatsApp(
  phoneNumber: string,
  message: string,
  apiKey: string,
  phoneNumberId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      return { success: false, error: data.error?.message || 'WhatsApp API error' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Send Email via Resend API
async function sendEmail(
  toEmail: string,
  subject: string,
  message: string,
  apiKey: string,
  fromAddress: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject: subject,
        text: message,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.id) {
      return { success: true, messageId: data.id };
    } else {
      return { success: false, error: data.message || 'Email API error' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Send SMS via Twilio
async function sendSMS(
  toNumber: string,
  message: string,
  accountSid: string,
  authToken: string,
  fromNumber: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const cleanTo = toNumber.replace(/[^0-9+]/g, '');
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: cleanTo,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok && data.sid) {
      return { success: true, messageId: data.sid };
    } else {
      return { success: false, error: data.message || 'SMS API error' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get all users with auto reminders enabled
    const { data: allSettings, error: settingsError } = await supabaseAdmin
      .from('reminder_settings')
      .select('*')
      .eq('auto_reminders_enabled', true);

    if (settingsError) {
      throw new Error(`Failed to fetch reminder settings: ${settingsError.message}`);
    }

    if (!allSettings || allSettings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with auto reminders enabled', results }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Process each user
    for (const settings of allSettings as ReminderSettings[]) {
      try {
        // Get customer-specific settings for this user
        const { data: customerSettings } = await supabaseAdmin
          .from('customer_reminder_settings')
          .select('*')
          .eq('user_id', settings.user_id);

        const customerSettingsMap = new Map<string, CustomerReminderSettings>();
        customerSettings?.forEach((cs: CustomerReminderSettings) => {
          customerSettingsMap.set(cs.customer_id, cs);
        });

        // Get all pending/overdue invoices for this user
        const { data: invoices, error: invoicesError } = await supabaseAdmin
          .from('invoices')
          .select('*, customers!inner(id, name, contact, address)')
          .eq('user_id', settings.user_id)
          .in('status', ['Pending', 'Overdue']);

        if (invoicesError) {
          results.errors.push(`User ${settings.user_id}: ${invoicesError.message}`);
          continue;
        }

        if (!invoices || invoices.length === 0) continue;

        // Group invoices by customer
        const invoicesByCustomer = new Map<string, { customer: Customer; invoices: Invoice[] }>();
        
        for (const inv of invoices) {
          const customerId = inv.customer_id;
          if (!invoicesByCustomer.has(customerId)) {
            invoicesByCustomer.set(customerId, {
              customer: inv.customers as Customer,
              invoices: [],
            });
          }
          invoicesByCustomer.get(customerId)!.invoices.push(inv as Invoice);
        }

        // Process each customer
        for (const [customerId, { customer, invoices: customerInvoices }] of invoicesByCustomer) {
          const custSettings = customerSettingsMap.get(customerId);
          
          // Check if reminders are disabled for this customer
          if (custSettings && !custSettings.auto_reminders_enabled) {
            results.skipped++;
            continue;
          }

          // Determine settings (customer override or global)
          const daysBefore = custSettings?.days_before_due ?? settings.days_before_due;
          const repeatInterval = custSettings?.repeat_interval_days ?? settings.repeat_interval_days;
          const maxReminders = custSettings?.max_reminders ?? settings.max_reminders_per_invoice;

          // Separate pre-due and overdue invoices
          const preDueInvoices: Invoice[] = [];
          const overdueInvoices: Invoice[] = [];

          for (const inv of customerInvoices) {
            const dueDate = new Date(inv.due_date);
            const daysUntilDue = daysDiff(dueDate, now);
            const daysOverdue = daysDiff(now, dueDate);

            // Check reminder count for this invoice
            const reminderCount = await supabaseAdmin.rpc('get_invoice_reminder_count', { p_invoice_id: inv.id });

            if (reminderCount >= maxReminders) {
              results.skipped++;
              continue;
            }

            // Pre-due reminder (X days before due date)
            if (daysUntilDue > 0 && daysUntilDue <= daysBefore && inv.status === 'Pending') {
              // Check if we already sent a pre-due reminder
              const { data: existingPreDue } = await supabaseAdmin
                .from('reminder_history')
                .select('id')
                .eq('invoice_id', inv.id)
                .eq('reminder_type', 'pre_due')
                .eq('status', 'sent')
                .maybeSingle();

              if (!existingPreDue) {
                preDueInvoices.push(inv);
              }
            }

            // Overdue reminder
            if (daysOverdue > 0 && (inv.status === 'Overdue' || daysOverdue >= settings.days_after_overdue)) {
              // Check last reminder date
              const { data: lastReminder } = await supabaseAdmin
                .from('reminder_history')
                .select('sent_at')
                .eq('invoice_id', inv.id)
                .eq('reminder_type', 'overdue')
                .order('sent_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              const shouldSend = !lastReminder || 
                daysDiff(now, new Date(lastReminder.sent_at)) >= repeatInterval;

              if (shouldSend) {
                overdueInvoices.push(inv);
              }
            }
          }

          // Send pre-due reminders (one per invoice)
          for (const inv of preDueInvoices) {
            results.processed++;
            const message = fillTemplate(settings.pre_due_template, customer, [inv]);
            const sendResult = await sendReminder(
              supabaseAdmin,
              settings,
              custSettings,
              customer,
              [inv],
              message,
              'pre_due'
            );
            if (sendResult.success) results.sent++;
            else {
              results.failed++;
              if (sendResult.error) results.errors.push(sendResult.error);
            }
          }

          // Send overdue reminders (grouped per customer)
          if (overdueInvoices.length > 0) {
            results.processed++;
            const daysOverdue = daysDiff(now, new Date(overdueInvoices[0].due_date));
            const message = fillTemplate(settings.overdue_template, customer, overdueInvoices, daysOverdue);
            const sendResult = await sendReminder(
              supabaseAdmin,
              settings,
              custSettings,
              customer,
              overdueInvoices,
              message,
              'overdue'
            );
            if (sendResult.success) results.sent++;
            else {
              results.failed++;
              if (sendResult.error) results.errors.push(sendResult.error);
            }
          }
        }
      } catch (userError: any) {
        results.errors.push(`User ${settings.user_id}: ${userError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in process-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

// Helper function to send reminder via preferred channel
async function sendReminder(
  supabase: any,
  settings: ReminderSettings,
  custSettings: CustomerReminderSettings | undefined,
  customer: Customer,
  invoices: Invoice[],
  message: string,
  reminderType: 'pre_due' | 'overdue'
): Promise<{ success: boolean; error?: string }> {
  const preferredChannel = custSettings?.preferred_channel || 'whatsapp';
  const total = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  
  let sendResult: { success: boolean; messageId?: string; error?: string } = { success: false };
  let channelUsed = preferredChannel;

  // Try preferred channel first, then fallback
  const channels = [preferredChannel, 'whatsapp', 'email', 'sms'].filter((v, i, a) => a.indexOf(v) === i);

  for (const channel of channels) {
    if (channel === 'whatsapp' && settings.whatsapp_enabled && settings.whatsapp_api_key) {
      const phone = custSettings?.whatsapp_number || customer.contact;
      sendResult = await sendWhatsApp(
        phone,
        message,
        settings.whatsapp_api_key,
        settings.whatsapp_phone_number_id || ''
      );
      channelUsed = 'whatsapp';
      if (sendResult.success) break;
    }

    if (channel === 'email' && settings.email_enabled && settings.email_api_key) {
      const email = custSettings?.email_address;
      if (email) {
        const subject = reminderType === 'pre_due' 
          ? `Payment Reminder - Invoice Due Soon`
          : `Payment Reminder - Overdue Invoice`;
        sendResult = await sendEmail(
          email,
          subject,
          message,
          settings.email_api_key,
          settings.email_from_address || 'noreply@debttracker.com'
        );
        channelUsed = 'email';
        if (sendResult.success) break;
      }
    }

    if (channel === 'sms' && settings.sms_enabled && settings.sms_api_key) {
      const phone = custSettings?.sms_number || customer.contact;
      // SMS needs account SID and auth token (stored in api_key as "sid:token")
      const [accountSid, authToken] = (settings.sms_api_key || ':').split(':');
      if (accountSid && authToken) {
        sendResult = await sendSMS(
          phone,
          message,
          accountSid,
          authToken,
          settings.sms_from_number || ''
        );
        channelUsed = 'sms';
        if (sendResult.success) break;
      }
    }
  }

  // Record in history
  const historyRecord = {
    user_id: settings.user_id,
    customer_id: customer.id,
    invoice_id: invoices.length === 1 ? invoices[0].id : null,
    reminder_type: reminderType,
    channel: channelUsed,
    status: sendResult.success ? 'sent' : 'failed',
    message_content: message,
    external_message_id: sendResult.messageId || null,
    error_message: sendResult.error || null,
    invoices_included: invoices.map(inv => inv.id),
    total_amount: total,
    sent_at: sendResult.success ? new Date().toISOString() : null,
  };

  await supabase.from('reminder_history').insert(historyRecord);

  return { success: sendResult.success, error: sendResult.error };
}
