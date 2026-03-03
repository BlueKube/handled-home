import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──

interface ConfigDials {
  w_distance: number;
  w_balance: number;
  w_spread: number;
  w_familiarity: number;
  w_zone_affinity: number;
  max_candidate_drive_minutes: number;
  utilization_target: number;
  default_task_minutes: number;
  reassign_min_score_delta: number;
  reassign_min_percent: number;
  freeze_strictness_multiplier: number;
  familiarity_cap_minutes: number;
  buffer_minutes: number;
}

interface ProviderProfile {
  provider_org_id: string;
  home_lat: number | null;
  home_lng: number | null;
  service_categories: string[];
  equipment_kits: string[];
  max_jobs_per_day: number;
  working_hours: any; // JSON: { monday: { start: "08:00", end: "17:00" }, ... }
}

interface Visit {
  id: string;
  property_id: string;
  scheduled_date: string;
  schedule_state: string;
  plan_window: string | null;
  provider_org_id: string | null;
  backup_provider_org_id: string | null;
  assignment_locked: boolean | null;
  assignment_score: number | null;
  assignment_run_id: string | null;
}

interface Property {
  id: string;
  lat: number | null;
  lng: number | null;
  user_id: string; // customer_id
}

interface VisitTask {
  visit_id: string;
  sku_id: string;
  duration_estimate_minutes: number;
}

interface SkuInfo {
  id: string;
  category: string;
}

interface ZoneCategoryProvider {
  provider_org_id: string;
  zone_id: string;
  category: string;
  role: string;
  status: string;
}

interface CandidateScore {
  provider_org_id: string;
  score: number;
  reasons: string[];
  breakdown: {
    distance: number;
    balance: number;
    spread: number;
    familiarity: number;
    zone_affinity: number;
  };
}

