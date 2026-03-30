import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-WEATHER] ${step}${detailsStr}`);
};

interface WeatherAlert {
  event: string;
  severity: string;
  headline: string;
  description: string;
  onset: string;
  ends: string;
}

interface ZoneWithCoords {
  id: string;
  name: string;
  center_lat: number | null;
  center_lng: number | null;
  metadata: Record<string, unknown> | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let runId: string | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    requireCronSecret(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    supabase = createClient(supabaseUrl, serviceRoleKey);

    const weatherApiKey = Deno.env.get("WEATHER_API_KEY");

    // Finding 7: Return error if no API key configured instead of silent no-op
    if (!weatherApiKey) {
      logStep("No WEATHER_API_KEY configured — aborting");
      return new Response(
        JSON.stringify({ status: "error", message: "WEATHER_API_KEY not configured. Set this secret to enable weather detection." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const idempotencyKey = `check-weather:${today}`;

    // Idempotency check
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
        function_name: "check-weather",
        idempotency_key: idempotencyKey,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runLogErr) throw runLogErr;
    runId = runLog.id;

    // Get all active zones with coordinates
    const { data: zones, error: zoneErr } = await supabase
      .from("zones")
      .select("id, name, center_lat, center_lng, metadata")
      .eq("status", "active");

    if (zoneErr) throw zoneErr;

    const results: Array<{ zone_id: string; zone_name: string; alerts_found: number; events_created: number }> = [];
    let totalEventsCreated = 0;

    for (const zone of (zones as ZoneWithCoords[]) || []) {
      if (!zone.center_lat || !zone.center_lng) {
        logStep(`Skipping zone ${zone.name} — no coordinates`);
        continue;
      }

      let alerts: WeatherAlert[] = [];

      try {
        const resp = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${zone.center_lat},${zone.center_lng}&days=3&alerts=yes`,
          { headers: { "Accept": "application/json" } }
        );

        if (resp.ok) {
          const data = await resp.json();
          if (data.alerts?.alert) {
            alerts = (data.alerts.alert as Array<Record<string, string>>).map((a) => ({
              event: a.event || "Weather Alert",
              severity: a.severity || "Watch",
              headline: a.headline || a.event || "Weather advisory",
              description: a.desc || "",
              onset: a.effective || new Date().toISOString(),
              ends: a.expires || new Date(Date.now() + 86400000).toISOString(),
            }));
          }
        } else {
          logStep(`Weather API error for zone ${zone.name}`, { status: resp.status });
        }
      } catch (apiErr: unknown) {
        logStep(`Weather API fetch failed for zone ${zone.name}`, { error: String(apiErr) });
      }

      if (alerts.length === 0) {
        results.push({ zone_id: zone.id, zone_name: zone.name, alerts_found: 0, events_created: 0 });
        continue;
      }

      logStep(`Found ${alerts.length} alerts for zone ${zone.name}`);

      let eventsCreated = 0;
      for (const alert of alerts) {
        const isSevere = alert.severity === "Severe" || alert.severity === "Extreme" ||
          alert.event.toLowerCase().includes("warning") ||
          alert.event.toLowerCase().includes("tornado") ||
          alert.event.toLowerCase().includes("hurricane");

        const severity = isSevere ? "severe" : "advisory";
        const strategy = isSevere ? "cancel_notify" : "delay_same_week";

        const onsetDate = alert.onset ? alert.onset.split("T")[0] : today;
        const endsDate = alert.ends ? alert.ends.split("T")[0] : today;

        // Dedup check
        const { data: existing } = await supabase
          .from("weather_events")
          .select("id")
          .eq("zone_id", zone.id)
          .eq("source", "auto_detected")
          .lte("affected_date_start", endsDate)
          .gte("affected_date_end", onsetDate)
          .in("status", ["pending", "active"])
          .maybeSingle();

        if (existing) {
          logStep(`Duplicate weather event skipped for zone ${zone.name}`);
          continue;
        }

        const { error: insertErr } = await supabase
          .from("weather_events")
          .insert({
            zone_id: zone.id,
            category: "all",
            event_type: isSevere ? "cancel" : "delay",
            severity,
            strategy,
            status: "pending",
            title: alert.headline,
            description: alert.description.substring(0, 500),
            affected_date_start: onsetDate,
            affected_date_end: endsDate,
            source: "auto_detected",
            auto_detection_data: { raw_alert: alert },
            explain_customer: isSevere
              ? `Severe weather alert: ${alert.event}. Your service may be cancelled for safety. We'll reschedule as soon as conditions improve.`
              : `Weather advisory: ${alert.event}. Your service may be delayed. We'll keep you updated.`,
            explain_provider: isSevere
              ? `Severe weather: ${alert.event}. Do not attempt service. Jobs will be rescheduled.`
              : `Weather advisory: ${alert.event}. Use caution. Check for updates before starting route.`,
            explain_admin: `Auto-detected weather event: ${alert.event} (${severity}). Requires admin approval before affecting jobs.`,
          });

        if (insertErr) {
          logStep(`Failed to create weather event for zone ${zone.name}`, { error: insertErr.message });
        } else {
          eventsCreated++;
          totalEventsCreated++;

          // Emit via event bus for admin weather review
          await supabase.rpc("emit_notification_event", {
            p_event_type: "ADMIN_WEATHER_PENDING",
            p_idempotency_key: `weather_pending:${zone.id}:${onsetDate}:${alert.event.replace(/\s+/g, '_')}`,
            p_audience_type: "ADMIN",
            p_priority: "SERVICE",
            p_payload: {
              zone_id: zone.id,
              zone_name: zone.name,
              severity,
              event: alert.event,
            },
          });

          // Emit customer schedule change for severe weather
          if (isSevere) {
            await supabase.rpc("emit_notification_event", {
              p_event_type: "CUSTOMER_SCHEDULE_CHANGED_WEATHER",
              p_idempotency_key: `weather_customer:${zone.id}:${onsetDate}`,
              p_audience_type: "CUSTOMER",
              p_audience_zone_id: zone.id,
              p_priority: "CRITICAL",
              p_payload: { event: alert.event, zone_name: zone.name },
            });
          }
        }
      }

      results.push({ zone_id: zone.id, zone_name: zone.name, alerts_found: alerts.length, events_created: eventsCreated });
    }

    // Complete run log
    await supabase
      .from("cron_run_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: { zones_checked: results.length, events_created: totalEventsCreated, details: results },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ status: "completed", run_id: runId, zones_checked: results.length, events_created: totalEventsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-weather error:", error);

    // Finding 8: Update orphaned cron_run_log to 'failed' status
    if (runId && supabase) {
      try {
        await supabase
          .from("cron_run_log")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: String(error),
          })
          .eq("id", runId);
      } catch (logErr) {
        console.error("Failed to update cron_run_log to failed:", logErr);
      }
    }

    return new Response(
      JSON.stringify({ status: "error", run_id: runId, message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
