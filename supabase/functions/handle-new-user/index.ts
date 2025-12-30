// Handle New User Signup - Create Profile and Process Referrals
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DF';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

    const { record } = await req.json();
    const userId = record.id;
    const userEmail = record.email;
    const userName = record.raw_user_meta_data?.name || userEmail.split('@')[0];
    const referredByCode = record.raw_user_meta_data?.referral_code;
    const companyName = record.raw_user_meta_data?.company_name || null;
    const companyEmail = record.raw_user_meta_data?.company_email || userEmail;
    const companyPhone = record.raw_user_meta_data?.company_phone || null;

    console.log("Processing new user:", userId, "referred by:", referredByCode);

    // Generate unique referral code for new user
    let newReferralCode = generateReferralCode();
    let codeExists = true;
    let attempts = 0;
    
    while (codeExists && attempts < 10) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', newReferralCode)
        .maybeSingle();
      
      if (!data) {
        codeExists = false;
      } else {
        newReferralCode = generateReferralCode();
        attempts++;
      }
    }

    // Calculate trial end date (7 days default, 30 days if referred)
    const now = new Date();
    const trialDays = referredByCode ? 30 : 7;
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + trialDays);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: userEmail,
        name: userName,
        referral_code: newReferralCode,
        referred_by: null, // Will be set if referral is valid
        subscription_status: 'FreeTrial',
        subscription_end_date: trialEnd.toISOString(),
        referral_count: 0,
        company_name: companyName,
        company_email: companyEmail,
        company_phone: companyPhone,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw new Error("Failed to create profile");
    }

    // Create user_subscriptions record with trial_start
    const { error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        status: 'trialing',
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
      });

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);
      // Don't throw - profile is already created, just log the error
    }

    // Process referral if code was provided
    if (referredByCode) {
      // Find referrer by code
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('profiles')
        .select('id, subscription_end_date, subscription_status')
        .eq('referral_code', referredByCode)
        .maybeSingle();

      if (referrerError) {
        console.error("Error finding referrer:", referrerError);
      } else if (referrer && referrer.id !== userId) {
        // Valid referral - update new user's referred_by
        await supabaseAdmin
          .from('profiles')
          .update({ referred_by: referrer.id })
          .eq('id', userId);

        // Create referral record
        await supabaseAdmin
          .from('referrals')
          .insert({
            referrer_id: referrer.id,
            referred_id: userId,
            status: 'Completed',
          });

        // Grant referrer 30 days bonus
        const referrerEndDate = referrer.subscription_end_date 
          ? new Date(referrer.subscription_end_date)
          : new Date();
        
        // If subscription is expired, start from now
        if (referrerEndDate < now) {
          referrerEndDate.setTime(now.getTime());
        }
        
        referrerEndDate.setDate(referrerEndDate.getDate() + 30);

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_end_date: referrerEndDate.toISOString(),
            subscription_status: referrer.subscription_status === 'Expired' ? 'FreeTrial' : referrer.subscription_status,
            referral_count: supabaseAdmin.rpc('increment', { x: 1, row_id: referrer.id }),
          })
          .eq('id', referrer.id);

        // Increment referral count
        const { data: currentReferrer } = await supabaseAdmin
          .from('profiles')
          .select('referral_count')
          .eq('id', referrer.id)
          .single();

        if (currentReferrer) {
          await supabaseAdmin
            .from('profiles')
            .update({ referral_count: (currentReferrer.referral_count || 0) + 1 })
            .eq('id', referrer.id);
        }

        console.log("Referral processed successfully for:", referrer.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "User profile created" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in handle-new-user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
