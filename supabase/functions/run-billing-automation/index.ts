import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-AUTOMATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // This function is called by pg_cron — authenticate via service role
    // or via admin bearer token
    const authHeader = req.headers.get("Authorization");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    // If called with anon key (cron), use service role directly
    // If called with user token, verify admin
    if (authHeader && !authHeader.includes(anonKey || "")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) throw new Error("Unauthorized");

      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .single();
      if (!adminRole) throw new Error("Admin access required");
    }

    const results: Record<string, any> = {};

    // 1. Transition eligible earnings (EARNED -> ELIGIBLE when hold_until passed)
    logStep("Running transition_eligible_earnings");
    const { data: transitionResult, error: transitionErr } = await supabase.rpc("transition_eligible_earnings");
    if (transitionErr) {
      logStep("transition_eligible_earnings error", { error: transitionErr.message });
      results.transition_earnings = { error: transitionErr.message };
    } else {
      results.transition_earnings = transitionResult;
      logStep("transition_eligible_earnings done", transitionResult);
    }

    // 2. Generate invoices for subscriptions approaching cycle end
    logStep("Checking subscriptions for invoice generation");
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: upcomingSubs, error: subErr } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("status", "active")
      .lte("billing_cycle_end_at", threeDaysFromNow.toISOString())
      .gte("billing_cycle_end_at", new Date().toISOString());

    if (subErr) {
      logStep("Subscription query error", { error: subErr.message });
      results.invoice_generation = { error: subErr.message };
    } else {
      const invoiceResults: any[] = [];
      for (const sub of upcomingSubs || []) {
        const { data: invoiceResult, error: invoiceErr } = await supabase.rpc("generate_subscription_invoice", {
          p_subscription_id: sub.id,
        });
        if (invoiceErr) {
          invoiceResults.push({ subscription_id: sub.id, error: invoiceErr.message });
        } else {
          invoiceResults.push({ subscription_id: sub.id, result: invoiceResult });
        }
      }
      results.invoice_generation = { processed: invoiceResults.length, details: invoiceResults };
      logStep("Invoice generation done", { count: invoiceResults.length });
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Billing automation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
