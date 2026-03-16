import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { provider_org_id } = await req.json();
    if (!provider_org_id) throw new Error("provider_org_id required");

    // Verify caller is member of this org
    const { data: member } = await supabase
      .from("provider_members")
      .select("id")
      .eq("provider_org_id", provider_org_id)
      .eq("user_id", userData.user.id)
      .eq("status", "ACTIVE")
      .single();

    if (!member) throw new Error("Not a member of this provider org");

    // Check if account already exists
    const { data: existing } = await supabase
      .from("provider_payout_accounts")
      .select("*")
      .eq("provider_org_id", provider_org_id)
      .single();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "http://localhost:3000";

    let accountId: string;

    if (existing?.processor_account_id) {
      accountId = existing.processor_account_id;
    } else {
      // Get org details for account creation
      const { data: org } = await supabase
        .from("provider_orgs")
        .select("name, contact_phone")
        .eq("id", provider_org_id)
        .single();

      const account = await stripe.accounts.create({
        type: "express",
        business_type: "company",
        company: { name: org?.name || "Provider" },
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await supabase.from("provider_payout_accounts").upsert({
        provider_org_id,
        processor_account_id: accountId,
        status: "PENDING_VERIFICATION",
      }, { onConflict: "provider_org_id" });
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/provider/payouts/onboarding?refresh=true`,
      return_url: `${origin}/provider/payouts?onboarding=complete`,
      type: "account_onboarding",
    });

    // Update onboarding URL
    await supabase
      .from("provider_payout_accounts")
      .update({ onboarding_url: accountLink.url })
      .eq("provider_org_id", provider_org_id);

    return new Response(JSON.stringify({
      url: accountLink.url,
      account_id: accountId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Connect account error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
