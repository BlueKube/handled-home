/**
 * generate-zones Edge Function
 * Core zone generation algorithm for the Zone Builder.
 *
 * Steps:
 *  0. Cell aggregation — properties + providers → H3 cells with demand/supply
 *  1. Cell scoring + seed selection
 *  2. Region-growing with cost function
 *  3. Feasibility constraints + warnings
 *  4. Refinement pass (merge tiny, split oversized, boundary swaps)
 *  5. Write results to zone_builder_results, update run to "preview"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  latLngToCell,
  cellToLatLng,
  gridDisk,
  gridRingUnsafe,
  gridDistance,
  cellArea,
  isValidCell,
} from "https://esm.sh/h3-js@4.2.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Constants ─────────────────────────────────────────────
const DEFAULT_RESOLUTION = 7;
const SEED_WEIGHTS = { demand: 0.55, supply: 0.35, walkability: 0.10 };
const MIN_SEED_SPACING = 3;
const CITY_MULTIPLIER = 1.4;
const AVG_SPEED_KMH = 35;
const EARTH_RADIUS_KM = 6371;

// ─── Types ─────────────────────────────────────────────────
interface GenerateConfig {
  resolution: number;
  seed_strategy: "auto" | "demand_first" | "provider_first";
  target_workload_days: number; // provider-days/week target per zone
  max_spread_minutes: number;   // max drive-time spread
  min_density: number;          // min customers/km²
}

interface CellData {
  h3Index: string;
  demandMinutesWeek: number;
  supplyMinutesWeek: number;
  customerCount: number;
  providerCount: number;
  categoryDemand: Record<string, number>;
  categorySupply: Record<string, number>;
}

interface ZoneResult {
  zone_label: string;
  cell_indices: string[];
  metrics: Record<string, number>;
  warnings: string[];
  neighbor_zone_labels: string[];
}

// ─── Helpers ───────────────────────────────────────────────
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDriveMin(cellA: string, cellB: string): number {
  const [latA, lngA] = cellToLatLng(cellA);
  const [latB, lngB] = cellToLatLng(cellB);
  return ((haversineKm(latA, lngA, latB, lngB) * CITY_MULTIPLIER) / AVG_SPEED_KMH) * 60;
}

function normalize(value: number, min: number, max: number): number {
  return max === min ? 0.5 : (value - min) / (max - min);
}

function computeSeedScore(cell: CellData, allCells: CellData[], strategy: string): number {
  const demands = allCells.map((c) => c.demandMinutesWeek);
  const supplies = allCells.map((c) => c.supplyMinutesWeek);
  const densities = allCells.map((c) => c.customerCount + c.providerCount);

  const d = normalize(cell.demandMinutesWeek, Math.min(...demands), Math.max(...demands));
  const s = normalize(cell.supplyMinutesWeek, Math.min(...supplies), Math.max(...supplies));
  const w = normalize(cell.customerCount + cell.providerCount, Math.min(...densities), Math.max(...densities));

  if (strategy === "demand_first") return d;
  if (strategy === "provider_first") return s;
  return SEED_WEIGHTS.demand * d + SEED_WEIGHTS.supply * s + SEED_WEIGHTS.walkability * w;
}

function safeGridDistance(a: string, b: string): number {
  try {
    return gridDistance(a, b);
  } catch {
    return -1;
  }
}

// ─── Step 0: Cell Aggregation ──────────────────────────────
async function aggregateCells(
  supabase: ReturnType<typeof createClient>,
  regionId: string,
  resolution: number,
  runId: string
): Promise<CellData[]> {
  // Get all zones in the region to find zip codes
  const { data: zones } = await supabase
    .from("zones")
    .select("zip_codes")
    .eq("region_id", regionId);

  // Collect all zip codes for the region
  const regionZips = new Set<string>();
  if (zones) {
    for (const z of zones) {
      if (z.zip_codes) z.zip_codes.forEach((zc: string) => regionZips.add(zc));
    }
  }

  // If no existing zones, get properties directly — we'll use all properties
  // in the region (matched via zip code or just all if no zip filter)
  let propertyQuery = supabase
    .from("properties")
    .select("id, lat, lng, zip_code, user_id")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (regionZips.size > 0) {
    propertyQuery = propertyQuery.in("zip_code", Array.from(regionZips));
  }

  const { data: properties, error: propErr } = await propertyQuery;
  if (propErr) throw new Error(`Properties query failed: ${propErr.message}`);

  // Get active subscriptions for demand
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("customer_id, property_id, plan_id, status")
    .eq("status", "active");

  // Get routine items for duration estimates
  const { data: routineItems } = await supabase
    .from("routine_items")
    .select("routine_version_id, sku_id, duration_minutes, cadence_type");

  // Get provider work profiles
  const { data: providers } = await supabase
    .from("provider_work_profiles")
    .select("provider_org_id, home_lat, home_lng, max_jobs_per_day, service_categories, working_hours")
    .not("home_lat", "is", null)
    .not("home_lng", "is", null);

  // Get service_skus for category mapping
  const { data: skus } = await supabase
    .from("service_skus")
    .select("id, category_key");

  const skuCategoryMap: Record<string, string> = {};
  if (skus) {
    for (const s of skus) {
      skuCategoryMap[s.id] = s.category_key;
    }
  }

  // Build cell map
  const cellMap = new Map<string, CellData>();

  const getOrCreate = (h3Index: string): CellData => {
    if (!cellMap.has(h3Index)) {
      cellMap.set(h3Index, {
        h3Index,
        demandMinutesWeek: 0,
        supplyMinutesWeek: 0,
        customerCount: 0,
        providerCount: 0,
        categoryDemand: {},
        categorySupply: {},
      });
    }
    return cellMap.get(h3Index)!;
  };

  // Map subscription property_ids for lookup
  const subsByProperty = new Map<string, number>();
  if (subscriptions) {
    for (const sub of subscriptions) {
      if (sub.property_id) {
        subsByProperty.set(sub.property_id, (subsByProperty.get(sub.property_id) || 0) + 1);
      }
    }
  }

  // Aggregate properties → demand
  const AVG_SERVICE_MINUTES = 45; // default estimate per weekly visit
  if (properties) {
    for (const prop of properties) {
      if (!prop.lat || !prop.lng) continue;
      const h3Index = latLngToCell(prop.lat, prop.lng, resolution);
      const cell = getOrCreate(h3Index);
      cell.customerCount += 1;

      const subCount = subsByProperty.get(prop.id) || 0;
      const demandMin = subCount * AVG_SERVICE_MINUTES;
      cell.demandMinutesWeek += demandMin;

      // Category demand (simplified: count per category from routine_items)
      // In v1, just add total demand to "lawn_care" as default
      cell.categoryDemand["lawn_care"] = (cell.categoryDemand["lawn_care"] || 0) + demandMin;
    }
  }

  // Aggregate providers → supply
  if (providers) {
    for (const prov of providers) {
      if (!prov.home_lat || !prov.home_lng) continue;
      const h3Index = latLngToCell(prov.home_lat, prov.home_lng, resolution);
      const cell = getOrCreate(h3Index);
      cell.providerCount += 1;

      // Estimate weekly supply: max_jobs_per_day * 5 workdays * AVG_SERVICE_MINUTES
      const weeklySupply = (prov.max_jobs_per_day || 6) * 5 * AVG_SERVICE_MINUTES;
      cell.supplyMinutesWeek += weeklySupply;

      // Category supply
      if (prov.service_categories) {
        for (const cat of prov.service_categories) {
          cell.categorySupply[cat] = (cell.categorySupply[cat] || 0) + weeklySupply / prov.service_categories.length;
        }
      }
    }
  }

  const cells = Array.from(cellMap.values());

  // Write cells to zone_cells table
  if (cells.length > 0) {
    // Delete previous cells for this run
    await supabase.from("zone_cells").delete().eq("run_id", runId);

    // Insert in batches of 200
    for (let i = 0; i < cells.length; i += 200) {
      const batch = cells.slice(i, i + 200).map((c) => ({
        h3_index: c.h3Index,
        run_id: runId,
        zone_id: null,
        demand_minutes_week: Math.round(c.demandMinutesWeek),
        supply_minutes_week: Math.round(c.supplyMinutesWeek),
        customer_count: c.customerCount,
        provider_count: c.providerCount,
        category_demand: c.categoryDemand,
        category_supply: c.categorySupply,
      }));
      const { error } = await supabase.from("zone_cells").upsert(batch, { onConflict: "h3_index" });
      if (error) console.error("Cell upsert batch error:", error.message);
    }
  }

  return cells;
}

// ─── Step 1-2: Seed Selection ──────────────────────────────
function selectSeeds(
  cells: CellData[],
  targetZoneCount: number,
  strategy: string
): string[] {
  if (cells.length === 0 || targetZoneCount <= 0) return [];

  const scored = cells.map((c) => ({
    h3Index: c.h3Index,
    score: computeSeedScore(c, cells, strategy),
  }));
  scored.sort((a, b) => b.score - a.score);

  const seeds: string[] = [];
  for (const candidate of scored) {
    if (seeds.length >= targetZoneCount) break;
    const tooClose = seeds.some((existing) => {
      const dist = safeGridDistance(candidate.h3Index, existing);
      return dist >= 0 && dist < MIN_SEED_SPACING;
    });
    if (!tooClose) seeds.push(candidate.h3Index);
  }
  return seeds;
}

// ─── Step 3: Region-Growing ────────────────────────────────
function regionGrow(
  cells: CellData[],
  seeds: string[],
  config: GenerateConfig
): Map<string, string[]> {
  const cellLookup = new Map<string, CellData>();
  for (const c of cells) cellLookup.set(c.h3Index, c);

  const assigned = new Map<string, number>(); // h3Index → zone index
  const zones = new Map<string, string[]>(); // zone label → cell indices
  const zoneDemand = new Map<string, number>(); // zone label → total demand

  // Target demand per zone: total demand / zone count
  const totalDemand = cells.reduce((s, c) => s + c.demandMinutesWeek, 0);
  // Target workload in minutes: target_workload_days * 8h * 60min
  const targetDemandPerZone = config.target_workload_days * 8 * 60;

  // Initialize seeds
  seeds.forEach((seed, i) => {
    const label = `Zone-${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ""}`;
    assigned.set(seed, i);
    zones.set(label, [seed]);
    const seedCell = cellLookup.get(seed);
    zoneDemand.set(label, seedCell?.demandMinutesWeek || 0);
  });

  const zoneLabels = Array.from(zones.keys());

  // Greedy expansion
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 500;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    for (let zi = 0; zi < zoneLabels.length; zi++) {
      const label = zoneLabels[zi];
      const zoneCells = zones.get(label)!;
      const currentDemand = zoneDemand.get(label) || 0;

      if (currentDemand >= targetDemandPerZone) continue; // zone at capacity

      // Find frontier: unassigned neighbors of zone cells
      const frontier: Array<{ h3Index: string; cost: number }> = [];
      const seen = new Set<string>();

      for (const zc of zoneCells) {
        let neighbors: string[];
        try {
          neighbors = gridRingUnsafe(zc, 1);
        } catch {
          continue;
        }
        for (const nb of neighbors) {
          if (assigned.has(nb) || seen.has(nb) || !isValidCell(nb)) continue;
          seen.add(nb);

          const nbCell = cellLookup.get(nb);
          if (!nbCell) continue; // cell has no data, skip

          // Cost function: lower is better
          // We want high demand cells close to the zone center
          const seedCell = zoneCells[0]; // seed is first cell
          const distToSeed = estimateDriveMin(nb, seedCell);

          // Check max spread
          if (distToSeed > config.max_spread_minutes) continue;

          // Cost = distance - demand_benefit
          const demandBenefit = nbCell.demandMinutesWeek / (targetDemandPerZone || 1);
          const cost = distToSeed / config.max_spread_minutes - demandBenefit;

          frontier.push({ h3Index: nb, cost });
        }
      }

      // Sort frontier by cost (lowest first = best candidates)
      frontier.sort((a, b) => a.cost - b.cost);

      // Add best candidate
      if (frontier.length > 0) {
        const best = frontier[0];
        assigned.set(best.h3Index, zi);
        zoneCells.push(best.h3Index);
        const bestCell = cellLookup.get(best.h3Index);
        zoneDemand.set(label, currentDemand + (bestCell?.demandMinutesWeek || 0));
        changed = true;
      }
    }
  }

  // Assign remaining unassigned cells to nearest zone
  for (const cell of cells) {
    if (assigned.has(cell.h3Index)) continue;
    let bestZone = zoneLabels[0];
    let bestDist = Infinity;
    for (const label of zoneLabels) {
      const seed = zones.get(label)![0];
      const dist = estimateDriveMin(cell.h3Index, seed);
      if (dist < bestDist) {
        bestDist = dist;
        bestZone = label;
      }
    }
    zones.get(bestZone)!.push(cell.h3Index);
  }

  return zones;
}

// ─── Step 4: Feasibility Checks ────────────────────────────
function computeZoneMetrics(
  cellIndices: string[],
  cellLookup: Map<string, CellData>
): Record<string, number> {
  const cells = cellIndices.map((idx) => cellLookup.get(idx)).filter(Boolean) as CellData[];
  const demandMinWeek = cells.reduce((s, c) => s + c.demandMinutesWeek, 0);
  const supplyMinWeek = cells.reduce((s, c) => s + c.supplyMinutesWeek, 0);
  const sdRatio = demandMinWeek > 0 ? supplyMinWeek / demandMinWeek : 0;
  const totalCustomers = cells.reduce((s, c) => s + c.customerCount, 0);
  const totalProviders = cells.reduce((s, c) => s + c.providerCount, 0);

  let totalAreaKm2 = 0;
  for (const idx of cellIndices) {
    try { totalAreaKm2 += cellArea(idx, "km2"); } catch { /* skip */ }
  }

  const density = totalAreaKm2 > 0 ? totalCustomers / totalAreaKm2 : 0;

  // Max spread
  let maxDriveMin = 0;
  if (cellIndices.length >= 2) {
    // Sample extremes instead of O(n²) for large zones
    const sampleSize = Math.min(cellIndices.length, 20);
    const sample = cellIndices.length <= 20
      ? cellIndices
      : cellIndices.filter((_, i) => i % Math.floor(cellIndices.length / sampleSize) === 0);
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        const d = estimateDriveMin(sample[i], sample[j]);
        if (d > maxDriveMin) maxDriveMin = d;
      }
    }
  }

  // Compactness
  let maxGridDist = 0;
  if (cellIndices.length >= 2) {
    const sample = cellIndices.slice(0, Math.min(20, cellIndices.length));
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        const d = safeGridDistance(sample[i], sample[j]);
        if (d > maxGridDist) maxGridDist = d;
      }
    }
  }
  const R = Math.ceil(maxGridDist / 2);
  const idealCells = R > 0 ? 3 * R * R + 3 * R + 1 : 1;
  const compactness = Math.min(1, cellIndices.length / idealCells);

  return {
    demand_min_week: Math.round(demandMinWeek),
    supply_min_week: Math.round(supplyMinWeek),
    sd_ratio: Math.round(sdRatio * 100) / 100,
    density: Math.round(density * 100) / 100,
    compactness: Math.round(compactness * 100) / 100,
    max_spread_drive_min: Math.round(maxDriveMin * 10) / 10,
    max_spread_cells: maxGridDist,
    cell_count: cellIndices.length,
    total_area_km2: Math.round(totalAreaKm2 * 100) / 100,
    customer_count: totalCustomers,
    provider_count: totalProviders,
  };
}

