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

    // 1. Release eligible earning holds (2B-10)
    logStep("Running release_eligible_earning_holds");
    const { data: releaseResult, error: releaseErr } = await supabase.rpc("release_eligible_earning_holds");
    if (releaseErr) {
      logStep("release_eligible_earning_holds error", { error: releaseErr.message });
      results.release_holds = { error: releaseErr.message };
    } else {
      results.release_holds = releaseResult;
      logStep("release_eligible_earning_holds done", releaseResult);
    }

    // FIX Finding 5: Removed redundant transition_eligible_earnings call.
    // release_eligible_earning_holds (step 1) already handles EARNED → ELIGIBLE transitions
    // for both hold-based and 24-hour-default earnings. The old transition_eligible_earnings
    // RPC is kept in the DB for backward compatibility but no longer called here.

    // 3. Generate invoices for subscriptions approaching cycle end
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

          // 2B-09: Auto-apply credits to newly generated invoices
          if (invoiceResult?.invoice_id) {
            const { data: creditResult, error: creditErr } = await supabase.rpc("apply_referral_credits_to_invoice", {
              p_invoice_id: invoiceResult.invoice_id,
            });
            if (creditErr) {
              invoiceResults.push({ subscription_id: sub.id, credit_error: creditErr.message });
            } else if (creditResult?.credits_applied_cents > 0) {
              invoiceResults.push({ subscription_id: sub.id, credits_applied: creditResult });
            }
          }
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
