import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    requireCronSecret(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];
    const idempotencyKey = `evaluate-sla:${today}`;

    // Check idempotency
    const { data: existingRun } = await supabase
      .from("cron_run_log")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "completed")
      .maybeSingle();

    if (existingRun) {
      return new Response(
        JSON.stringify({ status: "skipped", reason: "Already completed today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create run log
    const { data: runLog, error: runLogErr } = await supabase
      .from("cron_run_log")
      .insert({
        function_name: "evaluate-provider-sla",
        idempotency_key: idempotencyKey,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runLogErr) throw runLogErr;
    const runId = runLog.id;

    // Get all active provider assignments
    const { data: assignments, error: assignErr } = await supabase
      .from("zone_category_providers")
      .select("provider_org_id, zone_id, category")
      .eq("status", "ACTIVE")
      .limit(500);

    if (assignErr) throw assignErr;

    let evaluated = 0;
    let errors = 0;
    const levelCounts: Record<string, number> = { GREEN: 0, YELLOW: 0, ORANGE: 0, RED: 0 };

    // Pre-fetch zone names for notifications
    const zoneIds = [...new Set((assignments ?? []).map(a => a.zone_id))];
    const { data: zones } = await supabase
      .from("zones")
      .select("id, name")
      .in("id", zoneIds);
    const zoneNameMap = new Map((zones ?? []).map((z: { id: string; name: string }) => [z.id, z.name]));

    for (const assignment of assignments ?? []) {
      try {
        const { data, error } = await supabase.rpc("evaluate_provider_sla", {
          p_provider_org_id: assignment.provider_org_id,
          p_zone_id: assignment.zone_id,
          p_category: assignment.category,
        });

        if (error) {
          errors++;
          console.error(`SLA eval error for ${assignment.provider_org_id}:`, error.message);
        } else if (data?.status === "evaluated") {
          evaluated++;
          const level = data.sla_level as string;
          if (level in levelCounts) levelCounts[level]++;

          // Emit SLA level change notification for ORANGE/RED
          if (level === "ORANGE" || level === "RED") {
            await supabase.rpc("emit_notification_event", {
              p_event_type: "PROVIDER_SLA_LEVEL_CHANGED",
              p_idempotency_key: `sla_change:${assignment.provider_org_id}:${assignment.zone_id}:${assignment.category}:${today}`,
              p_audience_type: "PROVIDER",
              p_audience_org_id: assignment.provider_org_id,
              p_priority: "CRITICAL",
              p_payload: {
                sla_level: level,
                category: assignment.category,
                zone_name: zoneNameMap.get(assignment.zone_id) ?? assignment.zone_id,
                action_hint: level === "RED"
                  ? "Your account may be suspended. Contact support immediately."
                  : "Improve your metrics to avoid restrictions.",
              },
            });
          }
        }
      } catch (err) {
        errors++;
        console.error(`SLA eval exception:`, err);
      }
    }

    // Run auto-suspension for RED providers (2B-06)
    let suspensionResult: any = null;
    try {
      const { data, error: suspErr } = await supabase.rpc("enforce_sla_suspensions");
      if (suspErr) {
        console.error("Suspension enforcement error:", suspErr);
        suspensionResult = { error: suspErr.message };
      } else {
        suspensionResult = data;
      }
    } catch (err) {
      console.error("Suspension enforcement error:", err);
      suspensionResult = { error: String(err) };
    }

    // Update run log
    await supabase
      .from("cron_run_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: {
          total: (assignments ?? []).length,
          evaluated,
          errors,
          levels: levelCounts,
          suspensions: suspensionResult,
        },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        status: "completed",
        run_id: runId,
        summary: { evaluated, errors, levels: levelCounts, suspensions: suspensionResult },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("evaluate-provider-sla error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
