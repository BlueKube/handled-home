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
  // VRPTW fields
  windowStartMinutes: number | null; // hard window start (minutes from midnight)
  windowEndMinutes: number | null;   // hard window end
  isWindowed: boolean;
  piggybackedOntoVisitId: string | null;
  serviceWeekEnd: string | null; // for due-status computation
}

interface BlockedWindow {
  startMinutes: number;
  endMinutes: number;
}

interface Segment {
  startMinutes: number;
  endMinutes: number;
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
  return Math.max(totalTask - setupDiscount, totalTask * 0.5);
}

// ── Build segments from work window minus blocked windows ──

function buildSegments(workStart: number, workEnd: number, blocked: BlockedWindow[]): Segment[] {
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
  return segments.filter((s) => s.endMinutes - s.startMinutes >= 15);
}

// ── VRPTW feasibility simulation ──
// Simulates the route sequentially. Returns null if feasible, or a description of the first violation.
// Also returns per-stop arrival times.

interface SimResult {
  feasible: boolean;
  violation: string | null;
  arrivals: number[]; // arrival minute for each stop in order
  finishMinute: number;
}

function simulateRoute(
  order: number[],
  stops: Stop[],
  homeLat: number,
  homeLng: number,
  workStartMinutes: number,
  segments: Segment[],
): SimResult {
  const arrivals: number[] = [];
  let curLat = homeLat;
  let curLng = homeLng;
  let currentTime = segments.length > 0 ? segments[0].startMinutes : workStartMinutes;
  let segIdx = 0;

  for (const idx of order) {
    const stop = stops[idx];
    const travel = driveMinutes(curLat, curLng, stop.lat, stop.lng);
    currentTime += travel;

    // Advance past blocked segments
    if (segments.length > 0 && segIdx < segments.length) {
      if (currentTime >= segments[segIdx].endMinutes) {
        segIdx++;
        if (segIdx < segments.length) {
          currentTime = Math.max(currentTime, segments[segIdx].startMinutes);
        }
      }
    }

    // VRPTW: if stop has a hard window, wait until window opens
    if (stop.isWindowed && stop.windowStartMinutes !== null) {
      currentTime = Math.max(currentTime, stop.windowStartMinutes);
    }

    // VRPTW: check if arrival is past window end (with late grace) → infeasible
    if (stop.isWindowed && stop.windowEndMinutes !== null) {
      if (currentTime > stop.windowEndMinutes) {
        return {
          feasible: false,
          violation: `Visit ${stop.visitId} arrives at min ${currentTime.toFixed(0)} but window closes at ${stop.windowEndMinutes}`,
          arrivals,
          finishMinute: currentTime,
        };
      }
    }

    arrivals.push(currentTime);
    currentTime += stop.stopDurationMinutes;
    curLat = stop.lat;
    curLng = stop.lng;
  }

  return { feasible: true, violation: null, arrivals, finishMinute: currentTime };
}

// ── Windowed-first sequencing heuristic (PRD Section D) ──
// 1. Separate windowed stops (sorted by window_start) and flexible stops
// 2. Place windowed stops in window_start order
// 3. Insert flexible stops at cheapest-insertion position while maintaining feasibility
// 4. Piggybacked stops are inserted immediately after their parent

