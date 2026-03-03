# PRD-300 Sprint 2 — Zone Builder v1: Phased Implementation Plan

> **Source PRD:** `docs/prds/unfinished/prd-300-sprint-2-zone-builder.md`
> **Complexity:** XL (multi-day, 5 phases)
> **Dependency:** Sprint 1 complete (visits, service days, provider work profiles, customer upcoming)

---

## Phase 1: Schema + H3 Geo Infrastructure (L)

**Goal:** Tables, H3 library, and cell-scoring utilities — the data layer Zone Builder runs on.

| # | Task | Size |
|---|------|------|
| P1-01 | Create `zone_builder_runs` table — stores each generation run (region_id, config dials as JSONB, status enum: draft/preview/committed/archived, created_by, committed_at). RLS: admin only. | M |
| P1-02 | Create `zone_cells` table — maps H3 cell index → zone, with demand/supply aggregates per cell (`h3_index text PK, zone_id FK nullable, demand_minutes_week numeric, supply_minutes_week numeric, customer_count int, provider_count int, category_demand jsonb, category_supply jsonb`). RLS: admin read. | M |
| P1-03 | Create `zone_builder_results` table — stores generated zones per run before commit (`run_id FK, zone_label text, cell_indices text[], metrics jsonb, warnings text[], neighbor_zone_labels text[]`). RLS: admin only. | M |
| P1-04 | Install `h3-js` library. Create `src/lib/h3Utils.ts` — wrappers for latLngToCell, cellToLatLng, cellToBoundary, gridDisk, gridDistance, cellArea. Default resolution constant. | S |
| P1-05 | Create `src/lib/zoneScoringUtils.ts` — pure functions: `scoreCellDemand()`, `scoreCellSupply()`, `computeSeedScore()` (0.55·D + 0.35·S + 0.10·W weights), `computeZoneMetrics()` (demand/supply ratio, compactness, spread proxy, density). | M |
| P1-06 | Create `src/lib/driveTimeProxy.ts` — Mode 1: haversine distance × city multiplier (default 1.4). Mode 2: interface stub for future travel-time API. `estimateDriveMinutes(cellA, cellB)` function. | S |

**Deliverable:** All tables migrated, H3 + scoring utils tested in isolation, drive-time proxy ready.

---

## Phase 2: Zone Generation Algorithm — Edge Function (XL)

**Goal:** The core algorithm that takes a region boundary + dials and produces a set of zones with metrics.

| # | Task | Size |
|---|------|------|
| P2-01 | Create `generate-zones` edge function — accepts region_id + config dials (resolution, seed strategy, target workload, max spread, min density). Creates a `zone_builder_runs` row with status `draft`. | M |
| P2-02 | Step 0 — Cell aggregation: query all properties + provider_work_profiles within region boundary → convert lat/lng to H3 cells → aggregate demand (from subscriptions/visit_tasks) and supply (from provider capacity) per cell. Write to `zone_cells`. | L |
| P2-03 | Step 1-2 — Cell scoring + seed selection: compute SeedScore per cell → select top-N seeds based on strategy (AUTO/demand-first/provider-first). N = estimated zone count from total demand ÷ target workload. | M |
| P2-04 | Step 3 — Region-growing: implement constrained growth loop. For each seed, greedily add best neighbor cell using cost function (compactness + drive proxy + imbalance + boundary smoothness − demand gain). Stop at target workload or max spread. Handle unassigned cells (assign to nearest zone or flag as sparse). | XL |
| P2-05 | Step 4 — Feasibility constraints: flag zones as "too_sparse", "overloaded", "category_mismatch", "too_large". Compute per-zone metrics (demand min/wk, supply min/wk, S/D ratio, density, compactness, max spread, drive burden proxy). | M |
| P2-06 | Step 5 — Refinement pass: boundary cell swaps between neighbors (if reduces total spread), merge tiny zones (<30% of target), split oversized zones (>200% of target). | L |
| P2-07 | Write results to `zone_builder_results` (one row per generated zone with cell_indices, metrics, warnings, neighbors). Update run status to `preview`. Return run_id + summary. | S |

**Deliverable:** Edge function that produces deterministic zone sets. Same inputs → same output. Testable via curl.

---

## Phase 3: Admin Wizard UI — Screens 1–3 (L)

**Goal:** Admin can configure, run, and preview zone generation on a map.

