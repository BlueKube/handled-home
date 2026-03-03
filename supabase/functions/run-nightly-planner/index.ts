import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──

interface PlanRunSummary {
  locked_visits: number;
  draft_visits: number;
  draft_visits_created: number;
  draft_visits_removed: number;
  tasks_created: number;
  tasks_removed: number;
  properties_processed: number;
  properties_skipped: number;
  state_changes_applied: number;
}

interface PropertyInput {
  id: string;
  zone_id: string | null;
}

interface ServiceDayAssignment {
  property_id: string;
  day_of_week: string;
  status: string;
}

interface RoutineInput {
  routine_id: string;
  property_id: string;
  cadence_anchor_date: string | null;
  status: string;
  items: RoutineItemInput[];
}

interface RoutineItemInput {
  sku_id: string;
  cadence_type: string;
  duration_minutes: number | null;
  level_id: string | null;
  sku_name: string | null;
  category: string | null;
}

interface ExistingVisit {
  id: string;
  property_id: string;
  scheduled_date: string;
  schedule_state: string;
  plan_window: string | null;
  plan_run_id: string | null;
}

interface ExistingTask {
  id: string;
  visit_id: string;
  sku_id: string;
  status: string;
}

interface Conflict {
  property_id: string;
  type: string;
  detail: string;
}

// ── Helpers ──

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getDayName(d: Date): string {
  return DAY_NAMES[d.getDay()];
}

