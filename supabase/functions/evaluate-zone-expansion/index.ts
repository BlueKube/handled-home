import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EVALUATE-ZONE-EXPANSION] ${step}${detailsStr}`);
};

interface ZoneMetrics {
  zone_id: string;
  zone_name: string;
  capacity_util_pct: number;
  waitlist_count: number;
  avg_drive_time_min: number;
  support_ticket_rate: number;
  active_customers: number;
  active_providers: number;
}

function determineSuggestion(m: ZoneMetrics): { type: string; priority: string; recommendation: string; explain_admin: string } | null {
  // Critical: capacity >90% sustained + waitlist
  if (m.capacity_util_pct > 90 && m.waitlist_count > 10) {
    return {
      type: "split_zone",
      priority: "critical",
      recommendation: `Zone "${m.zone_name}" is at ${m.capacity_util_pct}% capacity with ${m.waitlist_count} waitlist entries. Consider splitting into sub-zones.`,
      explain_admin: `Capacity utilization ${m.capacity_util_pct}% exceeds 90% threshold. ${m.waitlist_count} people on waitlist. Splitting would distribute load and reduce drive times. Current avg drive time: ${m.avg_drive_time_min} min.`,
    };
  }

  // High: capacity >80% — recruit more providers
  if (m.capacity_util_pct > 80) {
    return {
      type: "recruit_provider",
      priority: "high",
      recommendation: `Zone "${m.zone_name}" is at ${m.capacity_util_pct}% capacity. Recruit additional backup providers to prevent overflow.`,
      explain_admin: `Capacity utilization ${m.capacity_util_pct}% approaching limit. ${m.active_providers} active providers. Adding backup coverage would prevent service disruptions.`,
    };
  }

  // Medium: rising support tickets
  if (m.support_ticket_rate > 0.15) {
    return {
      type: "protect_quality",
      priority: "medium",
      recommendation: `Zone "${m.zone_name}" has a ${(m.support_ticket_rate * 100).toFixed(1)}% support ticket rate. Consider quality protections.`,
      explain_admin: `Support ticket rate ${(m.support_ticket_rate * 100).toFixed(1)}% exceeds 15% threshold. This may indicate provider quality issues or capacity strain. Consider pausing new signups or adding provider oversight.`,
    };
  }

  // Low: waitlist growing without capacity pressure
  if (m.waitlist_count > 20 && m.capacity_util_pct < 60) {
    return {
      type: "raise_price",
      priority: "low",
      recommendation: `Zone "${m.zone_name}" has strong demand (${m.waitlist_count} waitlist) with available capacity. Consider price optimization.`,
      explain_admin: `${m.waitlist_count} waitlist entries with only ${m.capacity_util_pct}% capacity utilization suggests pricing may be below market. Consider testing a price increase.`,
    };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let runId: string | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];
    const weekKey = `evaluate-zone-expansion:${today}`;

    // Idempotency
    const { data: existing } = await supabase
      .from("cron_run_log")
      .select("id")
      .eq("idempotency_key", weekKey)
      .eq("status", "completed")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ status: "skipped", reason: "Already completed today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: runLog, error: runLogErr } = await supabase
      .from("cron_run_log")
      .insert({
        function_name: "evaluate-zone-expansion",
        idempotency_key: weekKey,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runLogErr) throw runLogErr;
    runId = runLog.id;

    // Get active zones
    const { data: zones, error: zoneErr } = await supabase
      .from("zones")
      .select("id, name, max_customers_per_day, max_jobs_per_day")
      .eq("status", "active");

    if (zoneErr) throw zoneErr;

    const results: Array<{ zone_id: string; zone_name: string; suggestion_created: boolean }> = [];
    let suggestionsCreated = 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    for (const zone of zones || []) {
      // Calculate capacity utilization (jobs in last 7 days vs max)
      const { count: recentJobs } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("zone_id", zone.id)
        .gte("scheduled_date", sevenDaysAgo.split("T")[0])
        .in("status", ["scheduled", "assigned", "in_progress", "completed"]);

      const maxWeeklyCapacity = (zone.max_jobs_per_day || 20) * 5; // 5 service days
      const capacityUtil = maxWeeklyCapacity > 0 ? ((recentJobs || 0) / maxWeeklyCapacity) * 100 : 0;

      // Waitlist count
      const { count: waitlistCount } = await supabase
        .from("waitlist_entries")
        .select("id", { count: "exact", head: true })
        .eq("zone_id", zone.id)
        .eq("status", "waiting");

      // Support ticket rate (tickets / jobs in last 7 days)
      const { count: ticketCount } = await supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .eq("zone_id", zone.id)
        .gte("created_at", sevenDaysAgo);

      const ticketRate = (recentJobs || 0) > 0 ? (ticketCount || 0) / (recentJobs || 1) : 0;

      // Active providers
      const { count: providerCount } = await supabase
        .from("zone_category_providers")
        .select("id", { count: "exact", head: true })
        .eq("zone_id", zone.id)
        .eq("status", "active");

      // Active customers
      const { count: customerCount } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("zone_id", zone.id)
        .eq("status", "active");

      const metrics: ZoneMetrics = {
        zone_id: zone.id,
        zone_name: zone.name,
        capacity_util_pct: Math.round(capacityUtil),
        waitlist_count: waitlistCount || 0,
        avg_drive_time_min: 0, // Would need GPS data; placeholder
        support_ticket_rate: ticketRate,
        active_customers: customerCount || 0,
        active_providers: providerCount || 0,
      };

      const suggestion = determineSuggestion(metrics);

      if (suggestion) {
        const idempKey = `expansion:${zone.id}:${suggestion.type}:${today}`;

        const { error: insertErr } = await supabase
          .from("expansion_suggestions")
          .insert({
            zone_id: zone.id,
            suggestion_type: suggestion.type,
            priority: suggestion.priority,
            metrics,
            recommendation: suggestion.recommendation,
            explain_admin: suggestion.explain_admin,
            idempotency_key: idempKey,
          });

        if (insertErr) {
          // Likely duplicate idempotency key — skip
          if (!insertErr.message.includes("duplicate")) {
            logStep(`Failed to create suggestion for ${zone.name}`, { error: insertErr.message });
          }
          results.push({ zone_id: zone.id, zone_name: zone.name, suggestion_created: false });
        } else {
          suggestionsCreated++;
          results.push({ zone_id: zone.id, zone_name: zone.name, suggestion_created: true });

          // Notify admins
          const { data: admins } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");

          for (const admin of admins || []) {
            await supabase.rpc("emit_notification", {
              p_user_id: admin.user_id,
              p_type: "expansion_suggestion",
              p_title: `Zone Expansion: ${zone.name}`,
              p_body: suggestion.recommendation,
              p_data: { zone_id: zone.id, suggestion_type: suggestion.type, priority: suggestion.priority },
            });
          }
        }
      } else {
        results.push({ zone_id: zone.id, zone_name: zone.name, suggestion_created: false });
      }
    }

    await supabase
      .from("cron_run_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: { zones_evaluated: results.length, suggestions_created: suggestionsCreated, details: results },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ status: "completed", run_id: runId, zones_evaluated: results.length, suggestions_created: suggestionsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("evaluate-zone-expansion error:", error);

    if (runId && supabase) {
      try {
        await supabase
          .from("cron_run_log")
          .update({ status: "failed", completed_at: new Date().toISOString(), error_message: String(error) })
          .eq("id", runId);
      } catch (logErr) {
        console.error("Failed to update cron_run_log:", logErr);
      }
    }

    return new Response(
      JSON.stringify({ status: "error", run_id: runId, message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
