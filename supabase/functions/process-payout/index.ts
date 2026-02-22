import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYOUT] ${step}${detailsStr}`);
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

    // Admin auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    // Verify admin role
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) throw new Error("Admin access required");

    const { payout_id } = await req.json();
    if (!payout_id) throw new Error("payout_id required");

    // Get payout details
    const { data: payout, error: payoutErr } = await supabase
      .from("provider_payouts")
      .select("*, provider_payout_accounts!inner(processor_account_id)")
      .eq("id", payout_id)
      .eq("status", "INITIATED")
      .single();

    if (payoutErr || !payout) throw new Error("Payout not found or not in INITIATED status");

    const connectedAccountId = (payout as any).provider_payout_accounts?.processor_account_id;
    if (!connectedAccountId) throw new Error("Provider has no connected account");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    logStep("Creating transfer", { amount: payout.total_cents, destination: connectedAccountId });

    const transfer = await stripe.transfers.create({
      amount: payout.total_cents,
      currency: "usd",
      destination: connectedAccountId,
      metadata: {
        payout_id: payout.id,
        provider_org_id: payout.provider_org_id,
      },
    });

    // Update payout with processor reference
    await supabase
      .from("provider_payouts")
      .update({ processor_payout_id: transfer.id })
      .eq("id", payout_id);

    logStep("Transfer created", { transferId: transfer.id });

    return new Response(JSON.stringify({
      transfer_id: transfer.id,
      status: "INITIATED",
      amount: payout.total_cents,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Process payout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
