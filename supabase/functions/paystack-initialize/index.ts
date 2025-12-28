// Paystack Initialize Payment Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InitializeRequest {
  planId: string;
  billingInterval: "monthly" | "yearly";
  callbackUrl: string;
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

    const { planId, billingInterval, callbackUrl }: InitializeRequest = await req.json();
    console.log("Initializing subscription for user:", user.id, "plan:", planId, "interval:", billingInterval);

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      console.error("Plan error:", planError);
      throw new Error("Invalid plan");
    }

    const amount = billingInterval === "monthly" ? plan.price_monthly : plan.price_yearly;
    const planCode = billingInterval === "monthly" ? plan.paystack_plan_code_monthly : plan.paystack_plan_code_yearly;

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount, // Amount in kobo
        callback_url: callbackUrl,
        metadata: {
          user_id: user.id,
          plan_id: planId,
          plan_name: plan.name,
          plan_code: planCode,
          billing_interval: billingInterval,
          custom_fields: [
            {
              display_name: "Plan",
              variable_name: "plan",
              value: plan.name,
            },
            {
              display_name: "Billing",
              variable_name: "billing",
              value: billingInterval,
            },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack response:", paystackData);

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Failed to initialize payment");
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in paystack-initialize:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
