import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──

interface ConfigDials {
  setup_base_minutes: number;
  setup_cap_minutes: number;
  split_penalty_minutes: number;
  min_improvement_minutes: number;
  min_improvement_percent: number;
  overtime_weight: number;
  window_violation_weight: number;
  reorder_thrash_weight: number;
  split_penalty_weight: number;
  base_range_minutes: number;
  increment_per_bucket: number;
  late_grace_minutes: number;
  default_task_minutes: number;
}

interface Stop {
  visitId: string;
  propertyId: string;
  lat: number;
  lng: number;
  taskMinutes: number;
  stopDurationMinutes: number;
  taskCount: number;
  requiredEquipment: string[];
  previousRouteOrder: number | null;
  scheduleState: string;
}

interface BlockedWindow {
  startMinutes: number; // minutes from midnight
  endMinutes: number;
}

interface Segment {
  startMinutes: number;
  endMinutes: number;
}

interface ProviderDayContext {
  providerOrgId: string;
  homeLat: number;
  homeLng: number;
  workStartMinutes: number;
  workEndMinutes: number;
  blockedWindows: BlockedWindow[];
  segments: Segment[];
  stops: Stop[];
}

// ── Geo helpers ──

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const CITY_MULTIPLIER = 1.4;
const AVG_SPEED_KMH = 35;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function driveMinutes(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const km = haversineKm(lat1, lng1, lat2, lng2) * CITY_MULTIPLIER;
  return (km / AVG_SPEED_KMH) * 60;
}

// ── Time helpers ──

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function getWorkWindow(workingHours: any, date: string): { start: number; end: number } | null {
  const d = new Date(date + "T12:00:00Z");
  const dayName = DAY_NAMES[d.getUTCDay()];
  const dayHours = workingHours?.[dayName];
  if (!dayHours?.start || !dayHours?.end) return null;
  return {
    start: parseTimeToMinutes(dayHours.start),
    end: parseTimeToMinutes(dayHours.end),
  };
}

// ── Bundling: compute stop duration with setup discount ──

function computeStopDuration(taskMinutes: number[], dials: ConfigDials): number {
  const totalTask = taskMinutes.reduce((a, b) => a + b, 0);
  if (taskMinutes.length <= 1) return totalTask;
  const setupDiscount = Math.min(
    dials.setup_cap_minutes,
    dials.setup_base_minutes * (taskMinutes.length - 1)
  );
  return Math.max(totalTask - setupDiscount, totalTask * 0.5); // never discount below 50%
}

// ── Build segments from work window minus blocked windows ──

function buildSegments(workStart: number, workEnd: number, blocked: BlockedWindow[]): Segment[] {
  // Sort blocked by start
  const sorted = [...blocked].sort((a, b) => a.startMinutes - b.startMinutes);
  const segments: Segment[] = [];
  let cursor = workStart;

  for (const bw of sorted) {
    if (bw.startMinutes > cursor && bw.startMinutes < workEnd) {
      segments.push({ startMinutes: cursor, endMinutes: Math.min(bw.startMinutes, workEnd) });
    }
    cursor = Math.max(cursor, bw.endMinutes);
  }
  if (cursor < workEnd) {
    segments.push({ startMinutes: cursor, endMinutes: workEnd });
  }
  return segments.filter((s) => s.endMinutes - s.startMinutes >= 15); // drop tiny gaps
}

// ── Nearest-neighbor initial ordering ──

function nearestNeighborOrder(stops: Stop[], startLat: number, startLng: number): number[] {
  if (stops.length === 0) return [];
  const remaining = stops.map((_, i) => i);
  const ordered: number[] = [];
  let curLat = startLat;
  let curLng = startLng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const s = stops[remaining[i]];
      const d = driveMinutes(curLat, curLng, s.lat, s.lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    curLat = stops[next].lat;
    curLng = stops[next].lng;
  }
  return ordered;
}

// ── Route cost function ──