function checkWarnings(metrics: Record<string, number>, config: GenerateConfig): string[] {
  const warnings: string[] = [];
  if (metrics.density < config.min_density && metrics.cell_count > 0) warnings.push("too_sparse");
  if (metrics.sd_ratio > 2.0) warnings.push("overloaded");
  if (metrics.sd_ratio < 0.3 && metrics.demand_min_week > 0) warnings.push("undersupplied");
  if (metrics.max_spread_drive_min > config.max_spread_minutes * 1.2) warnings.push("too_large");
  if (metrics.cell_count < 3) warnings.push("too_small");
  return warnings;
}

// ─── Step 5: Refinement ────────────────────────────────────
function refineZones(
  zones: Map<string, string[]>,
  cellLookup: Map<string, CellData>,
  config: GenerateConfig
): Map<string, string[]> {
  const zoneLabels = Array.from(zones.keys());
  const targetDemandPerZone = config.target_workload_days * 8 * 60;

  // Merge tiny zones (<30% of target demand)
  const toMerge: string[] = [];
  for (const label of zoneLabels) {
    const cells = zones.get(label)!;
    const demand = cells.reduce((s, idx) => s + (cellLookup.get(idx)?.demandMinutesWeek || 0), 0);
    if (demand < targetDemandPerZone * 0.3 && cells.length < 3) {
      toMerge.push(label);
    }
  }

  for (const tinyLabel of toMerge) {
    const tinyCells = zones.get(tinyLabel);
    if (!tinyCells || tinyCells.length === 0) continue;

    // Find nearest neighbor zone
    let bestNeighbor = "";
    let bestDist = Infinity;
    for (const label of zoneLabels) {
      if (label === tinyLabel || !zones.has(label)) continue;
      const neighborSeed = zones.get(label)![0];
      const dist = estimateDriveMin(tinyCells[0], neighborSeed);
      if (dist < bestDist) {
        bestDist = dist;
        bestNeighbor = label;
      }
    }

    if (bestNeighbor) {
      zones.get(bestNeighbor)!.push(...tinyCells);
      zones.delete(tinyLabel);
    }
  }

  // Split oversized zones (>200% target demand)
  const oversized: string[] = [];
  for (const [label, cells] of zones) {
    const demand = cells.reduce((s, idx) => s + (cellLookup.get(idx)?.demandMinutesWeek || 0), 0);
    if (demand > targetDemandPerZone * 2 && cells.length >= 8) {
      oversized.push(label);
    }
  }

  for (const label of oversized) {
    const cells = zones.get(label)!;
    // Simple split: divide cells roughly in half by sorting by lat
    const sorted = [...cells].sort((a, b) => {
      const [latA] = cellToLatLng(a);
      const [latB] = cellToLatLng(b);
      return latA - latB;
    });

    const mid = Math.floor(sorted.length / 2);
    const newLabel = `${label}-S`;
    zones.set(label, sorted.slice(0, mid));
    zones.set(newLabel, sorted.slice(mid));
  }

  return zones;
}

