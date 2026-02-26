import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function geohashPrefixDistance(a: string | null, b: string | null): number {
  if (!a || !b) return 999;
  let shared = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) shared++;
    else break;
  }
  const scales = [5000, 1250, 156, 39, 5, 1.2, 0.3, 0.07];
  return scales[Math.min(shared, scales.length - 1)] ?? 0.01;
}

interface JobWithLocation {
  id: string;
  lat: number | null;
  lng: number | null;
  geohash: string | null;
}

function nearestNeighborOrder(
  jobs: JobWithLocation[],
  startLat: number | null,
  startLng: number | null,
  startGeohash: string | null,
): string[] {
  if (jobs.length === 0) return [];

  const remaining = [...jobs];
  const ordered: string[] = [];
  let currentLat = startLat;
  let currentLng = startLng;
  let currentGeohash = startGeohash;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const job = remaining[i];
      let dist: number;

      if (currentLat != null && currentLng != null && job.lat != null && job.lng != null) {
        dist = haversine(currentLat, currentLng, job.lat, job.lng);
      } else {
        dist = geohashPrefixDistance(currentGeohash, job.geohash);
      }

      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next.id);
    currentLat = next.lat;
    currentLng = next.lng;
    currentGeohash = next.geohash;
  }

  return ordered;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // === Finding #2: Authorization check ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    ).auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { provider_org_id, date } = await req.json();

    if (!provider_org_id || !date) {
      return new Response(
        JSON.stringify({ error: "provider_org_id and date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify caller is a member of this provider org
    const { data: membership } = await supabase
      .from("provider_members")
      .select("id")
      .eq("provider_org_id", provider_org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Not authorized for this provider organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Log run start
    const { data: runLog } = await supabase
      .from("cron_run_log")
      .insert({
        function_name: "optimize-routes",
        idempotency_key: `optimize-routes-${provider_org_id}-${date}-${Date.now()}`,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    try {
      // Get provider home base
      const { data: org } = await supabase
        .from("provider_orgs")
        .select("home_base_zip")
        .eq("id", provider_org_id)
        .single();

      // === Finding #6: Fix .not() syntax — no quotes around values ===
      const { data: allJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, property_id, status, route_order")
        .eq("provider_org_id", provider_org_id)
        .eq("scheduled_date", date)
        .not("status", "in", "(COMPLETED,CANCELED)");

      if (jobsError) throw jobsError;

      if (!allJobs || allJobs.length === 0) {
        if (runLog) {
          await supabase
            .from("cron_run_log")
            .update({ status: "completed", completed_at: new Date().toISOString(), result_summary: { optimized: 0 } })
            .eq("id", runLog.id);
        }
        return new Response(
          JSON.stringify({ status: "ok", optimized: 0, message: "No jobs to optimize" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Separate pinned (IN_PROGRESS) jobs from optimizable (NOT_STARTED) jobs
      const pinnedJobs = allJobs.filter((j) => j.status === "IN_PROGRESS");
      const jobs = allJobs.filter((j) => j.status !== "IN_PROGRESS");

      // === Finding #9 (aligned): Guard at < 3 optimizable jobs ===
      if (jobs.length < 3) {
        if (runLog) {
          await supabase
            .from("cron_run_log")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              result_summary: { optimized: 0, skipped_reason: "too_few_jobs", total: allJobs.length, pinned: pinnedJobs.length },
            })
            .eq("id", runLog.id);
        }
        return new Response(
          JSON.stringify({ status: "ok", optimized: 0, message: "Too few jobs to optimize" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Get property locations
      const propertyIds = [...new Set(jobs.map((j) => j.property_id))];
      const { data: properties } = await supabase
        .from("properties")
        .select("id, lat, lng, geohash, zip_code")
        .in("id", propertyIds);

      const propMap = new Map(
        (properties || []).map((p) => [p.id, { lat: p.lat, lng: p.lng, geohash: p.geohash, zip_code: p.zip_code }]),
      );

      // Build job list with locations
      const jobsWithLoc: JobWithLocation[] = jobs.map((j) => {
        const prop = propMap.get(j.property_id);
        return {
          id: j.id,
          lat: prop?.lat ?? null,
          lng: prop?.lng ?? null,
          geohash: prop?.geohash ?? null,
        };
      });

      // === Finding #4: Fix start location — use first job's location instead of always-null ===
      // If we had geocoding for home_base_zip we'd use that; for MVP use the first job's coords
      const firstJobWithCoords = jobsWithLoc.find((j) => j.lat != null && j.lng != null);
      const startLat = firstJobWithCoords?.lat ?? null;
      const startLng = firstJobWithCoords?.lng ?? null;
      const startGeohash = jobsWithLoc[0]?.geohash ?? null;

      // Run nearest-neighbor
      const orderedIds = nearestNeighborOrder(jobsWithLoc, startLat, startLng, startGeohash);

      // Write route_order back
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from("jobs")
          .update({ route_order: i + 1, updated_at: new Date().toISOString() })
          .eq("id", orderedIds[i]);
      }

      // C4: Emit PROVIDER_ROUTE_UPDATED notification
      await supabase.rpc("emit_notification_event", {
        p_event_type: "PROVIDER_ROUTE_UPDATED",
        p_idempotency_key: `route_updated:${provider_org_id}:${date}`,
        p_audience_type: "PROVIDER",
        p_audience_org_id: provider_org_id,
        p_priority: "NORMAL",
        p_payload: {
          date,
          job_count: orderedIds.length,
        },
      });

      // Update log
      if (runLog) {
        await supabase
          .from("cron_run_log")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            result_summary: { optimized: orderedIds.length, provider_org_id, date },
          })
          .eq("id", runLog.id);
      }

      return new Response(
        JSON.stringify({ status: "ok", optimized: orderedIds.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (innerErr) {
      if (runLog) {
        await supabase
          .from("cron_run_log")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: String(innerErr),
          })
          .eq("id", runLog.id);
      }
      throw innerErr;
    }
  } catch (err) {
    console.error("optimize-routes error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