interface AssignmentResult {
  visit_id: string;
  primary_provider_org_id: string | null;
  backup_provider_org_id: string | null;
  score: number | null;
  confidence: string;
  reasons: string[];
  unassigned_reason: string | null;
  candidates: CandidateScore[];
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

function centroid(points: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

// ── Working hours helpers ──

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function getWorkMinutes(workingHours: any, date: string): number {
  const d = new Date(date + "T12:00:00Z");
  const dayName = DAY_NAMES[d.getUTCDay()];
  const dayHours = workingHours?.[dayName];
  if (!dayHours || !dayHours.start || !dayHours.end) return 0;

  const [sh, sm] = dayHours.start.split(":").map(Number);
  const [eh, em] = dayHours.end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function isWorkingDay(workingHours: any, date: string): boolean {
  return getWorkMinutes(workingHours, date) > 0;
}

// ── Confidence heuristic ──

function computeConfidence(candidateCount: number, bestScore: number, secondBestScore: number | null): string {
  if (candidateCount === 0) return "Low";
  if (candidateCount === 1) return "Low";
  const margin = secondBestScore !== null ? Math.abs(secondBestScore - bestScore) : 0;
  if (candidateCount >= 3 && margin > 5) return "High";
  if (candidateCount >= 2) return "Medium";
  return "Low";
}

// ── Main Handler ──

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
  const idempotencyKey = `assign-visits:${todayStr}`;

  // ── Step 0: Idempotency ──
  const { data: existingRun } = await supabase
    .from("assignment_runs")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingRun?.status === "completed") {
    return new Response(
      JSON.stringify({ ok: true, message: "Already completed today", run_id: existingRun.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create or reuse assignment_run
  const { data: assignmentRun, error: runErr } = await supabase
    .from("assignment_runs")
    .upsert(
      {
        idempotency_key: idempotencyKey,
        status: "running",
        triggered_by: triggeredBy,
        started_at: new Date().toISOString(),
        run_date: todayStr,
      },
      { onConflict: "idempotency_key" }
    )
    .select("id")
    .single();

  if (runErr || !assignmentRun) {
    return new Response(
      JSON.stringify({ ok: false, error: runErr?.message ?? "Failed to create assignment run" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const runId = assignmentRun.id;

  try {
    // ── Step 1: Load config dials ──
    const { data: configRows } = await supabase
      .from("assignment_config")
      .select("config_key, config_value");

    const configMap = new Map<string, number>();
    for (const row of configRows ?? []) {
      configMap.set(row.config_key, Number(row.config_value));
    }

    const dials: ConfigDials = {
      w_distance: configMap.get("w_distance") ?? 0.40,
      w_balance: configMap.get("w_balance") ?? 0.25,
      w_spread: configMap.get("w_spread") ?? 0.20,
      w_familiarity: configMap.get("w_familiarity") ?? 0.10,
      w_zone_affinity: configMap.get("w_zone_affinity") ?? 0.05,
      max_candidate_drive_minutes: configMap.get("max_candidate_drive_minutes") ?? 45,
      utilization_target: configMap.get("utilization_target") ?? 0.80,
      default_task_minutes: configMap.get("default_task_minutes") ?? 30,
      reassign_min_score_delta: configMap.get("reassign_min_score_delta") ?? 5.0,
      reassign_min_percent: configMap.get("reassign_min_percent") ?? 0.15,
      freeze_strictness_multiplier: configMap.get("freeze_strictness_multiplier") ?? 2.0,
      familiarity_cap_minutes: configMap.get("familiarity_cap_minutes") ?? 15,
      buffer_minutes: configMap.get("buffer_minutes") ?? 10,
    };

    // ── Step 2: Compute date range (14-day horizon) ──
    const horizonEnd = new Date(today);
    horizonEnd.setDate(horizonEnd.getDate() + 13);
    const horizonEndStr = horizonEnd.toISOString().split("T")[0];

    const freezeEnd = new Date(today);
    freezeEnd.setDate(freezeEnd.getDate() + 6);
    const freezeEndStr = freezeEnd.toISOString().split("T")[0];

    // ── Step 3: Fetch all data in parallel ──
    const [visitsResult, workProfilesResult, propertiesResult, skusResult, zcpResult] = await Promise.all([
      // Visits in horizon (not canceled, not locked by admin)
      supabase
        .from("visits")
        .select("id, property_id, scheduled_date, schedule_state, plan_window, provider_org_id, backup_provider_org_id, assignment_locked, assignment_score, assignment_run_id")
        .gte("scheduled_date", todayStr)
        .lte("scheduled_date", horizonEndStr)
        .not("schedule_state", "eq", "canceled"),
      // Provider work profiles
      supabase
        .from("provider_work_profiles")
        .select("provider_org_id, home_lat, home_lng, service_categories, equipment_kits, max_jobs_per_day, working_hours"),
      // All properties with coordinates
      supabase
        .from("properties")
        .select("id, lat, lng, user_id"),
      // Service SKUs for category lookup
      supabase
        .from("service_skus")
        .select("id, category"),
      // Zone-category provider assignments
      supabase
        .from("zone_category_providers")
        .select("provider_org_id, zone_id, category, role, status")
        .eq("status", "active"),
    ]);

    if (visitsResult.error) throw visitsResult.error;
    if (workProfilesResult.error) throw workProfilesResult.error;
    if (propertiesResult.error) throw propertiesResult.error;
    if (skusResult.error) throw skusResult.error;
    if (zcpResult.error) throw zcpResult.error;

    const visits = (visitsResult.data ?? []) as Visit[];
    const providers = (workProfilesResult.data ?? []) as ProviderProfile[];
    const properties = (propertiesResult.data ?? []) as Property[];
    const skus = (skusResult.data ?? []) as SkuInfo[];
    const zcps = (zcpResult.data ?? []) as ZoneCategoryProvider[];

    // Build lookup maps
    const propertyMap = new Map(properties.map((p) => [p.id, p]));
    const skuCategoryMap = new Map(skus.map((s) => [s.id, s.category]));
    const providerMap = new Map(providers.map((p) => [p.provider_org_id, p]));

    // ZCP lookup: zone:category → provider_org_ids
    const zcpByZoneCategory = new Map<string, Set<string>>();
    for (const zcp of zcps) {
      const key = `${zcp.zone_id}:${zcp.category}`;
      if (!zcpByZoneCategory.has(key)) zcpByZoneCategory.set(key, new Set());
      zcpByZoneCategory.get(key)!.add(zcp.provider_org_id);
    }

    // ── Step 4: Fetch visit tasks ──
    const visitIds = visits.map((v) => v.id);
    const visitTasksByVisit = new Map<string, VisitTask[]>();
    // Batch in chunks of 500
    for (let i = 0; i < visitIds.length; i += 500) {
      const chunk = visitIds.slice(i, i + 500);
      const { data: tasks } = await supabase
        .from("visit_tasks")
        .select("visit_id, sku_id, duration_estimate_minutes")
        .in("visit_id", chunk)
        .not("status", "eq", "canceled");
      for (const t of tasks ?? []) {
        const list = visitTasksByVisit.get(t.visit_id) ?? [];
        list.push(t as VisitTask);
        visitTasksByVisit.set(t.visit_id, list);
      }
    }

    // ── Step 5: Fetch familiarity data (completed visits in last 90 days per provider×customer) ──
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

    const { data: familiarityData } = await supabase
      .from("visits")
      .select("provider_org_id, property_id, scheduled_date")
      .eq("schedule_state", "completed")
      .gte("scheduled_date", ninetyDaysAgoStr)
      .lte("scheduled_date", todayStr)
      .not("provider_org_id", "is", null);

    // Build familiarity map: provider_org_id:customer_id → count
    const familiarityMap = new Map<string, number>();
    for (const fv of familiarityData ?? []) {
      const prop = propertyMap.get(fv.property_id);
      if (!prop || !fv.provider_org_id) continue;
      const key = `${fv.provider_org_id}:${prop.user_id}`;
      familiarityMap.set(key, (familiarityMap.get(key) ?? 0) + 1);
    }

    // ── Step 6: Get property→zone mapping from subscriptions ──
    const { data: subsData } = await supabase
      .from("subscriptions")
      .select("property_id, zone_id")
      .in("status", ["active", "trial"])
      .not("property_id", "is", null);

    const propertyZoneMap = new Map<string, string>();
    for (const sub of subsData ?? []) {
      if (sub.property_id && sub.zone_id) {
        propertyZoneMap.set(sub.property_id, sub.zone_id);
      }
    }

    // ── Step 7: Build per-visit data and compute assignment ──

    // Filter to visits that need assignment (not locked)
    const assignableVisits = visits.filter((v) => !v.assignment_locked);

    // Compute visit minutes
    const visitMinutesMap = new Map<string, number>();
    for (const v of visits) {
      const tasks = visitTasksByVisit.get(v.id) ?? [];
      const totalMinutes = tasks.reduce(
        (sum, t) => sum + (t.duration_estimate_minutes || dials.default_task_minutes),
        0
      );
      visitMinutesMap.set(v.id, totalMinutes || dials.default_task_minutes);
    }

    // Get unique categories per visit
    const visitCategoriesMap = new Map<string, Set<string>>();
    for (const v of visits) {
      const tasks = visitTasksByVisit.get(v.id) ?? [];
      const cats = new Set<string>();
      for (const t of tasks) {
        const cat = skuCategoryMap.get(t.sku_id);
        if (cat) cats.add(cat);
      }
      visitCategoriesMap.set(v.id, cats);
    }

    // Get equipment needed per visit (from tasks sku → capabilities)
    // For v1, we use service_categories from provider_work_profiles for skill eligibility

    // Track provider assignments per date for capacity
    const providerAssignedMinutes = new Map<string, number>(); // provider_org_id:date → minutes
    const providerAssignedLocations = new Map<string, { lat: number; lng: number }[]>(); // provider_org_id:date → locations

    // Pre-populate with already-locked visit assignments
    for (const v of visits) {
      if (v.assignment_locked && v.provider_org_id) {
        const key = `${v.provider_org_id}:${v.scheduled_date}`;
        const mins = visitMinutesMap.get(v.id) ?? dials.default_task_minutes;
        providerAssignedMinutes.set(key, (providerAssignedMinutes.get(key) ?? 0) + mins);

        const prop = propertyMap.get(v.property_id);
        if (prop?.lat && prop?.lng) {
          const locs = providerAssignedLocations.get(key) ?? [];
          locs.push({ lat: prop.lat, lng: prop.lng });
          providerAssignedLocations.set(key, locs);
        }
      }
    }

    // ── Step 8: Build candidate sets and score (Steps A+B from PRD) ──

    interface VisitAssignment {
      visit: Visit;
      candidateScores: CandidateScore[];
      visitMinutes: number;
      visitCategories: Set<string>;
      property: Property | undefined;
      zoneId: string | null;
    }

    const visitAssignments: VisitAssignment[] = [];

    for (const v of assignableVisits) {
      const property = propertyMap.get(v.property_id);
      const visitMins = visitMinutesMap.get(v.id) ?? dials.default_task_minutes;
      const categories = visitCategoriesMap.get(v.id) ?? new Set<string>();
      const zoneId = propertyZoneMap.get(v.property_id) ?? null;

      const candidates: CandidateScore[] = [];

      for (const provider of providers) {
        const reasons: string[] = [];

        // Hard constraint 1: Skills — provider must cover all visit categories
        const missingCats = [...categories].filter(
          (c) => !provider.service_categories.includes(c)
        );
        if (missingCats.length > 0) continue;

        // Hard constraint 2: Working day
        if (!isWorkingDay(provider.working_hours, v.scheduled_date)) continue;

        // Hard constraint 3: Capacity
        const dayKey = `${provider.provider_org_id}:${v.scheduled_date}`;
        const workMins = getWorkMinutes(provider.working_hours, v.scheduled_date);
        const capacityMins = workMins * dials.utilization_target;
        const usedMins = providerAssignedMinutes.get(dayKey) ?? 0;
        const remainingMins = capacityMins - usedMins;

        if (remainingMins < visitMins + dials.buffer_minutes) continue;

        // Hard constraint 4: Geographic feasibility
        if (!provider.home_lat || !provider.home_lng || !property?.lat || !property?.lng) {
          // Can't compute distance — skip
          continue;
        }

        const driveFromHome = driveMinutes(
          provider.home_lat,
          provider.home_lng,
          property.lat,
          property.lng
        );

        if (driveFromHome > dials.max_candidate_drive_minutes) continue;

        // ── Soft scoring (Step B) ──

        // Distance score: use min of drive from home and drive from centroid
        const existingLocs = providerAssignedLocations.get(dayKey) ?? [];
        const cent = centroid(existingLocs);
        let geoCost = driveFromHome;
        if (cent) {
          const driveFromCentroid = driveMinutes(cent.lat, cent.lng, property.lat, property.lng);
          geoCost = Math.min(driveFromHome, driveFromCentroid);
        }
        reasons.push(`Drive: ${geoCost.toFixed(1)} min`);

        // Balance penalty
        const targetRemaining = capacityMins * 0.5; // ideal remaining
        const balancePenalty = Math.max(0, (targetRemaining - remainingMins) / Math.max(1, targetRemaining));
        if (balancePenalty > 0.3) reasons.push(`Near capacity (${Math.round((1 - remainingMins / capacityMins) * 100)}%)`);

        // Spread penalty: increase in max radius from centroid
        let spreadPenalty = 0;
        if (existingLocs.length > 0 && cent) {
          const currentMaxDist = Math.max(
            ...existingLocs.map((l) => haversineKm(cent.lat, cent.lng, l.lat, l.lng))
          );
          const newDist = haversineKm(cent.lat, cent.lng, property.lat, property.lng);
          if (newDist > currentMaxDist) {
            spreadPenalty = (newDist - currentMaxDist) / Math.max(1, currentMaxDist);
          }
        }

        // Familiarity score
        const customerId = property.user_id;
        const famKey = `${provider.provider_org_id}:${customerId}`;
        const famCount = familiarityMap.get(famKey) ?? 0;
        let familiarity = 0;
        if (famCount >= 2) familiarity = 1.0;
        else if (famCount === 1) familiarity = 0.5;

        // Cap familiarity influence
        const familiarityBonus = familiarity * dials.familiarity_cap_minutes;
        if (familiarity > 0) reasons.push(`Familiarity: ${famCount} prior visits`);

        // Zone affinity
        let zoneAffinity = 0;
        if (zoneId) {
          for (const cat of categories) {
            const zcpKey = `${zoneId}:${cat}`;
            if (zcpByZoneCategory.get(zcpKey)?.has(provider.provider_org_id)) {
              zoneAffinity = 1;
              break;
            }
          }
        }
        if (zoneAffinity > 0) reasons.push("Zone provider");

        // Composite score (lower is better)
        const score =
          dials.w_distance * geoCost +
          dials.w_balance * balancePenalty * 100 +
          dials.w_spread * spreadPenalty * 100 -
          dials.w_familiarity * familiarityBonus -
          dials.w_zone_affinity * zoneAffinity * 10;

        candidates.push({
          provider_org_id: provider.provider_org_id,
          score,
          reasons,
          breakdown: {
            distance: geoCost,
            balance: balancePenalty,
            spread: spreadPenalty,
            familiarity,
            zone_affinity: zoneAffinity,
          },
        });
      }

      // Sort candidates by score (ascending = best first)
      candidates.sort((a, b) => a.score - b.score);

      visitAssignments.push({
        visit: v,
        candidateScores: candidates,
        visitMinutes: visitMins,
        visitCategories: categories,
        property,
        zoneId,
      });
    }

    // ── Step 9: Greedy assignment — most-constrained first (Step C) ──

    // Sort by fewest candidates first
    visitAssignments.sort((a, b) => a.candidateScores.length - b.candidateScores.length);

    const results: AssignmentResult[] = [];
    let assignedPrimary = 0;
    let assignedBackup = 0;
    let unassignedCount = 0;
    let longDriveCount = 0;
    const assignmentsByProvider = new Map<string, string[]>();

    for (const va of visitAssignments) {
      const { visit, candidateScores, visitMinutes } = va;

      if (candidateScores.length === 0) {
        // Unassigned
        const topReason = determineUnassignedReason(va, providers, dials);
        results.push({
          visit_id: visit.id,
          primary_provider_org_id: null,
          backup_provider_org_id: null,
          score: null,
          confidence: "Low",
          reasons: [topReason],
          unassigned_reason: topReason,
          candidates: [],
        });
        unassignedCount++;
        continue;
      }

      // Find best feasible candidate (re-check capacity since greedy updates it)
      let bestCandidate: CandidateScore | null = null;
      let secondBest: CandidateScore | null = null;

      for (const c of candidateScores) {
        const dayKey = `${c.provider_org_id}:${visit.scheduled_date}`;
        const provider = providerMap.get(c.provider_org_id);
        if (!provider) continue;

        const workMins = getWorkMinutes(provider.working_hours, visit.scheduled_date);
        const capacityMins = workMins * dials.utilization_target;
        const usedMins = providerAssignedMinutes.get(dayKey) ?? 0;
        const remainingMins = capacityMins - usedMins;

        if (remainingMins < visitMinutes + dials.buffer_minutes) continue;

        if (!bestCandidate) {
          bestCandidate = c;
        } else if (!secondBest) {
          secondBest = c;
          break; // We only need top 2
        }
      }

      if (!bestCandidate) {
        results.push({
          visit_id: visit.id,
          primary_provider_org_id: null,
          backup_provider_org_id: null,
          score: null,
          confidence: "Low",
          reasons: ["All candidates at capacity after greedy pass"],
          unassigned_reason: "no_capacity",
          candidates: candidateScores.slice(0, 5),
        });
        unassignedCount++;
        continue;
      }

      // ── Stability check (Step E) ──
      const isInFreezeWindow = visit.scheduled_date <= freezeEndStr;
      const existingProvider = visit.provider_org_id;

      if (existingProvider && existingProvider !== bestCandidate.provider_org_id) {
        // Check if existing provider is still in candidate set
        const existingCandidate = candidateScores.find(
          (c) => c.provider_org_id === existingProvider
        );

        if (existingCandidate) {
          const improvement = existingCandidate.score - bestCandidate.score;
          const improvementPct =
            existingCandidate.score > 0
              ? improvement / existingCandidate.score
              : 0;

          const minDelta = isInFreezeWindow
            ? dials.reassign_min_score_delta * dials.freeze_strictness_multiplier
            : dials.reassign_min_score_delta;
          const minPct = isInFreezeWindow
            ? dials.reassign_min_percent * dials.freeze_strictness_multiplier
            : dials.reassign_min_percent;

          if (improvement < minDelta && improvementPct < minPct) {
            // Keep existing assignment (stability wins)
            bestCandidate = existingCandidate;
            // Find new second best
            secondBest = candidateScores.find(
              (c) => c.provider_org_id !== existingProvider
            ) ?? null;
          }
        }
      }

      // Update capacity tracking
      const dayKey = `${bestCandidate.provider_org_id}:${visit.scheduled_date}`;
      providerAssignedMinutes.set(
        dayKey,
        (providerAssignedMinutes.get(dayKey) ?? 0) + visitMinutes
      );

      const prop = va.property;
      if (prop?.lat && prop?.lng) {
        const locs = providerAssignedLocations.get(dayKey) ?? [];
        locs.push({ lat: prop.lat, lng: prop.lng });
        providerAssignedLocations.set(dayKey, locs);
      }

      // Track for notification batching
      if (!assignmentsByProvider.has(bestCandidate.provider_org_id)) {
        assignmentsByProvider.set(bestCandidate.provider_org_id, []);
      }
      assignmentsByProvider.get(bestCandidate.provider_org_id)!.push(visit.id);

      // Check for backup (Step D)
      let backupProvider: string | null = null;
      if (secondBest) {
        // Verify backup has capacity
        const bDayKey = `${secondBest.provider_org_id}:${visit.scheduled_date}`;
        const bProvider = providerMap.get(secondBest.provider_org_id);
        if (bProvider) {
          const bWorkMins = getWorkMinutes(bProvider.working_hours, visit.scheduled_date);
          const bCapacityMins = bWorkMins * dials.utilization_target;
          const bUsedMins = providerAssignedMinutes.get(bDayKey) ?? 0;
          if (bCapacityMins - bUsedMins >= visitMinutes) {
            backupProvider = secondBest.provider_org_id;
            assignedBackup++;
          }
        }
      }

      // Confidence
      const confidence = computeConfidence(
        candidateScores.length,
        bestCandidate.score,
        secondBest?.score ?? null
      );

      // Long drive flag
      if (bestCandidate.breakdown.distance > 30) longDriveCount++;

      const topReasons = bestCandidate.reasons.slice(0, 3);

      results.push({
        visit_id: visit.id,
        primary_provider_org_id: bestCandidate.provider_org_id,
        backup_provider_org_id: backupProvider,
        score: bestCandidate.score,
        confidence,
        reasons: topReasons,
        unassigned_reason: null,
        candidates: candidateScores.slice(0, 5),
      });
      assignedPrimary++;
    }

    // ── Step 10: Write results ──
    // Batch update visits and insert assignment logs
    const visitUpdates: any[] = [];
    const logInserts: any[] = [];

    for (const r of results) {
      visitUpdates.push({
        id: r.visit_id,
        provider_org_id: r.primary_provider_org_id,
        backup_provider_org_id: r.backup_provider_org_id,
        assignment_score: r.score,
        assignment_confidence: r.confidence,
        assignment_reasons: r.reasons,
        assignment_run_id: runId,
        unassigned_reason: r.unassigned_reason,
        updated_at: new Date().toISOString(),
      });

      // Find original visit to track previous provider
      const origVisit = visits.find((v) => v.id === r.visit_id);

      logInserts.push({
        visit_id: r.visit_id,
        action: r.primary_provider_org_id ? "auto_assign" : "unassign",
        provider_org_id: r.primary_provider_org_id,
        previous_provider_org_id: origVisit?.provider_org_id ?? null,
        reason: r.unassigned_reason ?? `Score: ${r.score?.toFixed(2)} | ${r.reasons.join(", ")}`,
        performed_by: null, // system
        score_breakdown: r.candidates.length > 0 ? r.candidates[0].breakdown : null,
        candidates: r.candidates.slice(0, 5),
      });
    }

    // Batch upsert visits (update by id)
    for (let i = 0; i < visitUpdates.length; i += 100) {
      const chunk = visitUpdates.slice(i, i + 100);
      for (const update of chunk) {
        const { id, ...rest } = update;
        await supabase.from("visits").update(rest).eq("id", id);
      }
    }

    // Batch insert assignment logs
    for (let i = 0; i < logInserts.length; i += 100) {
      const chunk = logInserts.slice(i, i + 100);
      await supabase.from("visit_assignment_log").insert(chunk);
    }

    // ── Step 11: Emit notifications ──
    for (const [provOrgId, visitIdList] of assignmentsByProvider) {
      await supabase.rpc("emit_notification_event", {
        p_event_type: "PROVIDER_JOBS_ASSIGNED",
        p_idempotency_key: `visits_assigned:${provOrgId}:${todayStr}`,
        p_audience_type: "PROVIDER",
        p_audience_org_id: provOrgId,
        p_priority: "SERVICE",
        p_payload: { count: visitIdList.length, date: todayStr, visit_ids: visitIdList },
      });
    }

    if (unassignedCount >= 3) {
      await supabase.rpc("emit_notification_event", {
        p_event_type: "ADMIN_ZONE_ALERT_BACKLOG",
        p_idempotency_key: `visit_backlog:${todayStr}`,
        p_audience_type: "ADMIN",
        p_priority: "CRITICAL",
        p_payload: { unassigned_count: unassignedCount, date: todayStr },
      });
    }

    // ── Step 12: Complete assignment run ──
    const summary = {
      total_visits: assignableVisits.length,
      assigned_primary: assignedPrimary,
      assigned_backup: assignedBackup,
      unassigned: unassignedCount,
      long_drive: longDriveCount,
      locked_skipped: visits.filter((v) => v.assignment_locked).length,
    };

    await supabase
      .from("assignment_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        summary,
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ ok: true, run_id: runId, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("assign-visits error:", error);

    // Mark run as failed
    await supabase
      .from("assignment_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        summary: { error: String(error) },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helper: determine top unassigned reason ──

function determineUnassignedReason(
  va: { visit: Visit; visitCategories: Set<string>; property: Property | undefined; zoneId: string | null },
  providers: ProviderProfile[],
  dials: ConfigDials
): string {
  const { visit, visitCategories, property } = va;

  if (!property?.lat || !property?.lng) return "no_coordinates";

  let noSkill = 0;
  let noWorkDay = 0;
  let noCapacity = 0;
  let tooFar = 0;

  for (const p of providers) {
    const missingCats = [...visitCategories].filter((c) => !p.service_categories.includes(c));
    if (missingCats.length > 0) { noSkill++; continue; }
    if (!isWorkingDay(p.working_hours, visit.scheduled_date)) { noWorkDay++; continue; }
    if (!p.home_lat || !p.home_lng) continue;
    const drive = driveMinutes(p.home_lat, p.home_lng, property.lat, property.lng);
    if (drive > dials.max_candidate_drive_minutes) { tooFar++; continue; }
    noCapacity++;
  }

  if (noSkill > 0 && noWorkDay === 0 && noCapacity === 0 && tooFar === 0) return "no_qualified_provider";
  if (tooFar > 0 && noCapacity === 0) return "too_far";
  if (noCapacity > 0) return "no_capacity";
  if (noWorkDay > 0) return "no_working_day";
  return "no_providers_available";
}