function computeRouteCost(
  order: number[],
  stops: Stop[],
  homeLat: number,
  homeLng: number,
  workEndMinutes: number,
  workStartMinutes: number,
  segments: Segment[],
  dials: ConfigDials,
  priorOrder: Map<string, number> | null,
): { totalTravel: number; cost: number; overtime: number; windowViolation: number; thrash: number } {
  let totalTravel = 0;
  let curLat = homeLat;
  let curLng = homeLng;
  let currentTime = workStartMinutes;
  let windowViolation = 0;

  // Track segment transitions
  let segIdx = 0;
  if (segments.length > 0) {
    currentTime = segments[0].startMinutes;
  }

  for (const idx of order) {
    const stop = stops[idx];
    const travel = driveMinutes(curLat, curLng, stop.lat, stop.lng);
    totalTravel += travel;
    currentTime += travel;

    // Check if we've hit a blocked window — skip to next segment
    if (segments.length > 0 && segIdx < segments.length) {
      if (currentTime >= segments[segIdx].endMinutes) {
        segIdx++;
        if (segIdx < segments.length) {
          currentTime = Math.max(currentTime, segments[segIdx].startMinutes);
        }
      }
    }

    // Window violation: if visit has a plan_window we'd check it here
    // For v1, no per-visit windows — skip

    currentTime += stop.stopDurationMinutes;
    curLat = stop.lat;
    curLng = stop.lng;
  }

  // Add drive home
  if (order.length > 0) {
    const lastStop = stops[order[order.length - 1]];
    totalTravel += driveMinutes(lastStop.lat, lastStop.lng, homeLat, homeLng);
  }

  const totalWorkMinutes = workEndMinutes - workStartMinutes;
  const overtime = Math.max(0, currentTime - workEndMinutes);

  // Reorder thrash: count how many stops moved position vs prior night
  let thrash = 0;
  if (priorOrder) {
    for (let pos = 0; pos < order.length; pos++) {
      const visitId = stops[order[pos]].visitId;
      const priorPos = priorOrder.get(visitId);
      if (priorPos !== undefined && priorPos !== pos + 1) {
        thrash++;
      }
    }
  }

  const cost =
    totalTravel +
    dials.overtime_weight * overtime +
    dials.window_violation_weight * windowViolation +
    dials.reorder_thrash_weight * thrash;

  return { totalTravel, cost, overtime, windowViolation, thrash };
}

// ── 2-opt improvement ──

function twoOptImprove(
  order: number[],
  stops: Stop[],
  homeLat: number,
  homeLng: number,
  workEndMinutes: number,
  workStartMinutes: number,
  segments: Segment[],
  dials: ConfigDials,
  priorOrder: Map<string, number> | null,
): number[] {
  let best = [...order];
  let bestCost = computeRouteCost(best, stops, homeLat, homeLng, workEndMinutes, workStartMinutes, segments, dials, priorOrder).cost;
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < best.length - 1; i++) {
      // Don't move stops that are in_progress (pinned)
      if (stops[best[i]].scheduleState === "in_progress") continue;

      for (let j = i + 1; j < best.length; j++) {
        if (stops[best[j]].scheduleState === "in_progress") continue;

        // Reverse segment between i and j
        const candidate = [...best];
        const reversed = candidate.splice(i, j - i + 1).reverse();
        candidate.splice(i, 0, ...reversed);

        const candidateCostResult = computeRouteCost(
          candidate, stops, homeLat, homeLng, workEndMinutes, workStartMinutes, segments, dials, priorOrder
        );

        const improvement = bestCost - candidateCostResult.cost;
        const improvementPercent = bestCost > 0 ? (improvement / bestCost) * 100 : 0;

        if (
          improvement >= dials.min_improvement_minutes &&
          improvementPercent >= dials.min_improvement_percent
        ) {
          best = candidate;
          bestCost = candidateCostResult.cost;
          improved = true;
        }
      }
    }
  }

  return best;
}

// ── ETA range computation ──