| # | Task | Size |
|---|------|------|
| P3-01 | Create `/admin/zones/builder` route + `ZoneBuilderWizard` component — 5-step stepper (Select Region → Settings → Preview → Edit → Commit). State machine tracks current step + run_id. | M |
| P3-02 | Screen 1 — Region Selection: dropdown of existing regions, map preview showing region boundary polygon (from region's zip codes → H3 cells → convex hull). "Next" validates region selected. | M |
| P3-03 | Screen 2 — Generation Settings: 4 dials with defaults + microcopy. Seed strategy radio (AUTO/Demand/Provider). Resolution slider (coarse→fine). Target workload range (3–6 provider-days/wk). Max spread (10–20 min). "Generate Zones" button calls edge function. Loading state with progress indication. | M |
| P3-04 | Screen 3 — Zone Preview: Mapbox map rendering generated zones as colored polygons (H3 cell boundaries merged per zone). Zone list sidebar with metrics cards (demand, supply, S/D ratio, compactness, warnings). Hover zone → highlight on map. Click zone → detail panel. Warning badges (⚠️ sparse, 🔴 overloaded, etc.). | L |
| P3-05 | Create `useZoneBuilderRun` hook — fetch run + results, trigger generation mutation, commit mutation. | M |

**Deliverable:** Admin can select region, configure dials, generate zones, and see them on a map with metrics.

---

## Phase 4: Editing Tools + Commit — Screens 4–5 (L)

**Goal:** Admin can rename, merge, split zones and commit them to the operational model.

| # | Task | Size |
|---|------|------|
| P4-01 | Screen 4 — Editing Tools: rename zone (inline edit), merge two adjacent zones (select pair → confirm → recalculate metrics), split zone (click to place split point → regenerate within zone boundary). Guardrails: can't merge non-neighbors, can't split zone with <4 cells. | L |
| P4-02 | Create `commit-zones` edge function — takes run_id, writes generated zones into operational `zones` table (name, region_id, zip_codes derived from H3→zip lookup, default_service_day from region, metrics stored as zone metadata). Updates `zone_cells` with final zone_id assignments. Marks run as `committed`. | L |
| P4-03 | Screen 5 — Commit Confirmation: summary card (zone count, warnings count, region name), effective date picker, "Commit Zones" button with confirmation dialog. Post-commit: redirect to Zones tab showing new zones. | M |
| P4-04 | Add "Zone Builder" button to existing ZonesTab header (next to "New Zone"). Links to `/admin/zones/builder`. | S |

**Deliverable:** Full wizard flow from generation to committed operational zones.

---

## Phase 5: Property Resolution + Debug Surfaces (M)

**Goal:** Properties get assigned to zones via H3, admin can search any address and see its zone.

| # | Task | Size |
|---|------|------|
| P5-01 | Create `resolve_property_zone` RPC — given a property's lat/lng, find its H3 cell → look up zone_cells → return zone_id. Fallback: nearest zone by H3 ring expansion. | M |
| P5-02 | Add "Address Lookup" tool to admin Zones page — text input for address, geocode via Mapbox, show assigned zone + cell + zone metrics + warnings. | M |
| P5-03 | Create `backfill-property-zones` edge function — for all properties with lat/lng but no zone_id (or stale zone), run resolution and update. Idempotent via cron_run_log. | M |
| P5-04 | Add zone generation history to ZonesTab — collapsible section showing past builder runs (date, region, zone count, status). Click to view archived previews. | S |

**Deliverable:** Properties auto-resolve to zones. Admin has full debug visibility. System is production-ready for pilot.

---

## Sequencing Summary

```
Phase 1 (Schema + H3)     ──▶ Phase 2 (Algorithm)     ──▶ Phase 3 (Wizard UI 1-3)
                                                            ──▶ Phase 4 (Edit + Commit)
                                                                ──▶ Phase 5 (Resolution + Debug)
```

**Total estimated effort:** ~5–7 working sessions across 5 phases.

## Open Decisions (to resolve in Phase 1)
1. **H3 resolution default** — suggest res 7 (~5.16 km² per hex, ~36 hexes per typical suburban zone) for pilot. Configurable via dial.
2. **Demand estimation** — v1 uses subscription count × avg service minutes. Future: actual visit_task durations.
3. **Mode 2 travel-time** — deferred to post-pilot. Mode 1 (haversine × 1.4) is sufficient for v1.
