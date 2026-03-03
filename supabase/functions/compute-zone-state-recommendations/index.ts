import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ThresholdMap {
  min_providers_to_open: number;
  open_utilization_enter: number;
  open_utilization_exit: number;
  protect_quality_utilization_enter: number;
  protect_quality_utilization_exit: number;
  provider_recruiting_utilization_trigger: number;
  coverage_risk_waitlist_threshold: number;
  coverage_risk_recruiting_threshold: number;
  min_time_in_state_days: number;
  soft_launch_intake_cap_per_week: number;
}

interface ZoneCategoryMetrics {
  demand_minutes: number;
  supply_minutes: number;
  utilization: number;
  qualified_provider_count: number;
  coverage_risk: number;
  active_subscriptions: number;
  waitlist_count: number;
  late_rate: number | null;
  reschedule_rate: number | null;
  no_show_rate: number | null;
}

interface StateRow {
  id: string;
  zone_id: string;
  category: string;
  status: string;
  locked_until: string | null;
  last_state_change_at: string | null;
}

const EPSILON = 0.001;

function computeRecommendation(
  currentState: string,
  metrics: ZoneCategoryMetrics,
  thresholds: ThresholdMap,
  daysSinceLastChange: number | null,
  isLocked: boolean,
): { recommendedState: string | null; reasons: string[]; confidence: "high" | "medium" | "low" } {
  // 1) If manually locked CLOSED → no recommendation
  if (currentState === "CLOSED" && isLocked) {
    return { recommendedState: null, reasons: [], confidence: "high" };
  }

  let recommendedState: string;
  const reasons: string[] = [];

  // 2) No supply at all → WAITLIST_ONLY
  if (metrics.supply_minutes < EPSILON || metrics.qualified_provider_count === 0) {
    recommendedState = "WAITLIST_ONLY";
    reasons.push("No qualified supply");
  }
  // 3) High coverage risk → WAITLIST_ONLY
  else if (metrics.coverage_risk > thresholds.coverage_risk_waitlist_threshold) {
    recommendedState = "WAITLIST_ONLY";
    reasons.push(`Coverage risk high (${(metrics.coverage_risk * 100).toFixed(0)}% > ${(thresholds.coverage_risk_waitlist_threshold * 100).toFixed(0)}%)`);
  }
  // 4) Utilization >= protect quality enter → PROTECT_QUALITY
  else if (metrics.utilization >= thresholds.protect_quality_utilization_enter) {
    recommendedState = "PROTECT_QUALITY";
    reasons.push(`Utilization high (${(metrics.utilization * 100).toFixed(0)}% ≥ ${(thresholds.protect_quality_utilization_enter * 100).toFixed(0)}%)`);
  }
  // 5) Insufficient bench depth → PROVIDER_RECRUITING
  else if (
    metrics.qualified_provider_count < thresholds.min_providers_to_open ||
    metrics.coverage_risk > thresholds.coverage_risk_recruiting_threshold ||
    metrics.utilization > thresholds.provider_recruiting_utilization_trigger
  ) {
    recommendedState = "PROVIDER_RECRUITING";
    const subReasons: string[] = [];
    if (metrics.qualified_provider_count < thresholds.min_providers_to_open) {
      subReasons.push(`Provider count ${metrics.qualified_provider_count} < ${thresholds.min_providers_to_open}`);
    }
    if (metrics.coverage_risk > thresholds.coverage_risk_recruiting_threshold) {
      subReasons.push(`Coverage risk ${(metrics.coverage_risk * 100).toFixed(0)}% > ${(thresholds.coverage_risk_recruiting_threshold * 100).toFixed(0)}%`);
    }
    if (metrics.utilization > thresholds.provider_recruiting_utilization_trigger) {
      subReasons.push(`Utilization ${(metrics.utilization * 100).toFixed(0)}% > ${(thresholds.provider_recruiting_utilization_trigger * 100).toFixed(0)}%`);
    }
    reasons.push("Insufficient bench depth: " + subReasons.join("; "));
  }
  // 6) Near capacity → SOFT_LAUNCH
  else if (metrics.utilization > thresholds.open_utilization_enter) {
    recommendedState = "SOFT_LAUNCH";
    reasons.push(`Near capacity — controlled intake (${(metrics.utilization * 100).toFixed(0)}%)`);
  }
  // 7) Healthy → OPEN
  else {
    recommendedState = "OPEN";
    reasons.push(`Healthy buffer (utilization ${(metrics.utilization * 100).toFixed(0)}%)`);
  }

  // ── Hysteresis checks ──
  // If currently OPEN and recommendation is to leave OPEN, check exit threshold
  if (currentState === "OPEN" && recommendedState !== "OPEN") {
    if (metrics.utilization <= thresholds.open_utilization_exit && recommendedState === "SOFT_LAUNCH") {
      // Not past exit threshold — stay OPEN
      return { recommendedState: null, reasons: [], confidence: "high" };
    }
  }
  // If currently PROTECT_QUALITY and recommendation is to leave, check exit threshold
  if (currentState === "PROTECT_QUALITY" && recommendedState !== "PROTECT_QUALITY") {
    if (metrics.utilization > thresholds.protect_quality_utilization_exit) {
      // Not past exit threshold — stay in PROTECT_QUALITY
      return { recommendedState: null, reasons: [], confidence: "high" };
    }
  }

  // No change needed
  if (recommendedState === currentState) {
    return { recommendedState: null, reasons: [], confidence: "high" };
  }

  // ── Min time-in-state check (non-emergency) ──
  const isEmergency = recommendedState === "PROTECT_QUALITY";
  if (
    !isEmergency &&
    daysSinceLastChange !== null &&
    daysSinceLastChange < thresholds.min_time_in_state_days
  ) {
    return { recommendedState: null, reasons: [], confidence: "high" };
  }

  // ── Confidence scoring ──
  let confidence: "high" | "medium" | "low" = "high";
  const totalDataPoints = metrics.active_subscriptions + metrics.qualified_provider_count;
  if (totalDataPoints < 3) {
    confidence = "low";
  } else {
    // Check distance from thresholds
    const distFromOpenEnter = Math.abs(metrics.utilization - thresholds.open_utilization_enter);
    const distFromProtect = Math.abs(metrics.utilization - thresholds.protect_quality_utilization_enter);
    const minDist = Math.min(distFromOpenEnter, distFromProtect);
    if (minDist < 0.10) {
      confidence = "medium";
    }
  }

  return { recommendedState, reasons, confidence };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  const today = new Date().toISOString().split("T")[0];
  const idempotencyKey = `compute-zone-state-recommendations-${today}`;

  // ── Idempotency check via cron_run_log ──
  const { data: existingRun } = await sb
    .from("cron_run_log")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "completed")
    .maybeSingle();

  if (existingRun) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "Already completed today" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Start cron run log
  const { data: runLog } = await sb
    .from("cron_run_log")
    .insert({
      function_name: "compute-zone-state-recommendations",
      idempotency_key: idempotencyKey,
      started_at: new Date().toISOString(),
      status: "running",
    })
    .select("id")
    .single();

  const runId = runLog?.id;

  try {
    // ── Load thresholds ──
    const { data: thresholdRows } = await sb
      .from("zone_state_threshold_configs")
      .select("config_key, config_value");

    const thresholdMap: Record<string, number> = {};
    (thresholdRows ?? []).forEach((r: any) => {
      thresholdMap[r.config_key] = typeof r.config_value === "object" && r.config_value !== null
        ? (r.config_value as any).value ?? r.config_value
        : r.config_value;
    });

    const thresholds: ThresholdMap = {
      min_providers_to_open: thresholdMap["min_providers_to_open"] ?? 2,
      open_utilization_enter: thresholdMap["open_utilization_enter"] ?? 0.75,
      open_utilization_exit: thresholdMap["open_utilization_exit"] ?? 0.80,
      protect_quality_utilization_enter: thresholdMap["protect_quality_utilization_enter"] ?? 0.85,
      protect_quality_utilization_exit: thresholdMap["protect_quality_utilization_exit"] ?? 0.75,
      provider_recruiting_utilization_trigger: thresholdMap["provider_recruiting_utilization_trigger"] ?? 0.95,
      coverage_risk_waitlist_threshold: thresholdMap["coverage_risk_waitlist_threshold"] ?? 0.40,
      coverage_risk_recruiting_threshold: thresholdMap["coverage_risk_recruiting_threshold"] ?? 0.20,
      min_time_in_state_days: thresholdMap["min_time_in_state_days"] ?? 7,
      soft_launch_intake_cap_per_week: thresholdMap["soft_launch_intake_cap_per_week"] ?? 10,
    };

    // ── Load all zone-category states ──
    const { data: states } = await sb
      .from("market_zone_category_state")
      .select("id, zone_id, category, status, locked_until, last_state_change_at");

    if (!states || states.length === 0) {
      await sb.from("cron_run_log").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: { recommendations_created: 0, reason: "No zone-category states" },
      }).eq("id", runId);

      return new Response(
        JSON.stringify({ recommendations_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Gather unique zones and categories ──
    const zoneIds = [...new Set(states.map((s: any) => s.zone_id))];
    const categories = [...new Set(states.map((s: any) => s.category))];

    // ── Load data in parallel ──
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();

    const [
      subsRes,
      zcpRes,
      jobsRes,
      waitlistRes,
      skusRes,
      snoozedRes,
    ] = await Promise.all([
      // Active subscriptions with zone_id
      sb.from("subscriptions").select("zone_id, plan_id").eq("status", "active").in("zone_id", zoneIds),
      // Zone-category providers (active)
      sb.from("zone_category_providers").select("zone_id, category, provider_org_id, status").eq("status", "active").in("zone_id", zoneIds),
      // Jobs in last 14 days for quality metrics
      sb.from("jobs").select("zone_id, status, scheduled_date").in("zone_id", zoneIds).gte("scheduled_date", fourteenDaysAgo.split("T")[0]),
      // Waitlist entries
      sb.from("waitlist_entries").select("zone_id, category").in("zone_id", zoneIds),
      // Service SKUs for duration/category mapping
      sb.from("service_skus").select("id, category, duration_minutes").eq("status", "active"),
      // Currently snoozed recommendations (don't re-create)
      sb.from("zone_state_recommendations").select("zone_id, category, snoozed_until").eq("status", "snoozed"),
    ]);

    const subs = subsRes.data ?? [];
    const zcProviders = zcpRes.data ?? [];
    const jobs = jobsRes.data ?? [];
    const waitlistEntries = waitlistRes.data ?? [];
    const skus = skusRes.data ?? [];
    const snoozedRecs = snoozedRes.data ?? [];

    // ── Build lookup maps ──

    // Subscriptions by zone (count as demand proxy)
    const subsByZone: Record<string, number> = {};
    subs.forEach((s: any) => {
      if (s.zone_id) subsByZone[s.zone_id] = (subsByZone[s.zone_id] || 0) + 1;
    });

    // Providers by (zone, category) — count of active qualified providers
    const providersByZC: Record<string, Set<string>> = {};
    zcProviders.forEach((p: any) => {
      const key = `${p.zone_id}::${p.category}`;
      if (!providersByZC[key]) providersByZC[key] = new Set();
      providersByZC[key].add(p.provider_org_id);
    });

    // Average duration per category from SKUs
    const durationByCategory: Record<string, number> = {};
    const skuCountByCategory: Record<string, number> = {};
    skus.forEach((s: any) => {
      const cat = s.category || s.provider_category;
      if (cat) {
        durationByCategory[cat] = (durationByCategory[cat] || 0) + (s.duration_minutes || 30);
        skuCountByCategory[cat] = (skuCountByCategory[cat] || 0) + 1;
      }
    });
    for (const cat of Object.keys(durationByCategory)) {
      durationByCategory[cat] = durationByCategory[cat] / (skuCountByCategory[cat] || 1);
    }

    // Waitlist by (zone, category)
    const waitlistByZC: Record<string, number> = {};
    waitlistEntries.forEach((w: any) => {
      if (w.zone_id && w.category) {
        const key = `${w.zone_id}::${w.category}`;
        waitlistByZC[key] = (waitlistByZC[key] || 0) + 1;
      }
    });

    // Jobs quality metrics by zone (simple: late = completed after latest_start_by, no-show = NO_SHOW status)
    const jobMetricsByZone: Record<string, { total: number; noShows: number; rescheduled: number }> = {};
    jobs.forEach((j: any) => {
      if (!j.zone_id) return;
      if (!jobMetricsByZone[j.zone_id]) jobMetricsByZone[j.zone_id] = { total: 0, noShows: 0, rescheduled: 0 };
      jobMetricsByZone[j.zone_id].total++;
      if (j.status === "NO_SHOW") jobMetricsByZone[j.zone_id].noShows++;
      if (j.status === "RESCHEDULED") jobMetricsByZone[j.zone_id].rescheduled++;
    });

    // Snoozed set — skip if still snoozed
    const snoozedSet = new Set<string>();
    const now = new Date();
    snoozedRecs.forEach((r: any) => {
      if (r.snoozed_until && new Date(r.snoozed_until) > now) {
        snoozedSet.add(`${r.zone_id}::${r.category}`);
      }
    });

    // ── Compute recommendations ──
    let recsCreated = 0;
    let recsSkipped = 0;
    const recommendations: any[] = [];

    for (const state of states as StateRow[]) {
      const zcKey = `${state.zone_id}::${state.category}`;

      // Skip if snoozed
      if (snoozedSet.has(zcKey)) {
        recsSkipped++;
        continue;
      }

      // Check if locked (locked_until in future)
      const isLocked = state.locked_until ? new Date(state.locked_until) > now : false;

      // Days since last state change
      let daysSinceLastChange: number | null = null;
      if (state.last_state_change_at) {
        daysSinceLastChange = (now.getTime() - new Date(state.last_state_change_at).getTime()) / 86400000;
      }

      // ── Compute metrics ──
      const activeSubs = subsByZone[state.zone_id] || 0;
      const avgDuration = durationByCategory[state.category] || 30;
      // v1 proxy: demand = active_customers × avg_minutes × 2 weeks / 7 (14-day horizon)
      const demandMinutes = activeSubs * avgDuration * 2; // 2 weeks

      const providerSet = providersByZC[zcKey];
      const qualifiedProviderCount = providerSet ? providerSet.size : 0;
      // v1 proxy: supply = providers × 8hrs/day × 5 days × 2 weeks = providers × 4800 min
      const supplyMinutes = qualifiedProviderCount * 480 * 5 * 2;

      const utilization = supplyMinutes > EPSILON ? demandMinutes / supplyMinutes : (demandMinutes > 0 ? 1.0 : 0);

      // v1 coverage risk: simple — if providers < min, risk = 1 - providers/min
      const coverageRisk = qualifiedProviderCount >= thresholds.min_providers_to_open
        ? 0
        : 1 - (qualifiedProviderCount / Math.max(thresholds.min_providers_to_open, 1));

      const waitlistCount = waitlistByZC[zcKey] || 0;

      // Quality metrics
      const jm = jobMetricsByZone[state.zone_id];
      const noShowRate = jm && jm.total > 0 ? jm.noShows / jm.total : null;
      const rescheduleRate = jm && jm.total > 0 ? jm.rescheduled / jm.total : null;

      const metrics: ZoneCategoryMetrics = {
        demand_minutes: Math.round(demandMinutes),
        supply_minutes: Math.round(supplyMinutes),
        utilization: Math.round(utilization * 1000) / 1000,
        qualified_provider_count: qualifiedProviderCount,
        coverage_risk: Math.round(coverageRisk * 1000) / 1000,
        active_subscriptions: activeSubs,
        waitlist_count: waitlistCount,
        late_rate: null,
        reschedule_rate: rescheduleRate !== null ? Math.round(rescheduleRate * 1000) / 1000 : null,
        no_show_rate: noShowRate !== null ? Math.round(noShowRate * 1000) / 1000 : null,
      };

      const result = computeRecommendation(
        state.status,
        metrics,
        thresholds,
        daysSinceLastChange,
        isLocked,
      );

      if (result.recommendedState) {
        const recIdempotencyKey = `${idempotencyKey}::${zcKey}`;

        recommendations.push({
          zone_id: state.zone_id,
          category: state.category,
          current_state: state.status,
          recommended_state: result.recommendedState,
          confidence: result.confidence,
          reasons: result.reasons,
          metrics_snapshot: metrics,
          status: "pending",
          idempotency_key: recIdempotencyKey,
        });
      }
    }

    // ── Supersede old pending recommendations for same (zone, category) ──
    if (recommendations.length > 0) {
      const zcPairs = recommendations.map((r: any) => `${r.zone_id}::${r.category}`);
      // Get existing pending recs
      const { data: existingPending } = await sb
        .from("zone_state_recommendations")
        .select("id, zone_id, category")
        .eq("status", "pending");

      const toSupersede = (existingPending ?? []).filter((ep: any) =>
        zcPairs.includes(`${ep.zone_id}::${ep.category}`)
      );

      if (toSupersede.length > 0) {
        await sb
          .from("zone_state_recommendations")
          .update({ status: "superseded", updated_at: new Date().toISOString() })
          .in("id", toSupersede.map((s: any) => s.id));
      }

      // Insert new recommendations (upsert by idempotency_key)
      for (const rec of recommendations) {
        const { error } = await sb
          .from("zone_state_recommendations")
          .upsert(rec, { onConflict: "idempotency_key" });

        if (!error) recsCreated++;
      }
    }

    const summary = {
      recommendations_created: recsCreated,
      recommendations_skipped_snoozed: recsSkipped,
      zone_category_pairs_evaluated: states.length,
      run_date: today,
    };

    await sb.from("cron_run_log").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      result_summary: summary,
    }).eq("id", runId);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    if (runId) {
      await sb.from("cron_run_log").update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: (err as Error).message,
      }).eq("id", runId);
    }

    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
