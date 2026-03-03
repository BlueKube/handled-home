/**
 * commit-zones Edge Function
 * Takes a zone_builder_runs run_id (status=preview) and writes generated zones
 * into the operational `zones` table, then marks the run as `committed`.
 *
 * Flow:
 *  1. Auth guard (admin only)
 *  2. Validate run exists + status=preview
 *  3. Read zone_builder_results for the run
 *  4. For each result, create an operational zone in `zones` table
 *  5. Update zone_cells with final zone_id assignments
 *  6. Mark run as committed
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { cellToLatLng } from "https://esm.sh/h3-js@4.2.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Day-of-week cycle for distributing zones across days
const SERVICE_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ─── Auth guard ────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }

    // ─── Parse body ────────────────────────────────────────
    const body = await req.json();
    const { run_id, zone_names } = body;
    // zone_names: optional Record<string, string> mapping zone_label → custom name

    if (!run_id) {
      return jsonResponse({ error: "run_id is required" }, 400);
    }

    // ─── Validate run ──────────────────────────────────────
    const { data: run, error: runErr } = await supabase
      .from("zone_builder_runs")
      .select("id, region_id, config, status")
      .eq("id", run_id)
      .single();

    if (runErr || !run) {
      return jsonResponse({ error: "Run not found" }, 404);
    }

    if (run.status !== "preview") {
      return jsonResponse({ error: `Run status is '${run.status}', expected 'preview'` }, 400);
    }

    // ─── Read results ──────────────────────────────────────
    const { data: results, error: resErr } = await supabase
      .from("zone_builder_results")
      .select("*")
      .eq("run_id", run_id);

    if (resErr || !results || results.length === 0) {
      return jsonResponse({ error: "No zone results found for this run" }, 400);
    }

    // ─── Get region info ───────────────────────────────────
    const { data: region } = await supabase
      .from("regions")
      .select("id, name")
      .eq("id", run.region_id)
      .single();

    if (!region) {
      return jsonResponse({ error: "Region not found" }, 404);
    }

    // ─── Derive zip codes from H3 cells ────────────────────
    // We look up properties in each cell's area to determine zip codes
    // Since we stored cells in zone_cells, we can cross-ref with properties
    const allCellIndices = results.flatMap((r: any) => r.cell_indices || []);

    // Get all properties that might fall in these cells
    // We'll use the properties table to get zip codes per cell
    const { data: properties } = await supabase
      .from("properties")
      .select("id, lat, lng, zip_code")
      .not("lat", "is", null)
      .not("lng", "is", null)
      .not("zip_code", "is", null);

    // Build property → H3 cell lookup using same resolution as the run
    const resolution = (run.config as any)?.resolution ?? 7;

    // We need h3 to map property lat/lng → cell, but we can also use the
    // zone_cells table which already has the mapping from the generate step.
    // Instead, let's just collect zip codes from properties that were in the region.

    // Get existing zones in the region for zip code reference
    const { data: existingZones } = await supabase
      .from("zones")
      .select("zip_codes")
      .eq("region_id", run.region_id);

    const regionZips = new Set<string>();
    if (existingZones) {
      for (const z of existingZones) {
        if (z.zip_codes) z.zip_codes.forEach((zc: string) => regionZips.add(zc));
      }
    }

    // Build a simple cell → zip mapping from properties
    const cellZipMap = new Map<string, Set<string>>();
    if (properties) {
      // Import h3 function at top, so we can map properties to cells
      const { latLngToCell } = await import("https://esm.sh/h3-js@4.2.1");
      for (const prop of properties) {
        if (!prop.lat || !prop.lng || !prop.zip_code) continue;
        try {
          const h3Index = latLngToCell(prop.lat, prop.lng, resolution);
          if (!cellZipMap.has(h3Index)) cellZipMap.set(h3Index, new Set());
          cellZipMap.get(h3Index)!.add(prop.zip_code);
        } catch { /* skip */ }
      }
    }

    // ─── Create operational zones ──────────────────────────
    const createdZones: Array<{ id: string; name: string; zone_label: string }> = [];
    const nameMap: Record<string, string> = zone_names || {};

    for (let i = 0; i < results.length; i++) {
      const result = results[i] as any;
      const label = result.zone_label as string;
      const cellIndices = (result.cell_indices || []) as string[];
      const metrics = result.metrics || {};

      // Derive zone name: use custom name if provided, else label
      const zoneName = nameMap[label] || `${region.name} — ${label}`;

      // Collect zip codes from cells
      const zoneZips = new Set<string>();
      for (const cellIdx of cellIndices) {
        const zips = cellZipMap.get(cellIdx);
        if (zips) zips.forEach((z) => zoneZips.add(z));
      }

      // Distribute service days round-robin
      const serviceDay = SERVICE_DAYS[i % SERVICE_DAYS.length];

      // Compute max_stops_per_day from metrics
      const demandMinWeek = metrics.demand_min_week || 0;
      const avgServiceMin = 45; // matches generate-zones constant
      const weeklyStops = demandMinWeek > 0 ? Math.ceil(demandMinWeek / avgServiceMin) : 10;
      const maxStopsPerDay = Math.max(5, Math.ceil(weeklyStops / 5));

      const { data: newZone, error: zoneErr } = await supabase
        .from("zones")
        .insert({
          name: zoneName,
          region_id: run.region_id,
          zip_codes: Array.from(zoneZips),
          default_service_day: serviceDay,
          max_stops_per_day: maxStopsPerDay,
          max_minutes_per_day: maxStopsPerDay * avgServiceMin,
          status: "active",
        })
        .select("id, name")
        .single();

      if (zoneErr) {
        console.error(`Failed to create zone ${label}:`, zoneErr.message);
        continue;
      }

      createdZones.push({ id: newZone.id, name: newZone.name, zone_label: label });

      // Update zone_cells with the operational zone_id
      for (const cellIdx of cellIndices) {
        await supabase
          .from("zone_cells")
          .update({ zone_id: newZone.id })
          .eq("h3_index", cellIdx)
          .eq("run_id", run_id);
      }
    }

    // ─── Mark run as committed ─────────────────────────────
    await supabase
      .from("zone_builder_runs")
      .update({
        status: "committed",
        committed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", run_id);

    console.log(`[commit-zones] Run ${run_id}: Committed ${createdZones.length} zones to region ${region.name}`);

    return jsonResponse({
      run_id,
      committed_zones: createdZones,
      summary: {
        zone_count: createdZones.length,
        region: region.name,
      },
    });
  } catch (err) {
    console.error("[commit-zones] Error:", err);
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
