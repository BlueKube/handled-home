import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUserJwt } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──

interface ConfigDials {
  max_windows_shown: number;
  min_windows_to_show: number;
  min_lead_time_hours: number;
  max_home_required_stops_per_provider_per_day: number;
  max_home_required_stops_per_zone_per_day: number;
  default_appointment_window_length_hours: number;
  max_piggyback_added_minutes: number;
  max_piggyback_added_percent: number;
}

interface WindowTemplate {
  id: string;
  zone_id: string;
  category_key: string;
  window_label: string;
  window_start: string; // "09:00"
  window_end: string;   // "12:00"
  day_of_week: number | null;
  is_active: boolean;
}

interface CandidateWindow {
  date: string;
  day_of_week: number;
  window_label: string;
  window_start: string;
  window_end: string;
  window_start_minutes: number;
  window_end_minutes: number;
  template_id: string;
  feasibility_score: number;
  is_fallback: boolean;
}

interface BlockedWindow {
  startMinutes: number;
  endMinutes: number;
}

interface OfferedWindow {
  date: string;
  window_label: string;
  window_start: string; // ISO timestamp
  window_end: string;   // ISO timestamp
  template_id: string;
  feasibility_score: number;
  is_fallback: boolean;
}

// ── Time helpers ──

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}



function getWorkWindow(workingHours: any, dayOfWeek: number): { start: number; end: number } | null {
  const dayName = DAY_NAMES[dayOfWeek];
  const dayHours = workingHours?.[dayName];
  if (!dayHours?.start || !dayHours?.end) return null;
  return {
    start: parseTimeToMinutes(dayHours.start),
    end: parseTimeToMinutes(dayHours.end),
  };
}

// ── AM/PM fallback template generation ──