function windowedFirstSequence(
  stops: Stop[],
  homeLat: number,
  homeLng: number,
  workStartMinutes: number,
  segments: Segment[],
): number[] {
  // Separate indices
  const windowedIndices: number[] = [];
  const flexibleIndices: number[] = [];
  const piggybackMap = new Map<string, number[]>(); // parentVisitId → child indices

  for (let i = 0; i < stops.length; i++) {
    if (stops[i].piggybackedOntoVisitId) {
      const children = piggybackMap.get(stops[i].piggybackedOntoVisitId!) ?? [];
      children.push(i);
      piggybackMap.set(stops[i].piggybackedOntoVisitId!, children);
    } else if (stops[i].isWindowed) {
      windowedIndices.push(i);
    } else {
      flexibleIndices.push(i);
    }
  }

  // Sort windowed by window start
  windowedIndices.sort((a, b) => (stops[a].windowStartMinutes ?? 0) - (stops[b].windowStartMinutes ?? 0));

  // Start with windowed stops, inserting piggybacked children after parents
  const order: number[] = [];
  for (const wi of windowedIndices) {
    order.push(wi);
    const children = piggybackMap.get(stops[wi].visitId) ?? [];
    for (const c of children) order.push(c);
  }

  // Insert flexible stops at cheapest position
  for (const fi of flexibleIndices) {
    // Also check if this flexible stop has piggybacked children
    const children = piggybackMap.get(stops[fi].visitId) ?? [];

    let bestPos = order.length; // default: append
    let bestCost = Infinity;

    for (let pos = 0; pos <= order.length; pos++) {
      // Try inserting at this position
      const candidate = [...order];
      candidate.splice(pos, 0, fi, ...children);

      const sim = simulateRoute(candidate, stops, homeLat, homeLng, workStartMinutes, segments);
      if (!sim.feasible) continue;

      // Cost = total travel in this ordering (simple proxy)
      let travelCost = 0;
      let pLat = homeLat, pLng = homeLng;
      for (const idx of candidate) {
        travelCost += driveMinutes(pLat, pLng, stops[idx].lat, stops[idx].lng);
        pLat = stops[idx].lat;
        pLng = stops[idx].lng;
      }

      if (travelCost < bestCost) {
        bestCost = travelCost;
        bestPos = pos;
      }
    }

    order.splice(bestPos, 0, fi, ...children);
  }

  return order;
}

// ── Route cost function (extended with VRPTW window violation penalty) ──

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
  let currentTime = segments.length > 0 ? segments[0].startMinutes : workStartMinutes;
  let windowViolation = 0;
  let segIdx = 0;

  for (const idx of order) {
    const stop = stops[idx];
    const travel = driveMinutes(curLat, curLng, stop.lat, stop.lng);
    totalTravel += travel;
    currentTime += travel;

    // Segment transitions
    if (segments.length > 0 && segIdx < segments.length) {
      if (currentTime >= segments[segIdx].endMinutes) {
        segIdx++;
        if (segIdx < segments.length) {
          currentTime = Math.max(currentTime, segments[segIdx].startMinutes);
        }
      }
    }

    // VRPTW: wait for window
    if (stop.isWindowed && stop.windowStartMinutes !== null) {
      currentTime = Math.max(currentTime, stop.windowStartMinutes);
    }

    // VRPTW: penalize late arrival (with late_grace_minutes tolerance)
    if (stop.isWindowed && stop.windowEndMinutes !== null) {
      const graceEnd = stop.windowEndMinutes + dials.late_grace_minutes;
      if (currentTime > graceEnd) {
        windowViolation += (currentTime - graceEnd);
      }
    }

    currentTime += stop.stopDurationMinutes;
    curLat = stop.lat;
    curLng = stop.lng;
  }

  // Drive home
  if (order.length > 0) {
    const lastStop = stops[order[order.length - 1]];
    totalTravel += driveMinutes(lastStop.lat, lastStop.lng, homeLat, homeLng);
  }

  const overtime = Math.max(0, currentTime - workEndMinutes);

  // Reorder thrash
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

// ── Constrained 2-opt: never break VRPTW feasibility or piggyback adjacency ──

/** Check that every piggybacked stop is immediately after its parent */
function piggybackAdjacencyValid(order: number[], stops: Stop[]): boolean {
  for (let pos = 0; pos < order.length; pos++) {
    const stop = stops[order[pos]];
    if (stop.piggybackedOntoVisitId) {
      // Parent must be at pos - 1
      if (pos === 0) return false;
      const prev = stops[order[pos - 1]];
      if (prev.visitId !== stop.piggybackedOntoVisitId) return false;
    }
  }
  return true;
}

