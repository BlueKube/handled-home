import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_DIALS = {
  max_credit_cents: 5000,
  credit_tiers: [500, 1000, 2500],
  generosity: 0.5,
  evidence_required: true,
  redo_allowed: true,
  outcomes_allowed: ["credit", "redo", "refund"],
  sla_hours: 48,
  abuse_controls: { max_tickets_per_month: 5, repeat_window_days: 30 },
};

/**
 * Resolve the active policy dials for a ticket context.
 * Precedence: provider → sku → category → zone → global (first match wins).
 */
async function resolveActivePolicyDials(
  supabase: SupabaseClient,
  context: { provider_org_id?: string; sku_id?: string; category?: string; zone_id?: string },
): Promise<Record<string, any>> {
  const precedence: Array<{ scope_type: string; ref_id: string | undefined }> = [
    { scope_type: "provider", ref_id: context.provider_org_id },
    { scope_type: "sku", ref_id: context.sku_id },
    { scope_type: "category", ref_id: context.category },
    { scope_type: "zone", ref_id: context.zone_id },
    { scope_type: "global", ref_id: "global" },
  ];

  for (const { scope_type, ref_id } of precedence) {
    if (!ref_id) continue;
    const { data: scope } = await supabase
      .from("support_policy_scopes")
      .select("active_policy_id, support_policies(dials)")
      .eq("scope_type", scope_type)
      .eq("scope_ref_id", ref_id)
      .maybeSingle();

    if (scope?.support_policies?.dials) {
      return { ...DEFAULT_DIALS, ...(scope.support_policies.dials as Record<string, any>) };
    }
  }

  return DEFAULT_DIALS;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // H-3: Restrict to service_role or admin — this function should only be called
    // server-side (from support-ai-classify or scheduled jobs), never directly by clients.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is service_role (internal call) or an admin user
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === serviceKey;

    if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error: claimsErr } = await userClient.auth.getClaims(token);
      if (claimsErr || !data?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminSupabase = createClient(supabaseUrl, serviceKey);
      const { data: isAdmin } = await adminSupabase.rpc("has_role", {
        _user_id: data.claims.sub,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { ticket_id, credit_override_cents } = await req.json();
    if (!ticket_id) {
      return new Response(JSON.stringify({ error: "ticket_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch ticket with AI classification
    const { data: ticket, error: ticketErr } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticket_id)
      .single();

    if (ticketErr || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const classification = ticket.ai_classification as Record<string, any> | null;
    if (!classification) {
      return new Response(JSON.stringify({ error: "Ticket has no AI classification" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Guard checks
    const autoResolvable = classification.auto_resolvable === true;
    const evidenceScore = ticket.ai_evidence_score ?? 0;
    const riskScore = ticket.ai_risk_score ?? 100;
    const suggestedCreditCents = classification.suggested_credit_cents ?? 0;
    const resolutionExplanation = classification.resolution_explanation ?? "We've reviewed your issue and applied a resolution.";

    if (!autoResolvable || evidenceScore < 75 || riskScore >= 30) {
      return new Response(JSON.stringify({
        success: false,
        reason: "Does not meet auto-resolution criteria",
        auto_resolvable: autoResolvable,
        evidence_score: evidenceScore,
        risk_score: riskScore,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load policy dials for this ticket's context (falls back to defaults)
    const dials = await resolveActivePolicyDials(supabase, {
      provider_org_id: ticket.provider_org_id,
      category: ticket.category,
      zone_id: ticket.zone_id,
    });

    // Use admin override if provided, otherwise AI suggestion. Cap per policy dials.
    const baseCreditCents = (typeof credit_override_cents === "number" && !isNaN(credit_override_cents))
      ? credit_override_cents
      : suggestedCreditCents;
    const creditCents = Math.min(Math.max(0, baseCreditCents), dials.max_credit_cents ?? 5000);

    // Apply credit if suggested
    if (creditCents > 0) {
      await supabase.from("customer_credits").insert({
        customer_id: ticket.customer_id,
        amount_cents: creditCents,
        reason: `AI auto-resolution: ${resolutionExplanation.slice(0, 100)}`,
        status: "AVAILABLE",
      });
    }

    // Resolve the ticket
    const resolvedAt = new Date().toISOString();
    await supabase
      .from("support_tickets")
      .update({
        status: "resolved",
        resolution_summary: `[AI Auto-Resolved] ${resolutionExplanation}${creditCents > 0 ? ` ($${(creditCents / 100).toFixed(2)} credit applied)` : ""}`,
        resolved_at: resolvedAt,
      })
      .eq("id", ticket_id);

    // Sync linked customer_issues row status
    await supabase
      .from("customer_issues")
      .update({
        status: "resolved",
        resolution_note: resolutionExplanation,
        resolved_at: resolvedAt,
        updated_at: resolvedAt,
      })
      .eq("support_ticket_id", ticket_id);

    // Log the resolution event
    await supabase.from("support_ticket_events").insert({
      ticket_id,
      event_type: "admin_resolved",
      actor_user_id: null,
      metadata: {
        resolved_by: "ai_auto_resolve",
        credit_cents: creditCents,
        evidence_score: evidenceScore,
        risk_score: riskScore,
        classification: classification,
      },
    });

    // Emit notification to customer
    try {
      await supabase.rpc("emit_notification_event", {
        p_event_type: "CUSTOMER_ISSUE_AUTO_RESOLVED",
        p_audience_type: "CUSTOMER",
        p_audience_user_id: ticket.customer_id,
        p_idempotency_key: `auto_resolve_${ticket_id}`,
        p_payload: {
          ticket_id,
          resolution: resolutionExplanation,
          credit_cents: creditCents,
        },
        p_priority: "service",
      });
    } catch (notifErr) {
      console.error("Notification emit failed (non-fatal):", notifErr);
    }

    // Log to ai_inference_runs
    await supabase.from("ai_inference_runs").insert({
      ticket_id,
      model_name: "auto-resolve-v1",
      input_summary: `auto-resolve: ticket ${ticket_id}, credit $${(creditCents / 100).toFixed(2)}`,
      output: {
        action: "auto_resolved",
        credit_cents: creditCents,
        resolution: resolutionExplanation,
      },
      evidence_score: evidenceScore,
      risk_score: riskScore,
    });

    return new Response(JSON.stringify({
      success: true,
      credit_cents: creditCents,
      resolution: resolutionExplanation,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-resolve-dispute error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
