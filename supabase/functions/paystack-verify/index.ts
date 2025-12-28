// Paystack Verify Payment Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FUNCTION_VERSION = "paystack-verify@2025-12-27-1";


serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not found");
      throw new Error("Payment configuration error");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("Not authenticated");
    }

    const { reference } = await req.json();
    console.log("Verifying payment for user:", user.id, "reference:", reference);

    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
      },
    });

    const verifyData = await verifyResponse.json();
    console.log("Paystack verify response:", verifyData);

    if (!verifyData.status || verifyData.data.status !== "success") {
      throw new Error("Payment verification failed");
    }

    const metadata = verifyData.data.metadata;
    const planId = metadata.plan_id;
    const billingInterval = metadata.billing_interval;
    const planCode = metadata.plan_code;

    if (!planId || !billingInterval) {
      console.error("Missing required metadata:", { planId, billingInterval, metadata });
      throw new Error("Payment metadata missing (plan or billing interval)");
    }

    // Validate plan + amount (Paystack verification is the source of truth)
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("id, price_monthly, price_yearly, paystack_plan_code_monthly, paystack_plan_code_yearly")
      .eq("id", planId)
      .maybeSingle();

    if (planError || !plan) {
      console.error("Plan validation error:", planError);
      throw new Error("Invalid plan");
    }

    const expectedAmount = billingInterval === "monthly" ? plan.price_monthly : plan.price_yearly;
    if (typeof expectedAmount === "number" && verifyData.data.amount !== expectedAmount) {
      console.error("Amount mismatch:", { paid: verifyData.data.amount, expected: expectedAmount });
      throw new Error("Payment amount mismatch");
    }

    const expectedPlanCode = billingInterval === "monthly" ? plan.paystack_plan_code_monthly : plan.paystack_plan_code_yearly;
    if (planCode && expectedPlanCode && planCode !== expectedPlanCode) {
      console.error("Plan code mismatch:", { planCode, expectedPlanCode });
      throw new Error("Plan code mismatch");
    }
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingInterval === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Use service role client for database writes to bypass RLS
    // This is secure because we've already verified the user's identity via auth header
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseDb = serviceRoleKey
      ? createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          serviceRoleKey
        )
      : supabaseClient; // Fallback to user client if service role not available

    const { data: existingSub, error: existingSubError } = await supabaseDb
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingSubError) {
      console.error("Error checking existing subscription:", existingSubError);
      return new Response(
        JSON.stringify({
          success: false,
          version: FUNCTION_VERSION,
          error: "Failed to read existing subscription",
          details: {
            message: (existingSubError as any)?.message,
            code: (existingSubError as any)?.code,
            details: (existingSubError as any)?.details,
            hint: (existingSubError as any)?.hint,
          },
        }),
        // Return 200 so the client can read the details (supabase-js hides bodies for non-2xx)
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Base payload for updates (without created_at which is auto-set)
    const updatePayload = {
      plan_id: planId,
      billing_interval: billingInterval,
      status: "active",
      paystack_customer_code: verifyData.data.customer?.customer_code ?? null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    };

    // For inserts, include user_id
    const insertPayload = {
      ...updatePayload,
      user_id: user.id,
    };

    let subscription: any = null;

    if (existingSub?.id) {
      const { data, error } = await supabaseDb
        .from("user_subscriptions")
        .update(updatePayload)
        .eq("id", existingSub.id)
        .select()
        .single();

      if (error) {
        console.error("Subscription update error:", error);
        return new Response(
          JSON.stringify({
            success: false,
            version: FUNCTION_VERSION,
            error: "Failed to update subscription",
            details: {
              message: (error as any)?.message,
              code: (error as any)?.code,
              details: (error as any)?.details,
              hint: (error as any)?.hint,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      subscription = data;
    } else {
      const { data, error } = await supabaseDb
        .from("user_subscriptions")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("Subscription insert error:", error);
        return new Response(
          JSON.stringify({
            success: false,
            version: FUNCTION_VERSION,
            error: "Failed to create subscription",
            details: {
              message: (error as any)?.message,
              code: (error as any)?.code,
              details: (error as any)?.details,
              hint: (error as any)?.hint,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      subscription = data;
    }

    // Log subscription event (non-blocking)
    const { error: historyError } = await supabaseDb.from("subscription_history").insert({
      user_id: user.id,
      plan_id: planId,
      event_type: "subscription_activated",
      paystack_reference: reference,
      amount: verifyData.data.amount / 100, // Convert from kobo to naira
      billing_interval: billingInterval,
    });

    if (historyError) {
      console.error("Failed to insert subscription history:", historyError);
    }

    console.log("Subscription activated for user:", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        version: FUNCTION_VERSION,
        subscription: subscription,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in paystack-verify:", error);
    return new Response(
      JSON.stringify({
        success: false,
        version: FUNCTION_VERSION,
        error: error?.message ?? "Unknown error",
      }),
      {
        // Return 200 so the client can read the details (supabase-js hides bodies for non-2xx)
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
