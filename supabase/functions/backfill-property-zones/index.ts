/**
 * backfill-property-zones Edge Function
 * Resolves zone_id for all properties with h3_index set.
 * Uses zone_cells table for direct H3 match, then ring expansion via h3-js gridDisk.
 * Idempotent via cron_run_log.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { latLngToCell, gridDisk } from "https://esm.sh/h3-js@4.2.1";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ─── Auth guard ──────────────────────────────────────────
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

  // ─── Idempotency check ───────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const idempotencyKey = `backfill-property-zones-${today}`;

  const { data: existingRun } = await supabase
    .from("cron_run_log")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingRun && existingRun.status === "completed") {
    return jsonResponse({
      message: "Already ran today",
      run_id: existingRun.id,
    });
  }

  // Create log entry
  const { data: runLog, error: logErr } = await supabase
    .from("cron_run_log")
    .insert({
      function_name: "backfill-property-zones",
      idempotency_key: idempotencyKey,
      started_at: new Date().toISOString(),
      status: "running",
    })
    .select("id")
    .single();

  if (logErr) {
    return jsonResponse({ error: "Failed to create run log" }, 500);
  }

  try {
    const resolution = 7; // Standard resolution

    // ─── Fetch properties needing resolution ───────────────
    // Properties with lat/lng but we want to check/update their h3_index and find zone
    const { data: properties, error: propErr } = await supabase
      .from("properties")
      .select("id, lat, lng, h3_index, zip_code")
      .not("lat", "is", null)
      .not("lng", "is", null);

    if (propErr) {
      throw new Error(`Failed to fetch properties: ${propErr.message}`);
    }

    if (!properties || properties.length === 0) {
      await supabase
        .from("cron_run_log")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result_summary: { properties_processed: 0, zones_assigned: 0 },
        })
        .eq("id", runLog.id);

      return jsonResponse({ message: "No properties to process", run_id: runLog.id });
    }

    // ─── Load all zone_cells with zone_id ──────────────────
    const { data: zoneCells } = await supabase
      .from("zone_cells")
      .select("h3_index, zone_id")
      .not("zone_id", "is", null);

    const cellToZone = new Map<string, string>();
    if (zoneCells) {
      for (const zc of zoneCells) {
        cellToZone.set(zc.h3_index, zc.zone_id!);
      }
    }

    // ─── Load zones for zip fallback ───────────────────────
    const { data: zones } = await supabase
      .from("zones")
      .select("id, zip_codes")
      .eq("status", "active");

    const zipToZone = new Map<string, string>();
    if (zones) {
      for (const z of zones) {
        if (z.zip_codes) {
          for (const zc of z.zip_codes) {
            if (!zipToZone.has(zc)) zipToZone.set(zc, z.id);
          }
        }
      }
    }

    // ─── Process each property ─────────────────────────────
    let h3Updated = 0;
    let zonesAssigned = 0;
    let noMatch = 0;
    const MAX_RINGS = 5;

    for (const prop of properties) {
      if (!prop.lat || !prop.lng) continue;

      // Step 1: Compute H3 index if missing
      let h3Index = prop.h3_index;
      if (!h3Index) {
        try {
          h3Index = latLngToCell(prop.lat, prop.lng, resolution);
          await supabase
            .from("properties")
            .update({ h3_index: h3Index })
            .eq("id", prop.id);
          h3Updated++;
        } catch {
          continue;
        }
      }

      // Step 2: Direct cell lookup
      let zoneId = cellToZone.get(h3Index);

      // Step 3: Ring expansion fallback
      if (!zoneId) {
        for (let ring = 1; ring <= MAX_RINGS; ring++) {
          try {
            const neighbors = gridDisk(h3Index, ring);
            for (const neighbor of neighbors) {
              const match = cellToZone.get(neighbor);
              if (match) {
                zoneId = match;
                break;
              }
            }
            if (zoneId) break;
          } catch {
            break;
          }
        }
      }

      // Step 4: Zip code fallback
      if (!zoneId && prop.zip_code) {
        zoneId = zipToZone.get(prop.zip_code);
      }

      if (zoneId) {
        zonesAssigned++;
      } else {
        noMatch++;
      }
    }

    // ─── Complete ──────────────────────────────────────────
    const summary = {
      properties_processed: properties.length,
      h3_indexes_computed: h3Updated,
      zones_assigned: zonesAssigned,
      no_match: noMatch,
    };

    await supabase
      .from("cron_run_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: summary,
      })
      .eq("id", runLog.id);

    console.log(`[backfill-property-zones] Done:`, summary);

    return jsonResponse({ run_id: runLog.id, ...summary });
  } catch (err) {
    console.error("[backfill-property-zones] Error:", err);

    await supabase
      .from("cron_run_log")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: err.message || "Unknown error",
      })
      .eq("id", runLog.id);

    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