function constrainedTwoOptImprove(
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
      if (stops[best[i]].scheduleState === "in_progress") continue;

      for (let j = i + 1; j < best.length; j++) {
        if (stops[best[j]].scheduleState === "in_progress") continue;

        const candidate = [...best];
        const reversed = candidate.splice(i, j - i + 1).reverse();
        candidate.splice(i, 0, ...reversed);

        // Gate 1: piggyback adjacency must hold
        if (!piggybackAdjacencyValid(candidate, stops)) continue;

        // Gate 2: VRPTW feasibility
        const sim = simulateRoute(candidate, stops, homeLat, homeLng, workStartMinutes, segments);
        if (!sim.feasible) continue;

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

// ── Infeasibility repair (PRD Section E) ──
// If route is infeasible: try dropping flexible stops one at a time (most expensive first)
// Returns repaired order + list of dropped visit IDs

function attemptInfeasibilityRepair(
  order: number[],
  stops: Stop[],
  homeLat: number,
  homeLng: number,
  workStartMinutes: number,
  segments: Segment[],
): { repairedOrder: number[]; droppedVisitIds: string[] } {
  const droppedVisitIds: string[] = [];

  // Find flexible (non-windowed, non-in_progress) stops in the order
  const flexiblePositions = order
    .map((idx, pos) => ({ idx, pos }))
    .filter(({ idx }) => !stops[idx].isWindowed && stops[idx].scheduleState !== "in_progress");

  // Try dropping each one (greedily, most travel-expensive first)
  // Sort by how much travel they add
  const withCost = flexiblePositions.map(({ idx, pos }) => {
    const prevLat = pos > 0 ? stops[order[pos - 1]].lat : homeLat;
    const prevLng = pos > 0 ? stops[order[pos - 1]].lng : homeLng;
    const nextLat = pos < order.length - 1 ? stops[order[pos + 1]].lat : homeLat;
    const nextLng = pos < order.length - 1 ? stops[order[pos + 1]].lng : homeLng;
    const detour = driveMinutes(prevLat, prevLng, stops[idx].lat, stops[idx].lng) +
      driveMinutes(stops[idx].lat, stops[idx].lng, nextLat, nextLng) -
      driveMinutes(prevLat, prevLng, nextLat, nextLng);
    return { idx, detour };
  });

  withCost.sort((a, b) => b.detour - a.detour);

  let currentOrder = [...order];
  for (const { idx } of withCost) {
    const sim = simulateRoute(currentOrder, stops, homeLat, homeLng, workStartMinutes, segments);
    if (sim.feasible) break;

    // Drop this stop
    currentOrder = currentOrder.filter((i) => i !== idx);
    droppedVisitIds.push(stops[idx].visitId);
  }

  return { repairedOrder: currentOrder, droppedVisitIds };
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

    // Segment transitions
    if (segments.length > 0 && segIdx < segments.length) {
      if (currentTime >= segments[segIdx].endMinutes) {
        segIdx++;
        if (segIdx < segments.length) {
          currentTime = Math.max(currentTime, segments[segIdx].startMinutes);
        }
      }
    }

    // VRPTW: wait for window
    if (stop.isWindowed && stop.windowStartMinutes !== null) {
      currentTime = Math.max(currentTime, stop.windowStartMinutes);
    }

    const arrivalMinutes = currentTime;

    // For windowed stops, ETA range is the window itself (more precise)
    let etaStartMinutes: number;
    let etaEndMinutes: number;

    if (stop.isWindowed && stop.windowStartMinutes !== null && stop.windowEndMinutes !== null) {
      etaStartMinutes = stop.windowStartMinutes;
      etaEndMinutes = stop.windowEndMinutes;
    } else {
      // Progressive widening for flexible stops
      let halfRange: number;
      if (pos < 2) {
        halfRange = dials.base_range_minutes / 2;
      } else if (pos < 5) {
        halfRange = dials.base_range_minutes / 2 + dials.increment_per_bucket;
      } else {
        halfRange = dials.base_range_minutes / 2 + 2 * dials.increment_per_bucket;
      }
      etaStartMinutes = Math.max(0, arrivalMinutes - halfRange);
      etaEndMinutes = arrivalMinutes + halfRange;
    }

    const baseDate = new Date(dateStr + "T00:00:00Z");
    const plannedArrival = new Date(baseDate.getTime() + arrivalMinutes * 60000).toISOString();
    const etaStart = new Date(baseDate.getTime() + etaStartMinutes * 60000).toISOString();
    const etaEnd = new Date(baseDate.getTime() + etaEndMinutes * 60000).toISOString();

    results.push({ visitId: stop.visitId, plannedArrival, etaStart, etaEnd });

    currentTime += stop.stopDurationMinutes;
    curLat = stop.lat;
    curLng = stop.lng;
  }

  return results;
}

// ── Due-status computation for service-week visits ──

function computeDueStatus(serviceWeekEnd: string | null, scheduledDate: string): string | null {
  if (!serviceWeekEnd) return null;
  const now = new Date();
  const weekEnd = new Date(serviceWeekEnd + "T23:59:59Z");
  const hoursUntilDue = (weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilDue < 0) return "overdue";
  if (hoursUntilDue <= 48) return "due_soon";
  return null;
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

  // Idempotency check
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
        .select("id, property_id, scheduled_date, schedule_state, provider_org_id, route_order, plan_window, time_window_start, time_window_end, scheduling_profile, piggybacked_onto_visit_id, service_week_end, due_status")
        .gte("scheduled_date", horizonStartStr)
        .lte("scheduled_date", horizonEndStr)
        .in("schedule_state", ["scheduled", "dispatched", "in_progress"])
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
    const providerDays = new Map<string, any[]>();
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
    let repairedCount = 0;
    const sequenceRunRecords: any[] = [];
    const dueStatusUpdates: { id: string; due_status: string | null }[] = [];
    const droppedVisits: { visitId: string; providerOrgId: string; date: string }[] = [];

    for (const [key, dayVisits] of providerDays) {
      const [providerOrgId, dateStr] = key.split(":");
      const provider = providerMap.get(providerOrgId);
      if (!provider?.home_lat || !provider?.home_lng) continue;

      const workWindow = getWorkWindow(provider.working_hours, dateStr);
      if (!workWindow) continue;

      totalProviderDays++;

      const blocked = blockedByProviderDay.get(key) ?? [];
      const segments = buildSegments(workWindow.start, workWindow.end, blocked);

      // Build stops with VRPTW fields
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

        const equipment = new Set<string>();
        for (const t of tasks) {
          const sku = skuMap.get(t.sku_id);
          if (sku?.required_equipment) {
            for (const eq of sku.required_equipment) {
              equipment.add(eq);
            }
          }
        }

        // Parse time windows (DB `time` type → "HH:MM:SS" strings)
        const hasWindow = !!(v.time_window_start && v.time_window_end);
        const windowStartMin = hasWindow ? parseTimeToMinutes(v.time_window_start) : null;
        const windowEndMin = hasWindow ? parseTimeToMinutes(v.time_window_end) : null;

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
          windowStartMinutes: windowStartMin,
          windowEndMinutes: windowEndMin,
          isWindowed: hasWindow,
          piggybackedOntoVisitId: v.piggybacked_onto_visit_id,
          serviceWeekEnd: v.service_week_end,
        });

        // Compute due status for service-week visits
        if (v.scheduling_profile === "service_week") {
          const newDueStatus = computeDueStatus(v.service_week_end, v.scheduled_date);
          if (newDueStatus !== v.due_status) {
            dueStatusUpdates.push({ id: v.id, due_status: newDueStatus });
          }
        }
      }

      if (stops.length === 0) continue;

      // Build prior order map for thrash detection
      const priorOrder = new Map<string, number>();
      for (const s of stops) {
        if (s.previousRouteOrder !== null) {
          priorOrder.set(s.visitId, s.previousRouteOrder);
        }
      }

      // Use windowed-first heuristic if any windowed stops exist
      const hasWindowedStops = stops.some((s) => s.isWindowed);
      let order: number[];

      if (hasWindowedStops) {
        order = windowedFirstSequence(stops, provider.home_lat, provider.home_lng, workWindow.start, segments);
      } else {
        // Fall back to nearest-neighbor for all-flexible routes
        order = nearestNeighborOrder(stops, provider.home_lat, provider.home_lng);
      }

      // Constrained 2-opt improvement (respects VRPTW feasibility)
      if (stops.length > 2) {
        order = constrainedTwoOptImprove(
          order, stops, provider.home_lat, provider.home_lng,
          workWindow.end, workWindow.start, segments, dials,
          priorOrder.size > 0 ? priorOrder : null
        );
      }

      // VRPTW feasibility check
      let sim = simulateRoute(order, stops, provider.home_lat, provider.home_lng, workWindow.start, segments);

      // Infeasibility repair if needed
      let repairDropped: string[] = [];
      if (!sim.feasible) {
        const repair = attemptInfeasibilityRepair(order, stops, provider.home_lat, provider.home_lng, workWindow.start, segments);
        order = repair.repairedOrder;
        repairDropped = repair.droppedVisitIds;
        sim = simulateRoute(order, stops, provider.home_lat, provider.home_lng, workWindow.start, segments);

        if (repairDropped.length > 0) {
          repairedCount++;
          for (const vid of repairDropped) {
            droppedVisits.push({ visitId: vid, providerOrgId, date: dateStr });
          }
        }
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

      const totalServiceMinutes = stops.reduce((sum, s) => sum + s.stopDurationMinutes, 0);

      // Overall feasibility (including time capacity)
      const totalAvailableMinutes = segments.reduce((sum, seg) => sum + (seg.endMinutes - seg.startMinutes), 0);
      const totalNeeded = totalServiceMinutes + costResult.totalTravel;
      const isFeasible = sim.feasible && totalNeeded <= totalAvailableMinutes * 1.15;
      const infeasibleReason = !isFeasible
        ? sim.violation ?? `Need ${totalNeeded.toFixed(0)}min but only ${totalAvailableMinutes}min available (${stops.length} stops, ${costResult.totalTravel.toFixed(0)}min travel)`
        : null;

      if (!isFeasible) infeasibleCount++;

      // ── Write results to visits ──
      for (let pos = 0; pos < order.length; pos++) {
        const stop = stops[order[pos]];
        const eta = etas[pos];

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

      // Mark dropped visits as needing reassignment
      for (const vid of repairDropped) {
        await supabase
          .from("visits")
          .update({
            schedule_state: "exception_pending",
            unassigned_reason: "Dropped from route during infeasibility repair — needs reassignment",
            updated_at: new Date().toISOString(),
          })
          .eq("id", vid);
      }

      totalStopsProcessed += stops.length;

      const lastEta = etas[etas.length - 1];
      const lastStop = stops[order[order.length - 1]];
      const finishTime = lastEta
        ? new Date(new Date(lastEta.plannedArrival).getTime() + lastStop.stopDurationMinutes * 60000).toISOString()
        : null;

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
          window_violation_minutes: costResult.windowViolation,
          windowed_stops: stops.filter((s) => s.isWindowed).length,
          piggybacked_stops: stops.filter((s) => s.piggybackedOntoVisitId).length,
          segments: segments.length,
          blocked_windows: blocked.length,
          repair_dropped: repairDropped.length,
        },
      });

      // Flag infeasible routes
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
              repair_dropped: repairDropped,
            },
          });
        } catch (notifErr) {
          console.error(`Failed to emit infeasible notification for ${key}:`, notifErr);
        }
      }
    }

    // ── Update due statuses in batch ──
    for (const u of dueStatusUpdates) {
      await supabase
        .from("visits")
        .update({ due_status: u.due_status, updated_at: new Date().toISOString() })
        .eq("id", u.id);
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
            repaired_count: repairedCount,
            due_status_updates: dueStatusUpdates.length,
            dropped_visits: droppedVisits.length,
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
        repaired_count: repairedCount,
        due_status_updates: dueStatusUpdates.length,
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

// ── Nearest-neighbor (fallback for all-flexible routes) ──

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
