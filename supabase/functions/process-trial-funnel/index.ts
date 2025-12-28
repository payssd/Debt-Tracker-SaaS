import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FunnelTemplate {
  id: string;
  day_number: number;
  phase: string;
  purpose: string;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_template: string | null;
  email_subject: string | null;
  email_template: string | null;
  sms_template: string | null;
}

interface UserForFunnel {
  user_id: string;
  email: string;
  name: string;
  phone: string | null;
  trial_start: string;
  customer_count: number;
  invoice_count: number;
  outstanding_total: number;
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

    const appUrl = Deno.env.get("APP_URL") || "https://debttracker-three.vercel.app";
    const subscribeUrl = `${appUrl}/subscription`;
    const guideUrl = `${appUrl}/docs/getting-started`;

    // Get all funnel days that need processing (0-14)
    const funnelDays = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14];
    
    const results = {
      processed: 0,
      whatsapp_sent: 0,
      email_sent: 0,
      sms_sent: 0,
      errors: [] as string[],
    };

    for (const dayNumber of funnelDays) {
      // Get template for this day
      const { data: template, error: templateError } = await supabaseAdmin
        .from("trial_funnel_templates")
        .select("*")
        .eq("day_number", dayNumber)
        .eq("is_active", true)
        .single();

      if (templateError || !template) {
        continue;
      }

      // Get users who need this day's message
      const { data: users, error: usersError } = await supabaseAdmin
        .rpc("get_users_for_funnel_day", { p_day_number: dayNumber });

      if (usersError || !users || users.length === 0) {
        continue;
      }

      // Process each user
      for (const user of users as UserForFunnel[]) {
        try {
          const messagesSent = await processUserFunnelMessage(
            supabaseAdmin,
            user,
            template as FunnelTemplate,
            appUrl,
            subscribeUrl,
            guideUrl
          );

          results.processed++;
          results.whatsapp_sent += messagesSent.whatsapp ? 1 : 0;
          results.email_sent += messagesSent.email ? 1 : 0;
          results.sms_sent += messagesSent.sms ? 1 : 0;

        } catch (error: any) {
          results.errors.push(`User ${user.user_id}: ${error.message}`);
        }
      }
    }

    // Log analytics summary
    await supabaseAdmin.from("funnel_analytics").insert({
      user_id: "00000000-0000-0000-0000-000000000000", // System user
      event_type: "funnel_batch_processed",
      metadata: results,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Trial funnel processed",
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error processing trial funnel:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

async function processUserFunnelMessage(
  supabase: any,
  user: UserForFunnel,
  template: FunnelTemplate,
  appUrl: string,
  subscribeUrl: string,
  guideUrl: string
): Promise<{ whatsapp: boolean; email: boolean; sms: boolean }> {
  
  const result = { whatsapp: false, email: false, sms: false };

  // Get user's reminder settings for API keys
  const { data: settings } = await supabase
    .from("reminder_settings")
    .select("*")
    .eq("user_id", user.user_id)
    .single();

  // Prepare template variables
  const variables: Record<string, string> = {
    name: user.name,
    email: user.email,
    app_url: appUrl,
    subscribe_url: subscribeUrl,
    guide_url: guideUrl,
    customer_count: user.customer_count.toString(),
    invoice_count: user.invoice_count.toString(),
    outstanding_total: formatCurrency(user.outstanding_total),
    overdue_count: "0", // Would need to calculate
  };

  // Send WhatsApp
  if (template.whatsapp_enabled && template.whatsapp_template && user.phone) {
    try {
      const message = replaceVariables(template.whatsapp_template, variables);
      // Use global WhatsApp API settings or user's settings
      const whatsappApiKey = Deno.env.get("WHATSAPP_API_KEY") || settings?.whatsapp_api_key;
      const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || settings?.whatsapp_phone_number_id;
      
      if (whatsappApiKey && whatsappPhoneId) {
        await sendWhatsAppMessage(whatsappApiKey, whatsappPhoneId, user.phone, message);
        result.whatsapp = true;
      }
    } catch (error: any) {
      console.error(`WhatsApp error for ${user.user_id}:`, error.message);
    }
  }

  // Send Email
  if (template.email_enabled && template.email_template && template.email_subject) {
    try {
      const subject = replaceVariables(template.email_subject, variables);
      const body = replaceVariables(template.email_template, variables);
      const emailApiKey = Deno.env.get("RESEND_API_KEY") || settings?.email_api_key;
      const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS") || settings?.email_from_address || "noreply@debttracker.app";
      
      if (emailApiKey) {
        await sendEmail(emailApiKey, fromAddress, user.email, subject, body);
        result.email = true;
      }
    } catch (error: any) {
      console.error(`Email error for ${user.user_id}:`, error.message);
    }
  }

  // Send SMS
  if (template.sms_enabled && template.sms_template && user.phone) {
    try {
      const message = replaceVariables(template.sms_template, variables);
      const smsApiKey = Deno.env.get("TWILIO_API_KEY") || settings?.sms_api_key;
      const smsFromNumber = Deno.env.get("TWILIO_FROM_NUMBER") || settings?.sms_from_number;
      
      if (smsApiKey && smsFromNumber) {
        await sendSMS(smsApiKey, smsFromNumber, user.phone, message);
        result.sms = true;
      }
    } catch (error: any) {
      console.error(`SMS error for ${user.user_id}:`, error.message);
    }
  }

  // Record funnel status
  await supabase.from("user_funnel_status").upsert({
    user_id: user.user_id,
    day_number: template.day_number,
    phase: template.phase,
    whatsapp_sent: result.whatsapp,
    whatsapp_sent_at: result.whatsapp ? new Date().toISOString() : null,
    email_sent: result.email,
    email_sent_at: result.email ? new Date().toISOString() : null,
    sms_sent: result.sms,
    sms_sent_at: result.sms ? new Date().toISOString() : null,
    whatsapp_status: result.whatsapp ? "sent" : "skipped",
    email_status: result.email ? "sent" : "skipped",
    sms_status: result.sms ? "sent" : "skipped",
  }, {
    onConflict: "user_id,day_number",
  });

  return result;
}

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

async function sendWhatsAppMessage(
  apiKey: string,
  phoneNumberId: string,
  to: string,
  message: string
): Promise<void> {
  const cleanPhone = to.replace(/\D/g, "");
  
  const response = await fetch(
    `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: message },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${error}`);
  }
}

async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: htmlBody.replace(/\n/g, "<br>"),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email API error: ${error}`);
  }
}

async function sendSMS(
  apiKey: string,
  from: string,
  to: string,
  message: string
): Promise<void> {
  const [accountSid, authToken] = apiKey.split(":");
  const cleanPhone = to.replace(/\D/g, "");
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: `+${cleanPhone}`,
        Body: message,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SMS API error: ${error}`);
  }
}