function generateAmPmFallbackWindows(dateStr: string, dayOfWeek: number): CandidateWindow[] {
  return [
    {
      date: dateStr,
      day_of_week: dayOfWeek,
      window_label: "Morning (AM)",
      window_start: "08:00",
      window_end: "12:00",
      window_start_minutes: 480,
      window_end_minutes: 720,
      template_id: "fallback-am",
      feasibility_score: 0,
      is_fallback: true,
    },
    {
      date: dateStr,
      day_of_week: dayOfWeek,
      window_label: "Afternoon (PM)",
      window_start: "12:00",
      window_end: "17:00",
      window_start_minutes: 720,
      window_end_minutes: 1020,
      template_id: "fallback-pm",
      feasibility_score: 0,
      is_fallback: true,
    },
  ];
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabase } = await requireUserJwt(req);
    const body = await req.json();
    const {
      zone_id,
      category_key,
      property_id,
      service_duration_minutes,
      scheduling_profile,
    } = body;

    // Validate required params
    if (!zone_id || !category_key || !property_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: zone_id, category_key, property_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (scheduling_profile && scheduling_profile !== "appointment_window") {
      return new Response(
        JSON.stringify({ error: "This endpoint is for appointment_window scheduling only" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const durationMinutes = service_duration_minutes || 60;

    // ── Step 1: Load config dials ──
    const { data: configRows } = await supabase
      .from("assignment_config")
      .select("config_key, config_value");

    const cm = new Map<string, number>();
    for (const r of configRows ?? []) {
      cm.set(r.config_key, Number(r.config_value));
    }

    const dials: ConfigDials = {
      max_windows_shown: cm.get("max_windows_shown") ?? 6,
      min_windows_to_show: cm.get("min_windows_to_show") ?? 3,
      min_lead_time_hours: cm.get("min_lead_time_hours") ?? 24,
      max_home_required_stops_per_provider_per_day: cm.get("max_home_required_stops_per_provider_per_day") ?? 3,
      max_home_required_stops_per_zone_per_day: cm.get("max_home_required_stops_per_zone_per_day") ?? 20,
      default_appointment_window_length_hours: cm.get("default_appointment_window_length_hours") ?? 3,
      max_piggyback_added_minutes: cm.get("max_piggyback_added_minutes") ?? 30,
      max_piggyback_added_percent: cm.get("max_piggyback_added_percent") ?? 0.25,
    };

    // ── Step 2: Compute date horizon ──
    const now = new Date();
    const leadTimeCutoff = new Date(now.getTime() + dials.min_lead_time_hours * 3600_000);
    const horizonStart = new Date(leadTimeCutoff);
    horizonStart.setUTCHours(0, 0, 0, 0);
    // If lead time cutoff is after start of day, bump to next day
    if (leadTimeCutoff > horizonStart) {
      horizonStart.setUTCDate(horizonStart.getUTCDate() + 1);
    }
    const horizonEnd = new Date(horizonStart);
    horizonEnd.setUTCDate(horizonEnd.getUTCDate() + 13); // 14-day lookahead

    const horizonStartStr = horizonStart.toISOString().split("T")[0];
    const horizonEndStr = horizonEnd.toISOString().split("T")[0];

    // ── Step 3: Load data in parallel ──
    const [
      templatesResult,
      providersResult,
      existingVisitsResult,
      blockedWindowsResult,
      propertyResult,
    ] = await Promise.all([
      // Window templates for this zone + category
      supabase
        .from("appointment_window_templates")
        .select("*")
        .eq("zone_id", zone_id)
        .eq("category_key", category_key)
        .eq("is_active", true),
      // Providers covering this zone + category
      supabase
        .from("zone_category_providers")
        .select("provider_org_id, role")
        .eq("zone_id", zone_id)
        .eq("category", category_key)
        .eq("status", "ACTIVE"),
      // Existing visits in horizon (to count home-required load)
      supabase
        .from("visits")
        .select("id, provider_org_id, scheduled_date, scheduling_profile, schedule_state")
        .gte("scheduled_date", horizonStartStr)
        .lte("scheduled_date", horizonEndStr)
        .in("schedule_state", ["planning", "scheduled", "dispatched", "in_progress"]),
      // Provider blocked windows
      supabase
        .from("provider_blocked_windows")
        .select("provider_org_id, day_of_week, start_time, end_time, is_recurring, specific_date"),
      // Property existence check
      supabase
        .from("properties")
        .select("id")
        .eq("id", property_id)
        .single(),
    ]);

    if (templatesResult.error) throw templatesResult.error;
    if (providersResult.error) throw providersResult.error;
    if (existingVisitsResult.error) throw existingVisitsResult.error;
    if (blockedWindowsResult.error) throw blockedWindowsResult.error;
    if (propertyResult.error) {
      return new Response(
        JSON.stringify({ error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const templates: WindowTemplate[] = templatesResult.data ?? [];
    const providerAssignments = providersResult.data ?? [];
    const existingVisits = existingVisitsResult.data ?? [];
    const blockedWindows = blockedWindowsResult.data ?? [];

    if (providerAssignments.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          windows: [],
          reason: "No providers assigned to this zone/category",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 4: Load provider work profiles ──
    const providerOrgIds = providerAssignments.map((p: any) => p.provider_org_id);
    const { data: workProfiles } = await supabase
      .from("provider_work_profiles")
      .select("provider_org_id, working_hours, max_jobs_per_day")
      .in("provider_org_id", providerOrgIds);

    const workProfileMap = new Map(
      (workProfiles ?? []).map((p: any) => [p.provider_org_id, p])
    );

    // ── Step 5: Build lookup maps ──

    // Count existing home-required visits per provider per day
    const homeStopsPerProviderDay = new Map<string, number>();
    // Count existing home-required visits per zone per day
    const homeStopsPerZoneDay = new Map<string, number>();

    for (const v of existingVisits) {
      if (v.scheduling_profile === "appointment_window") {
        if (v.provider_org_id) {
          const pk = `${v.provider_org_id}:${v.scheduled_date}`;
          homeStopsPerProviderDay.set(pk, (homeStopsPerProviderDay.get(pk) ?? 0) + 1);
        }
        const zk = `${zone_id}:${v.scheduled_date}`;
        homeStopsPerZoneDay.set(zk, (homeStopsPerZoneDay.get(zk) ?? 0) + 1);
      }
    }

    // Build blocked windows per provider per day-of-week / specific date
    const blockedByProviderDay = new Map<string, BlockedWindow[]>();
    for (const bw of blockedWindows) {
      if (!providerOrgIds.includes(bw.provider_org_id)) continue;

      for (
        let d = new Date(horizonStart);
        d <= horizonEnd;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
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

    // Also load provider availability blocks (vacation/day off)
    const { data: availBlocks } = await supabase
      .from("provider_availability_blocks")
      .select("provider_org_id, block_type, start_date, end_date, status")
      .in("provider_org_id", providerOrgIds)
      .in("block_type", ["DAY_OFF", "VACATION"])
      .eq("status", "active")
      .lte("start_date", horizonEndStr)
      .gte("end_date", horizonStartStr);

    // Build set of provider+date combos that are fully blocked
    const providerDayOff = new Set<string>();
    for (const ab of availBlocks ?? []) {
      const start = new Date(ab.start_date + "T00:00:00Z");
      const end = new Date(ab.end_date + "T00:00:00Z");
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        providerDayOff.add(`${ab.provider_org_id}:${d.toISOString().split("T")[0]}`);
      }
    }

    // ── Step 6: Generate candidate windows ──
    const candidates: CandidateWindow[] = [];

    for (
      let d = new Date(horizonStart);
      d <= horizonEnd;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getUTCDay();

      // Check zone-level cap
      const zoneKey = `${zone_id}:${dateStr}`;
      const zoneDayHomeStops = homeStopsPerZoneDay.get(zoneKey) ?? 0;
      if (zoneDayHomeStops >= dials.max_home_required_stops_per_zone_per_day) continue;

      // Find templates applicable to this day
      const dayTemplates = templates.filter(
        (t) => t.day_of_week === null || t.day_of_week === dayOfWeek
      );

      for (const tmpl of dayTemplates) {
        const wStart = parseTimeToMinutes(tmpl.window_start);
        const wEnd = parseTimeToMinutes(tmpl.window_end);

        // Check lead time: window start must be after lead time cutoff
        const windowStartTime = new Date(dateStr + "T00:00:00Z");
        windowStartTime.setUTCMinutes(windowStartTime.getUTCMinutes() + wStart);
        if (windowStartTime <= leadTimeCutoff) continue;

        // Check if at least one provider can serve this window
        let feasibilityScore = 0;
        let hasAvailableProvider = false;

        for (const pa of providerAssignments) {
          const provKey = `${pa.provider_org_id}:${dateStr}`;

          // Skip if provider is on day off / vacation
          if (providerDayOff.has(provKey)) continue;

          // Skip if provider at home-required cap
          const providerDayHomeStops = homeStopsPerProviderDay.get(provKey) ?? 0;
          if (providerDayHomeStops >= dials.max_home_required_stops_per_provider_per_day) continue;

          // Check provider works this day
          const profile = workProfileMap.get(pa.provider_org_id);
          if (!profile) continue;
          const workWin = getWorkWindow(profile.working_hours, dayOfWeek);
          if (!workWin) continue;

          // Check window fits within provider work hours
          if (wStart < workWin.start || wEnd > workWin.end) continue;

          // Check blocked windows don't overlap the appointment window
          const blocked = blockedByProviderDay.get(provKey) ?? [];
          const hasConflict = blocked.some(
            (bw) => bw.startMinutes < wEnd && bw.endMinutes > wStart
          );
          if (hasConflict) continue;

          // Check max jobs per day
          const totalJobsForDay = existingVisits.filter(
            (v: any) => v.provider_org_id === pa.provider_org_id && v.scheduled_date === dateStr
          ).length;
          if (profile.max_jobs_per_day && totalJobsForDay >= profile.max_jobs_per_day) continue;

          // This provider can serve this window
          hasAvailableProvider = true;

          // Score: Primary providers score higher, earlier dates score higher
          const isPrimary = pa.role === "PRIMARY";
          const daysFromNow = Math.floor(
            (new Date(dateStr + "T00:00:00Z").getTime() - now.getTime()) / 86400_000
          );
          // Higher score = better: primary bonus + freshness decay + capacity headroom
          const capacityRoom = dials.max_home_required_stops_per_provider_per_day - providerDayHomeStops;
          const providerScore =
            (isPrimary ? 50 : 20) +
            Math.max(0, 14 - daysFromNow) * 2 + // prefer sooner
            capacityRoom * 5;

          feasibilityScore = Math.max(feasibilityScore, providerScore);
        }

        if (hasAvailableProvider) {
          candidates.push({
            date: dateStr,
            day_of_week: dayOfWeek,
            window_label: tmpl.window_label,
            window_start: tmpl.window_start,
            window_end: tmpl.window_end,
            window_start_minutes: wStart,
            window_end_minutes: wEnd,
            template_id: tmpl.id,
            feasibility_score: feasibilityScore,
            is_fallback: false,
          });
        }
      }
    }

    // ── Step 7: AM/PM fallback if too few specific windows ──
    let finalCandidates = candidates;

    if (candidates.length < dials.min_windows_to_show) {
      // Generate AM/PM fallback windows for each day
      const fallbacks: CandidateWindow[] = [];

      for (
        let d = new Date(horizonStart);
        d <= horizonEnd;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getUTCDay();

        // Check zone cap
        const zoneKey = `${zone_id}:${dateStr}`;
        const zoneDayHomeStops = homeStopsPerZoneDay.get(zoneKey) ?? 0;
        if (zoneDayHomeStops >= dials.max_home_required_stops_per_zone_per_day) continue;

        const amPm = generateAmPmFallbackWindows(dateStr, dayOfWeek);

        for (const fb of amPm) {
          // Check lead time
          const windowStartTime = new Date(dateStr + "T00:00:00Z");
          windowStartTime.setUTCMinutes(windowStartTime.getUTCMinutes() + fb.window_start_minutes);
          if (windowStartTime <= leadTimeCutoff) continue;

          // Check if any provider available for this broader window
          let hasProvider = false;
          let bestScore = 0;

          for (const pa of providerAssignments) {
            const provKey = `${pa.provider_org_id}:${dateStr}`;
            if (providerDayOff.has(provKey)) continue;

            const providerDayHomeStops = homeStopsPerProviderDay.get(provKey) ?? 0;
            if (providerDayHomeStops >= dials.max_home_required_stops_per_provider_per_day) continue;

            const profile = workProfileMap.get(pa.provider_org_id);
            if (!profile) continue;
            const workWin = getWorkWindow(profile.working_hours, dayOfWeek);
            if (!workWin) continue;

            // For AM/PM fallback, check overlap between work window and fallback window
            const overlapStart = Math.max(fb.window_start_minutes, workWin.start);
            const overlapEnd = Math.min(fb.window_end_minutes, workWin.end);
            if (overlapEnd - overlapStart < durationMinutes) continue;

            // Check blocked windows
            const blocked = blockedByProviderDay.get(provKey) ?? [];
            // For fallback, we need at least durationMinutes of unblocked time within the fallback window
            let availableMinutes = overlapEnd - overlapStart;
            for (const bw of blocked) {
              const bOverlapStart = Math.max(bw.startMinutes, overlapStart);
              const bOverlapEnd = Math.min(bw.endMinutes, overlapEnd);
              if (bOverlapEnd > bOverlapStart) {
                availableMinutes -= (bOverlapEnd - bOverlapStart);
              }
            }
            if (availableMinutes < durationMinutes) continue;

            hasProvider = true;
            const isPrimary = pa.role === "PRIMARY";
            const daysFromNow = Math.floor(
              (new Date(dateStr + "T00:00:00Z").getTime() - now.getTime()) / 86400_000
            );
            const score = (isPrimary ? 40 : 15) + Math.max(0, 14 - daysFromNow) * 2;
            bestScore = Math.max(bestScore, score);
          }

          if (hasProvider) {
            fb.feasibility_score = bestScore;
            fallbacks.push(fb);
          }
        }
      }

      // Combine specific windows + fallback, preferring specific
      finalCandidates = [...candidates, ...fallbacks];
    }

    // ── Step 8: Sort and trim to max_windows_shown ──
    finalCandidates.sort((a, b) => {
      // Prefer non-fallback over fallback
      if (a.is_fallback !== b.is_fallback) return a.is_fallback ? 1 : -1;
      // Then by feasibility score (higher = better)
      if (b.feasibility_score !== a.feasibility_score) return b.feasibility_score - a.feasibility_score;
      // Then by date (sooner = better)
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      // Then by window start time
      return a.window_start_minutes - b.window_start_minutes;
    });

    const offered = finalCandidates.slice(0, dials.max_windows_shown);

    // ── Step 9: Format response ──
    const windows: OfferedWindow[] = offered.map((c) => {
      const startIso = new Date(`${c.date}T${c.window_start}:00Z`).toISOString();
      const endIso = new Date(`${c.date}T${c.window_end}:00Z`).toISOString();
      return {
        date: c.date,
        window_label: c.window_label,
        window_start: startIso,
        window_end: endIso,
        template_id: c.template_id,
        feasibility_score: c.feasibility_score,
        is_fallback: c.is_fallback,
      };
    });

    return new Response(
      JSON.stringify({
        ok: true,
        windows,
        total_candidates_evaluated: finalCandidates.length,
        specific_templates_found: candidates.length,
        fallback_used: offered.some((w) => w.is_fallback),
        config: {
          max_windows_shown: dials.max_windows_shown,
          min_windows_to_show: dials.min_windows_to_show,
          min_lead_time_hours: dials.min_lead_time_hours,
          default_window_length_hours: dials.default_appointment_window_length_hours,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("offer-appointment-windows error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
