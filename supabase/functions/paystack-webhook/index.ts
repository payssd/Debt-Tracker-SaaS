// Paystack Webhook Handler Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Create HMAC SHA512 hash using Web Crypto API
async function createHmacSha512(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData.buffer as ArrayBuffer);
  
  return [...new Uint8Array(signature)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not found");
      throw new Error("Webhook configuration error");
    }

    const signature = req.headers.get("x-paystack-signature");
    const body = await req.text();

    // Verify webhook signature
    const hash = await createHmacSha512(paystackSecretKey, body);

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      throw new Error("Invalid signature");
    }

    const event = JSON.parse(body);
    console.log("Received webhook event:", event.event);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.event) {
      case "charge.success": {
        const metadata = event.data.metadata;
        if (metadata?.user_id && metadata?.plan_id) {
          const billingInterval = metadata.billing_interval || "monthly";
          const now = new Date();
          const periodEnd = new Date(now);
          
          if (billingInterval === "monthly") {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          } else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          }

          // Ensure a subscription row exists (insert if missing, otherwise update)
          const { data: existing, error: existingErr } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", metadata.user_id)
            .maybeSingle();

          if (existingErr) {
            console.error("Webhook: failed to read existing subscription:", existingErr);
          }

          if (existing?.id) {
            const { error: updateErr } = await supabaseAdmin
              .from("user_subscriptions")
              .update({
                plan_id: metadata.plan_id,
                billing_interval: billingInterval,
                status: "active",
                paystack_customer_code: event.data.customer?.customer_code,
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq("id", existing.id);

            if (updateErr) console.error("Webhook: subscription update error:", updateErr);
          } else {
            const { error: insertErr } = await supabaseAdmin
              .from("user_subscriptions")
              .insert({
                user_id: metadata.user_id,
                plan_id: metadata.plan_id,
                billing_interval: billingInterval,
                status: "active",
                paystack_customer_code: event.data.customer?.customer_code,
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString(),
              });

            if (insertErr) console.error("Webhook: subscription insert error:", insertErr);
          }

          console.log("Subscription activated via webhook for user:", metadata.user_id);
        }
        break;
      }

      case "subscription.create": {
        console.log("Subscription created:", event.data);
        break;
      }

      case "subscription.disable": {
        const customerCode = event.data.customer?.customer_code;
        if (customerCode) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("paystack_customer_code", customerCode);

          console.log("Subscription disabled for customer:", customerCode);
        }
        break;
      }

      case "invoice.payment_failed": {
        const customerCode = event.data.customer?.customer_code;
        if (customerCode) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("paystack_customer_code", customerCode);

          console.log("Payment failed for customer:", customerCode);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in paystack-webhook:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