function computeEtaRanges(
  order: number[],
  stops: Stop[],
  homeLat: number,
  homeLng: number,
  workStartMinutes: number,
  segments: Segment[],
  dials: ConfigDials,
  dateStr: string,
): { visitId: string; plannedArrival: string; etaStart: string; etaEnd: string }[] {
  const results: { visitId: string; plannedArrival: string; etaStart: string; etaEnd: string }[] = [];
  let curLat = homeLat;
  let curLng = homeLng;
  let currentTime = segments.length > 0 ? segments[0].startMinutes : workStartMinutes;
  let segIdx = 0;

  for (let pos = 0; pos < order.length; pos++) {
    const stop = stops[order[pos]];
    const travel = driveMinutes(curLat, curLng, stop.lat, stop.lng);
    currentTime += travel;

    // Check segment transitions
    if (segments.length > 0 && segIdx < segments.length) {
      if (currentTime >= segments[segIdx].endMinutes) {
        segIdx++;
        if (segIdx < segments.length) {
          currentTime = Math.max(currentTime, segments[segIdx].startMinutes);
        }
      }
    }

    const arrivalMinutes = currentTime;

    // ETA range width based on stop position bucket
    let halfRange: number;
    if (pos < 2) {
      halfRange = dials.base_range_minutes / 2;
    } else if (pos < 5) {
      halfRange = dials.base_range_minutes / 2 + dials.increment_per_bucket;
    } else {
      halfRange = dials.base_range_minutes / 2 + 2 * dials.increment_per_bucket;
    }

    const etaStartMinutes = Math.max(0, arrivalMinutes - halfRange);
    const etaEndMinutes = arrivalMinutes + halfRange;

    // Convert minutes to ISO timestamp
    const baseDate = new Date(dateStr + "T00:00:00Z");
    const plannedArrival = new Date(baseDate.getTime() + arrivalMinutes * 60000).toISOString();
    const etaStart = new Date(baseDate.getTime() + etaStartMinutes * 60000).toISOString();
    const etaEnd = new Date(baseDate.getTime() + etaEndMinutes * 60000).toISOString();

    results.push({
      visitId: stop.visitId,
      plannedArrival,
      etaStart,
      etaEnd,
    });

    currentTime += stop.stopDurationMinutes;
    curLat = stop.lat;
    curLng = stop.lng;
  }

  return results;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let triggeredBy = "system";
  try {
    const body = await req.json().catch(() => ({}));
    triggeredBy = body.triggered_by ?? "system";
  } catch { /* defaults */ }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const idempotencyKey = `route-sequence:${todayStr}`;

  // Idempotency check via cron_run_log
  const { data: existingRun } = await supabase
    .from("cron_run_log")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "completed")
    .maybeSingle();

  if (existingRun) {
    return new Response(
      JSON.stringify({ ok: true, message: "Already completed today", run_id: existingRun.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: cronLog } = await supabase
    .from("cron_run_log")
    .insert({
      function_name: "route-sequence",
      idempotency_key: idempotencyKey,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    // ── Step 1: Load config dials ──
    const { data: configRows } = await supabase
      .from("assignment_config")
      .select("config_key, config_value");

    const cm = new Map<string, number>();
    for (const r of configRows ?? []) {
      cm.set(r.config_key, Number(r.config_value));
    }

    const dials: ConfigDials = {
      setup_base_minutes: cm.get("setup_base_minutes") ?? 5,
      setup_cap_minutes: cm.get("setup_cap_minutes") ?? 15,
      split_penalty_minutes: cm.get("split_penalty_minutes") ?? 20,
      min_improvement_minutes: cm.get("min_improvement_minutes") ?? 8,
      min_improvement_percent: cm.get("min_improvement_percent") ?? 7,
      overtime_weight: cm.get("overtime_weight") ?? 2.0,
      window_violation_weight: cm.get("window_violation_weight") ?? 5.0,
      reorder_thrash_weight: cm.get("reorder_thrash_weight") ?? 1.0,
      split_penalty_weight: cm.get("split_penalty_weight") ?? 1.0,
      base_range_minutes: cm.get("base_range_minutes") ?? 60,
      increment_per_bucket: cm.get("increment_per_bucket") ?? 15,
      late_grace_minutes: cm.get("late_grace_minutes") ?? 15,
      default_task_minutes: cm.get("default_task_minutes") ?? 30,
    };

    // ── Step 2: Date range — days 1-7 (scheduled horizon) ──
    const horizonStart = new Date(today);
    horizonStart.setDate(horizonStart.getDate() + 1);
    const horizonEnd = new Date(today);
    horizonEnd.setDate(horizonEnd.getDate() + 7);
    const horizonStartStr = horizonStart.toISOString().split("T")[0];
    const horizonEndStr = horizonEnd.toISOString().split("T")[0];

    // ── Step 3: Fetch data in parallel ──
    const [visitsResult, workProfilesResult, propertiesResult, skusResult, blockedResult] = await Promise.all([
      supabase
        .from("visits")
        .select("id, property_id, scheduled_date, schedule_state, provider_org_id, route_order, plan_window")
        .gte("scheduled_date", horizonStartStr)
        .lte("scheduled_date", horizonEndStr)
        .in("schedule_state", ["scheduled", "confirmed", "in_progress"])
        .not("provider_org_id", "is", null),
      supabase
        .from("provider_work_profiles")
        .select("provider_org_id, home_lat, home_lng, working_hours, equipment_kits, max_jobs_per_day"),
      supabase
        .from("properties")
        .select("id, lat, lng"),
      supabase
        .from("service_skus")
        .select("id, required_equipment, duration_minutes"),
      supabase
        .from("provider_blocked_windows")
        .select("provider_org_id, day_of_week, start_time, end_time, is_recurring, specific_date"),
    ]);

    if (visitsResult.error) throw visitsResult.error;
    if (workProfilesResult.error) throw workProfilesResult.error;
    if (propertiesResult.error) throw propertiesResult.error;
    if (skusResult.error) throw skusResult.error;
    if (blockedResult.error) throw blockedResult.error;

    const visits = visitsResult.data ?? [];
    const providers = workProfilesResult.data ?? [];
    const properties = propertiesResult.data ?? [];
    const skuData = skusResult.data ?? [];
    const blockedWindows = blockedResult.data ?? [];

    const propertyMap = new Map(properties.map((p: any) => [p.id, p]));
    const skuMap = new Map(skuData.map((s: any) => [s.id, s]));
    const providerMap = new Map(providers.map((p: any) => [p.provider_org_id, p]));

    // ── Step 4: Fetch visit tasks ──
    const visitIds = visits.map((v: any) => v.id);
    const visitTasksByVisit = new Map<string, any[]>();

    for (let i = 0; i < visitIds.length; i += 500) {
      const chunk = visitIds.slice(i, i + 500);
      const { data: tasks } = await supabase
        .from("visit_tasks")
        .select("visit_id, sku_id, duration_estimate_minutes")
        .in("visit_id", chunk)
        .not("status", "eq", "canceled");
      for (const t of tasks ?? []) {
        const list = visitTasksByVisit.get(t.visit_id) ?? [];
        list.push(t);
        visitTasksByVisit.set(t.visit_id, list);
      }
    }

    // ── Step 5: Group visits by provider × date ──
    const providerDays = new Map<string, any[]>(); // "orgId:date" → visits
    for (const v of visits) {
      if (!v.provider_org_id) continue;
      const key = `${v.provider_org_id}:${v.scheduled_date}`;
      const list = providerDays.get(key) ?? [];
      list.push(v);
      providerDays.set(key, list);
    }

    // ── Step 6: Build blocked windows lookup ──
    const blockedByProviderDay = new Map<string, BlockedWindow[]>();
    for (const bw of blockedWindows) {
      // For each date in the horizon, check if this blocked window applies
      for (let d = new Date(horizonStart); d <= horizonEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getUTCDay();
        const applies =
          (bw.is_recurring && bw.day_of_week === dayOfWeek) ||
          (!bw.is_recurring && bw.specific_date === dateStr);

        if (applies) {
          const key = `${bw.provider_org_id}:${dateStr}`;
          const list = blockedByProviderDay.get(key) ?? [];
          list.push({
            startMinutes: parseTimeToMinutes(bw.start_time),
            endMinutes: parseTimeToMinutes(bw.end_time),
          });
          blockedByProviderDay.set(key, list);
        }
      }
    }

    // ── Step 7: Process each provider-day ──
    let totalProviderDays = 0;
    let totalStopsProcessed = 0;
    let infeasibleCount = 0;
    const sequenceRunRecords: any[] = [];

    for (const [key, dayVisits] of providerDays) {
      const [providerOrgId, dateStr] = key.split(":");
      const provider = providerMap.get(providerOrgId);
      if (!provider?.home_lat || !provider?.home_lng) continue;

      const workWindow = getWorkWindow(provider.working_hours, dateStr);
      if (!workWindow) continue;

      totalProviderDays++;

      const blocked = blockedByProviderDay.get(key) ?? [];
      const segments = buildSegments(workWindow.start, workWindow.end, blocked);

      // Build stops
      const stops: Stop[] = [];
      for (const v of dayVisits) {
        const prop = propertyMap.get(v.property_id);
        if (!prop?.lat || !prop?.lng) continue;

        const tasks = visitTasksByVisit.get(v.id) ?? [];
        const taskMinutesList = tasks.map(
          (t: any) => t.duration_estimate_minutes || dials.default_task_minutes
        );
        const totalTaskMinutes = taskMinutesList.length > 0
          ? taskMinutesList.reduce((a: number, b: number) => a + b, 0)
          : dials.default_task_minutes;

        const stopDuration = computeStopDuration(taskMinutesList, dials);

        // Aggregate equipment from SKUs
        const equipment = new Set<string>();
        for (const t of tasks) {
          const sku = skuMap.get(t.sku_id);
          if (sku?.required_equipment) {
            for (const eq of sku.required_equipment) {
              equipment.add(eq);
            }
          }
        }

        stops.push({
          visitId: v.id,
          propertyId: v.property_id,
          lat: prop.lat,
          lng: prop.lng,
          taskMinutes: totalTaskMinutes,
          stopDurationMinutes: stopDuration,
          taskCount: tasks.length,
          requiredEquipment: [...equipment],
          previousRouteOrder: v.route_order,
          scheduleState: v.schedule_state,
        });
      }

      if (stops.length === 0) continue;

      // Build prior order map for thrash detection
      const priorOrder = new Map<string, number>();
      for (const s of stops) {
        if (s.previousRouteOrder !== null) {
          priorOrder.set(s.visitId, s.previousRouteOrder);
        }
      }

      // Nearest-neighbor baseline
      let order = nearestNeighborOrder(stops, provider.home_lat, provider.home_lng);

      // 2-opt improvement (skip if ≤ 2 stops)
      if (stops.length > 2) {
        order = twoOptImprove(
          order, stops, provider.home_lat, provider.home_lng,
          workWindow.end, workWindow.start, segments, dials,
          priorOrder.size > 0 ? priorOrder : null
        );
      }

      // Compute route cost for summary
      const costResult = computeRouteCost(
        order, stops, provider.home_lat, provider.home_lng,
        workWindow.end, workWindow.start, segments, dials,
        priorOrder.size > 0 ? priorOrder : null
      );

      // Compute ETAs
      const etas = computeEtaRanges(
        order, stops, provider.home_lat, provider.home_lng,
        workWindow.start, segments, dials, dateStr
      );

      // Compute total service minutes
      const totalServiceMinutes = stops.reduce((sum, s) => sum + s.stopDurationMinutes, 0);

      // Feasibility check
      const totalAvailableMinutes = segments.reduce((sum, seg) => sum + (seg.endMinutes - seg.startMinutes), 0);
      const totalNeeded = totalServiceMinutes + costResult.totalTravel;
      const isFeasible = totalNeeded <= totalAvailableMinutes * 1.15; // 15% grace
      const infeasibleReason = !isFeasible
        ? `Need ${totalNeeded.toFixed(0)}min but only ${totalAvailableMinutes}min available (${stops.length} stops, ${costResult.totalTravel.toFixed(0)}min travel)`
        : null;

      if (!isFeasible) infeasibleCount++;

      // ── Write results to visits ──
      for (let pos = 0; pos < order.length; pos++) {
        const stop = stops[order[pos]];
        const eta = etas[pos];

        // Don't reorder in_progress visits
        if (stop.scheduleState === "in_progress") continue;

        await supabase
          .from("visits")
          .update({
            route_order: pos + 1,
            stop_duration_minutes: stop.stopDurationMinutes,
            planned_arrival_time: eta.plannedArrival,
            eta_range_start: eta.etaStart,
            eta_range_end: eta.etaEnd,
            equipment_required: stop.requiredEquipment,
          })
          .eq("id", stop.visitId);
      }

      totalStopsProcessed += stops.length;

      // Estimated finish time
      const lastEta = etas[etas.length - 1];
      const lastStop = stops[order[order.length - 1]];
      const finishTime = lastEta
        ? new Date(new Date(lastEta.plannedArrival).getTime() + lastStop.stopDurationMinutes * 60000).toISOString()
        : null;

      // Create route_sequence_runs record
      sequenceRunRecords.push({
        run_date: dateStr,
        provider_org_id: providerOrgId,
        status: isFeasible ? "feasible" : "infeasible",
        total_stops: stops.length,
        total_travel_minutes: Math.round(costResult.totalTravel * 100) / 100,
        total_service_minutes: Math.round(totalServiceMinutes * 100) / 100,
        estimated_finish_time: finishTime,
        is_feasible: isFeasible,
        infeasible_reason: infeasibleReason,
        summary: {
          overtime_minutes: costResult.overtime,
          thrash_count: costResult.thrash,
          route_cost: costResult.cost,
          segments: segments.length,
          blocked_windows: blocked.length,
        },
      });

      // Flag infeasible routes via notification
      if (!isFeasible) {
        try {
          await supabase.rpc("emit_notification_event", {
            p_event_type: "ADMIN_ROUTE_INFEASIBLE",
            p_idempotency_key: `route_infeasible:${providerOrgId}:${dateStr}`,
            p_audience_type: "ADMIN",
            p_audience_org_id: null,
            p_priority: "HIGH",
            p_payload: {
              provider_org_id: providerOrgId,
              date: dateStr,
              total_stops: stops.length,
              reason: infeasibleReason,
            },
          });
        } catch (notifErr) {
          console.error(`Failed to emit infeasible notification for ${key}:`, notifErr);
        }
      }
    }

    // Batch insert route_sequence_runs
    if (sequenceRunRecords.length > 0) {
      const { error: insertErr } = await supabase
        .from("route_sequence_runs")
        .insert(sequenceRunRecords);
      if (insertErr) {
        console.error("Failed to insert route_sequence_runs:", insertErr);
      }
    }

    // Update cron log
    if (cronLog) {
      await supabase
        .from("cron_run_log")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result_summary: {
            provider_days: totalProviderDays,
            total_stops: totalStopsProcessed,
            infeasible_count: infeasibleCount,
            sequence_runs: sequenceRunRecords.length,
          },
        })
        .eq("id", cronLog.id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        provider_days: totalProviderDays,
        total_stops: totalStopsProcessed,
        infeasible_count: infeasibleCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("route-sequence error:", err);
    if (cronLog) {
      await supabase
        .from("cron_run_log")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: String(err),
        })
        .eq("id", cronLog.id);
    }
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