/** Compute which service day dates fall in a date range */
function getServiceDayDates(dayOfWeek: string, rangeStart: Date, rangeEnd: Date): Date[] {
  const targetDay = DAY_NAMES.indexOf(dayOfWeek.toLowerCase());
  if (targetDay === -1) return [];
  const dates: Date[] = [];
  const cursor = new Date(rangeStart);
  // Advance to first occurrence
  while (cursor.getDay() !== targetDay) cursor.setDate(cursor.getDate() + 1);
  while (cursor <= rangeEnd) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

/** Compute cadence occurrence index from anchor */
function getOccurrenceIndex(anchorDate: Date, serviceDate: Date): number {
  const diffMs = serviceDate.getTime() - anchorDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

/** Check if a task is due based on cadence */
function isTaskDue(cadenceType: string, occurrenceIndex: number): boolean {
  if (occurrenceIndex < 0) return false;
  switch (cadenceType) {
    case "weekly": return true;
    case "biweekly": return occurrenceIndex % 2 === 0;
    case "four_week": return occurrenceIndex % 4 === 0;
    case "monthly": return occurrenceIndex % 4 === 0; // approximate
    case "quarterly": return occurrenceIndex % 13 === 0; // approximate
    default: return true;
  }
}

/** Map of gating states where tasks should NOT be generated */
const NON_PURCHASABLE_STATES = new Set(["CLOSED", "WAITLIST_ONLY", "PROVIDER_RECRUITING", "PROTECT_QUALITY"]);

// ── Main Handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let mode = "full";
  let triggeredBy = "system";

  try {
    const body = await req.json().catch(() => ({}));
    mode = body.mode ?? "full";
    triggeredBy = body.triggered_by ?? "system";
  } catch { /* default values */ }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const runDateStr = toDateStr(today);
  const idempotencyKey = `planner:${runDateStr}:${mode}`;

  // ── Idempotency check ──
  const { data: existingRun } = await supabase
    .from("plan_runs")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingRun?.status === "completed") {
    return new Response(
      JSON.stringify({ ok: true, message: "Already completed for today", run_id: existingRun.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Create plan run ──
  const { data: planRun, error: runErr } = await supabase
    .from("plan_runs")
    .upsert({
      idempotency_key: idempotencyKey,
      status: "running",
      triggered_by: triggeredBy,
      started_at: new Date().toISOString(),
      run_date: runDateStr,
    }, { onConflict: "idempotency_key" })
    .select("id")
    .single();

  if (runErr || !planRun) {
    return new Response(
      JSON.stringify({ ok: false, error: runErr?.message ?? "Failed to create plan run" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const runId = planRun.id;
  const summary: PlanRunSummary = {
    locked_visits: 0, draft_visits: 0,
    draft_visits_created: 0, draft_visits_removed: 0,
    tasks_created: 0, tasks_removed: 0,
    properties_processed: 0, properties_skipped: 0,
    state_changes_applied: 0,
  };
  const conflicts: Conflict[] = [];

  const runStartedAt = new Date().toISOString();

  try {
    // ── STEP A: Gather Inputs ──
    const lockedEnd = addDays(today, 6); // T0+0 through T0+6 = LOCKED
    const draftEnd = addDays(today, 13); // T0+13
    const horizonEnd = draftEnd;

    // Fetch all active subscriptions with property + routine data in parallel
    const [
      subsResult,
      serviceDayResult,
      routinesResult,
      existingVisitsResult,
      marketStatesResult,
    ] = await Promise.all([
      // Active subscriptions → properties
      supabase
        .from("subscriptions")
        .select("id, customer_id, plan_id, status, properties!inner(id, zone_id)")
        .in("status", ["active", "trial"]),
      // Service day assignments (confirmed only)
      supabase
        .from("service_day_assignments")
        .select("property_id, day_of_week, status")
        .eq("status", "confirmed"),
      // Active routines with items
      supabase
        .from("routines")
        .select(`
          id, property_id, cadence_anchor_date, status,
          routine_versions!inner(
            id, status, version_number,
            routine_items(sku_id, cadence_type, duration_minutes, level_id, sku_name)
          )
        `)
        .eq("status", "active")
        .eq("routine_versions.status", "active"),
      // Existing visits in the horizon
      supabase
        .from("visits")
        .select("id, property_id, scheduled_date, schedule_state, plan_window, plan_run_id")
        .gte("scheduled_date", runDateStr)
        .lte("scheduled_date", toDateStr(horizonEnd))
        .not("schedule_state", "eq", "canceled"),
      // Market zone category states (for gating)
      supabase
        .from("market_zone_category_state")
        .select("zone_id, category, status"),
    ]);

    if (subsResult.error) throw subsResult.error;
    if (serviceDayResult.error) throw serviceDayResult.error;
    if (routinesResult.error) throw routinesResult.error;
    if (existingVisitsResult.error) throw existingVisitsResult.error;
    if (marketStatesResult.error) throw marketStatesResult.error;

    // Build lookup maps
    const serviceDayMap = new Map<string, string>(); // property_id → day_of_week
    for (const sda of (serviceDayResult.data ?? [])) {
      serviceDayMap.set(sda.property_id, sda.day_of_week);
    }

    // Build property → zone map from subscriptions
    const propertyZoneMap = new Map<string, string | null>();
    const activePropertyIds = new Set<string>();
    for (const sub of (subsResult.data ?? [])) {
      const props = (sub as any).properties;
      if (props) {
        const p = Array.isArray(props) ? props[0] : props;
        if (p?.id) {
          propertyZoneMap.set(p.id, p.zone_id);
          activePropertyIds.add(p.id);
        }
      }
    }

    // Build routine map: property_id → { items, cadence_anchor_date }
    const routineMap = new Map<string, RoutineInput>();
    for (const r of (routinesResult.data ?? [])) {
      const versions = (r as any).routine_versions ?? [];
      const activeVersion = versions.find((v: any) => v.status === "active");
      if (!activeVersion) continue;
      routineMap.set(r.property_id, {
        routine_id: r.id,
        property_id: r.property_id,
        cadence_anchor_date: r.cadence_anchor_date,
        status: r.status,
        items: (activeVersion.routine_items ?? []).map((item: any) => ({
          sku_id: item.sku_id,
          cadence_type: item.cadence_type,
          duration_minutes: item.duration_minutes,
          level_id: item.level_id,
          sku_name: item.sku_name,
          category: null, // resolved below
        })),
      });
    }

    // Build market state gating map: `${zone_id}:${category}` → status
    const stateGatingMap = new Map<string, string>();
    for (const ms of (marketStatesResult.data ?? [])) {
      stateGatingMap.set(`${ms.zone_id}:${ms.category}`, ms.status);
    }

    // Resolve SKU categories for gating (batch fetch)
    const allSkuIds = new Set<string>();
    for (const [, routine] of routineMap) {
      for (const item of routine.items) allSkuIds.add(item.sku_id);
    }
    let skuCategoryMap = new Map<string, string>();
    if (allSkuIds.size > 0) {
      const { data: skuData } = await supabase
        .from("service_skus")
        .select("id, category")
        .in("id", [...allSkuIds]);
      skuCategoryMap = new Map((skuData ?? []).map((s: any) => [s.id, s.category]));
    }

    // Enrich routine items with categories
    for (const [, routine] of routineMap) {
      for (const item of routine.items) {
        item.category = skuCategoryMap.get(item.sku_id) ?? null;
      }
    }

    // Existing visits by property
    const existingVisitsByProperty = new Map<string, ExistingVisit[]>();
    for (const v of (existingVisitsResult.data ?? []) as unknown as ExistingVisit[]) {
      const list = existingVisitsByProperty.get(v.property_id) ?? [];
      list.push(v);
      existingVisitsByProperty.set(v.property_id, list);
    }

    // Fetch existing tasks for existing visits
    const existingVisitIds = (existingVisitsResult.data ?? []).map((v: any) => v.id);
    let existingTasksByVisit = new Map<string, ExistingTask[]>();
    if (existingVisitIds.length > 0) {
      // Batch in chunks of 500
      for (let i = 0; i < existingVisitIds.length; i += 500) {
        const chunk = existingVisitIds.slice(i, i + 500);
        const { data: tasks } = await supabase
          .from("visit_tasks")
          .select("id, visit_id, sku_id, status")
          .in("visit_id", chunk)
          .not("status", "eq", "canceled");
        for (const t of (tasks ?? []) as unknown as ExistingTask[]) {
          const list = existingTasksByVisit.get(t.visit_id) ?? [];
          list.push(t);
          existingTasksByVisit.set(t.visit_id, list);
        }
      }
    }

    // ── STEP B: Apply state changes at nightly boundary ──
    // Sprint 3 state changes are already applied in real-time via admin RPCs.
    // The planner respects current market_zone_category_state for DRAFT generation.
    // No additional action needed here — states read above are current.

    // ── STEP C + D + E: Process each property ──
    const visitsToInsert: any[] = [];
    const tasksToInsert: any[] = [];
    const visitIdsToRemove: string[] = [];
    const taskIdsToRemove: string[] = [];
    const visitsToUpdateWindow: { id: string; plan_window: string; plan_run_id: string }[] = [];

    for (const propertyId of activePropertyIds) {
      const dayOfWeek = serviceDayMap.get(propertyId);
      if (!dayOfWeek) {
        conflicts.push({
          property_id: propertyId,
          type: "no_service_day",
          detail: "No confirmed service day assignment",
        });
        summary.properties_skipped++;
        continue;
      }

      const routine = routineMap.get(propertyId);
      if (!routine || routine.items.length === 0) {
        conflicts.push({
          property_id: propertyId,
          type: "no_routine",
          detail: "No active routine with items",
        });
        summary.properties_skipped++;
        continue;
      }

      const zoneId = propertyZoneMap.get(propertyId);
      const anchorDate = routine.cadence_anchor_date
        ? new Date(routine.cadence_anchor_date)
        : today; // fallback to today if no anchor

      // Get all service day dates in the horizon
      const serviceDates = getServiceDayDates(dayOfWeek, today, horizonEnd);
      const existingVisits = existingVisitsByProperty.get(propertyId) ?? [];
      const existingVisitByDate = new Map(existingVisits.map((v) => [v.scheduled_date, v]));

      for (const serviceDate of serviceDates) {
        const dateStr = toDateStr(serviceDate);
        const isLocked = serviceDate <= lockedEnd;
        const window = isLocked ? "locked" : "draft";
        const existingVisit = existingVisitByDate.get(dateStr);

        // ── STEP E: Preserve LOCKED ──
        if (isLocked && existingVisit) {
          // Just update window classification if needed
          if (existingVisit.plan_window !== "locked") {
            visitsToUpdateWindow.push({ id: existingVisit.id, plan_window: "locked", plan_run_id: runId });
          }
          summary.locked_visits++;
          continue;
        }

        if (isLocked && !existingVisit) {
          // LOCKED day with no visit — create it but mark as locked
          // This handles the case where a visit should exist but doesn't yet
          const occurrenceIndex = getOccurrenceIndex(anchorDate, serviceDate);

          // Determine due tasks
          const dueTasks = routine.items.filter((item) => {
            if (!isTaskDue(item.cadence_type, occurrenceIndex)) return false;
            // Gating check
            if (item.category && zoneId) {
              const stateKey = `${zoneId}:${item.category}`;
              const state = stateGatingMap.get(stateKey);
              if (state && NON_PURCHASABLE_STATES.has(state)) return false;
            }
            return true;
          });

          if (dueTasks.length > 0) {
            const visitId = crypto.randomUUID();
            visitsToInsert.push({
              id: visitId,
              property_id: propertyId,
              scheduled_date: dateStr,
              schedule_state: "planning",
              plan_window: "locked",
              plan_run_id: runId,
            });
            for (const task of dueTasks) {
              tasksToInsert.push({
                id: crypto.randomUUID(),
                visit_id: visitId,
                sku_id: task.sku_id,
                duration_estimate_minutes: task.duration_minutes ?? 30,
                status: "pending",
              });
              summary.tasks_created++;
            }
            summary.locked_visits++;
          }
          continue;
        }

        // ── DRAFT window processing ──
        if (mode === "full" || mode === "draft_only") {
          const occurrenceIndex = getOccurrenceIndex(anchorDate, serviceDate);

          // Determine due tasks (with gating)
          const dueTasks = routine.items.filter((item) => {
            if (!isTaskDue(item.cadence_type, occurrenceIndex)) return false;
            if (item.category && zoneId) {
              const stateKey = `${zoneId}:${item.category}`;
              const state = stateGatingMap.get(stateKey);
              if (state && NON_PURCHASABLE_STATES.has(state)) return false;
            }
            return true;
          });

          if (existingVisit) {
            // Visit exists — compare tasks for stability
            const existingTasks = existingTasksByVisit.get(existingVisit.id) ?? [];
            const existingSkuIds = new Set(existingTasks.map((t) => t.sku_id));
            const dueSkuIds = new Set(dueTasks.map((t) => t.sku_id));

            // Remove tasks no longer due
            for (const et of existingTasks) {
              if (!dueSkuIds.has(et.sku_id)) {
                taskIdsToRemove.push(et.id);
                summary.tasks_removed++;
              }
            }

            // Add new tasks
            for (const dt of dueTasks) {
              if (!existingSkuIds.has(dt.sku_id)) {
                tasksToInsert.push({
                  id: crypto.randomUUID(),
                  visit_id: existingVisit.id,
                  sku_id: dt.sku_id,
                  duration_estimate_minutes: dt.duration_minutes ?? 30,
                  status: "pending",
                });
                summary.tasks_created++;
              }
            }

            // Update window if needed
            if (existingVisit.plan_window !== "draft") {
              visitsToUpdateWindow.push({ id: existingVisit.id, plan_window: "draft", plan_run_id: runId });
            }

            // If no tasks remain due, remove the visit
            if (dueTasks.length === 0 && existingTasks.length > 0) {
              visitIdsToRemove.push(existingVisit.id);
              summary.draft_visits_removed++;
            } else {
              summary.draft_visits++;
            }
          } else if (dueTasks.length > 0) {
            // No existing visit — create one
            const visitId = crypto.randomUUID();
            visitsToInsert.push({
              id: visitId,
              property_id: propertyId,
              scheduled_date: dateStr,
              schedule_state: "planning",
              plan_window: "draft",
              plan_run_id: runId,
              draft_generated_at: new Date().toISOString(),
            });
            for (const task of dueTasks) {
              tasksToInsert.push({
                id: crypto.randomUUID(),
                visit_id: visitId,
                sku_id: task.sku_id,
                duration_estimate_minutes: task.duration_minutes ?? 30,
                status: "pending",
              });
              summary.tasks_created++;
            }
            summary.draft_visits_created++;
            summary.draft_visits++;
          }
        }
      }

      summary.properties_processed++;
    }

    // ── STEP F: Write outputs ──

    // F1 FIX: Cancel stale DRAFT visits beyond the horizon
    const { data: staleVisits } = await supabase
      .from("visits")
      .select("id")
      .gt("scheduled_date", toDateStr(horizonEnd))
      .eq("schedule_state", "planning")
      .eq("plan_window", "draft");

    if (staleVisits && staleVisits.length > 0) {
      const staleIds = staleVisits.map((v: any) => v.id);
      for (let i = 0; i < staleIds.length; i += 500) {
        const chunk = staleIds.slice(i, i + 500);
        await supabase
          .from("visits")
          .update({ schedule_state: "canceled", updated_at: new Date().toISOString() })
          .in("id", chunk);
      }
      summary.draft_visits_removed += staleIds.length;
    }

    // Insert new visits (batch in chunks)
    for (let i = 0; i < visitsToInsert.length; i += 200) {
      const chunk = visitsToInsert.slice(i, i + 200);
      const { error } = await supabase.from("visits").insert(chunk);
      if (error) throw new Error(`Failed to insert visits: ${error.message}`);
    }

    // Insert new tasks
    for (let i = 0; i < tasksToInsert.length; i += 200) {
      const chunk = tasksToInsert.slice(i, i + 200);
      const { error } = await supabase.from("visit_tasks").insert(chunk);
      if (error) throw new Error(`Failed to insert tasks: ${error.message}`);
    }

    // Cancel removed draft visits
    if (visitIdsToRemove.length > 0) {
      const { error } = await supabase
        .from("visits")
        .update({ schedule_state: "canceled" })
        .in("id", visitIdsToRemove);
      if (error) throw new Error(`Failed to cancel visits: ${error.message}`);
    }

    // Cancel removed tasks
    if (taskIdsToRemove.length > 0) {
      for (let i = 0; i < taskIdsToRemove.length; i += 500) {
        const chunk = taskIdsToRemove.slice(i, i + 500);
        const { error } = await supabase
          .from("visit_tasks")
          .update({ status: "canceled" })
          .in("id", chunk);
        if (error) throw new Error(`Failed to cancel tasks: ${error.message}`);
      }
    }

    // Update plan windows
    for (const upd of visitsToUpdateWindow) {
      await supabase
        .from("visits")
        .update({ plan_window: upd.plan_window, plan_run_id: upd.plan_run_id })
        .eq("id", upd.id);
    }

    // ── Mark run completed ──
    await supabase
      .from("plan_runs")
      .update({
        status: "completed",
        summary: summary as any,
        conflicts: conflicts as any,
      })
      .eq("id", runId);

    // Log to cron_run_log
    await supabase.from("cron_run_log").insert({
      function_name: "run-nightly-planner",
      idempotency_key: idempotencyKey,
      started_at: runStartedAt,
      completed_at: new Date().toISOString(),
      status: "success",
      result_summary: summary as any,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        run_id: runId,
        summary,
        conflicts_count: conflicts.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[planner] Error:", err);

    // Mark run failed
    await supabase
      .from("plan_runs")
      .update({
        status: "failed",
        summary: summary as any,
        conflicts: conflicts as any,
      })
      .eq("id", runId);

    // Log failure
    await supabase.from("cron_run_log").insert({
      function_name: "run-nightly-planner",
      idempotency_key: idempotencyKey,
      started_at: runStartedAt,
      completed_at: new Date().toISOString(),
      status: "failed",
      error_message: err.message ?? "Unknown error",
    });

    return new Response(
      JSON.stringify({ ok: false, error: err.message, run_id: runId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