// ─── Find Neighbor Zones ───────────────────────────────────
function findNeighborZones(
  zones: Map<string, string[]>
): Map<string, string[]> {
  // Build reverse lookup: h3Index → zone label
  const cellToZone = new Map<string, string>();
  for (const [label, cells] of zones) {
    for (const c of cells) cellToZone.set(c, label);
  }

  const neighbors = new Map<string, Set<string>>();
  for (const label of zones.keys()) neighbors.set(label, new Set());

  for (const [label, cells] of zones) {
    for (const c of cells) {
      let ring: string[];
      try { ring = gridRingUnsafe(c, 1); } catch { continue; }
      for (const nb of ring) {
        const nbZone = cellToZone.get(nb);
        if (nbZone && nbZone !== label) {
          neighbors.get(label)!.add(nbZone);
        }
      }
    }
  }

  const result = new Map<string, string[]>();
  for (const [label, nbSet] of neighbors) {
    result.set(label, Array.from(nbSet));
  }
  return result;
}

// ─── Main Handler ──────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user from auth header if available
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    const body = await req.json();
    const { region_id, config: userConfig } = body;

    if (!region_id) {
      return new Response(JSON.stringify({ error: "region_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config: GenerateConfig = {
      resolution: userConfig?.resolution ?? DEFAULT_RESOLUTION,
      seed_strategy: userConfig?.seed_strategy ?? "auto",
      target_workload_days: userConfig?.target_workload_days ?? 4,
      max_spread_minutes: userConfig?.max_spread_minutes ?? 15,
      min_density: userConfig?.min_density ?? 0.5,
    };

    // P2-01: Create run
    const { data: run, error: runErr } = await supabase
      .from("zone_builder_runs")
      .insert({
        region_id,
        config: config as unknown as Record<string, unknown>,
        created_by: userId || "00000000-0000-0000-0000-000000000000",
        status: "draft",
      })
      .select("id")
      .single();

    if (runErr || !run) {
      return new Response(JSON.stringify({ error: `Failed to create run: ${runErr?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const runId = run.id;

    // P2-02: Cell aggregation
    console.log(`[generate-zones] Run ${runId}: Aggregating cells for region ${region_id}`);
    const cells = await aggregateCells(supabase, region_id, config.resolution, runId);

    if (cells.length === 0) {
      await supabase.from("zone_builder_runs").update({ status: "preview", updated_at: new Date().toISOString() }).eq("id", runId);
      return new Response(JSON.stringify({
        run_id: runId,
        zones: [],
        summary: { total_cells: 0, zone_count: 0, warnings: ["no_data"] },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // P2-03: Seed selection
    const totalDemand = cells.reduce((s, c) => s + c.demandMinutesWeek, 0);
    const targetDemandPerZone = config.target_workload_days * 8 * 60; // days * 8h * 60min
    const estimatedZoneCount = Math.max(1, Math.round(totalDemand / targetDemandPerZone));

    console.log(`[generate-zones] Run ${runId}: ${cells.length} cells, ${totalDemand} total demand min, targeting ~${estimatedZoneCount} zones`);

    const seeds = selectSeeds(cells, estimatedZoneCount, config.seed_strategy);
    console.log(`[generate-zones] Run ${runId}: Selected ${seeds.length} seeds`);

    if (seeds.length === 0) {
      // All cells too close together, make one zone
      seeds.push(cells[0].h3Index);
    }

    // P2-04: Region-growing
    let zones = regionGrow(cells, seeds, config);
    console.log(`[generate-zones] Run ${runId}: Region-growing produced ${zones.size} zones`);

    // P2-06: Refinement
    const cellLookup = new Map<string, CellData>();
    for (const c of cells) cellLookup.set(c.h3Index, c);
    zones = refineZones(zones, cellLookup, config);
    console.log(`[generate-zones] Run ${runId}: After refinement: ${zones.size} zones`);

    // P2-05: Metrics + warnings
    const neighborMap = findNeighborZones(zones);
    const results: ZoneResult[] = [];

    for (const [label, cellIndices] of zones) {
      const metrics = computeZoneMetrics(cellIndices, cellLookup);
      const warnings = checkWarnings(metrics, config);
      const neighbors = neighborMap.get(label) || [];

      results.push({
        zone_label: label,
        cell_indices: cellIndices,
        metrics,
        warnings,
        neighbor_zone_labels: neighbors,
      });
    }

    // P2-07: Write results
    // Delete previous results for this run
    await supabase.from("zone_builder_results").delete().eq("run_id", runId);

    // Insert results
    for (const r of results) {
      const { error } = await supabase.from("zone_builder_results").insert({
        run_id: runId,
        zone_label: r.zone_label,
        cell_indices: r.cell_indices,
        metrics: r.metrics as unknown as Record<string, unknown>,
        warnings: r.warnings,
        neighbor_zone_labels: r.neighbor_zone_labels,
      });
      if (error) console.error(`Result insert error for ${r.zone_label}:`, error.message);
    }

    // Update run status to preview
    await supabase.from("zone_builder_runs").update({
      status: "preview",
      updated_at: new Date().toISOString(),
    }).eq("id", runId);

    // Build summary
    const totalWarnings = results.reduce((s, r) => s + r.warnings.length, 0);
    const summary = {
      total_cells: cells.length,
      zone_count: results.length,
      total_demand_min_week: Math.round(totalDemand),
      total_supply_min_week: Math.round(cells.reduce((s, c) => s + c.supplyMinutesWeek, 0)),
      warnings_count: totalWarnings,
      zones_with_warnings: results.filter((r) => r.warnings.length > 0).map((r) => r.zone_label),
    };

    console.log(`[generate-zones] Run ${runId}: Complete. ${summary.zone_count} zones, ${summary.warnings_count} warnings`);

    return new Response(JSON.stringify({
      run_id: runId,
      zones: results.map((r) => ({
        zone_label: r.zone_label,
        cell_count: r.cell_indices.length,
        metrics: r.metrics,
        warnings: r.warnings,
        neighbors: r.neighbor_zone_labels,
      })),
      summary,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-zones] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
