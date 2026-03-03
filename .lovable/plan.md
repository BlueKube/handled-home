

# Sprint 6: Route Sequencing v1 + Equipment Manifest — Implementation Plan

This is Lovable's reply after committing to the main branch. Claude Code to review, but not code anything...

---

## Existing State (What We Have)

- **visits** table: has `eta_range_start`, `eta_range_end`, `route_plan_version`, `schedule_state`, `provider_org_id`, `scheduled_date`, property FK
- **visit_tasks** table: has `sku_id`, `duration_estimate_minutes`, `status`, `presence_required`
- **provider_work_profiles** table: has `working_hours` (jsonb), `home_lat/lng`, `equipment_kits[]`, `max_jobs_per_day`
- **service_skus** table: has `checklist` (jsonb), `duration_minutes`, `category` — but **no `required_equipment` column**
- **assignment_config** table: tuning dials infrastructure (from Sprint 5)
- **optimize-routes** edge function: existing nearest-neighbor for jobs (operates on `jobs` table, not `visits`)
- **properties** table: has `lat`, `lng`, `geohash`

## What's Missing (Needs Building)

1. **`required_equipment` column on `service_skus`** — SKUs don't declare what equipment they need
2. **`provider_blocked_windows` table** — no blocked windows / legacy commitment support
3. **Route sequencing config dials** — bundling, ETA, stability, availability thresholds
4. **`route-sequence` edge function** — the actual nightly sequencing + ETA + manifest engine
5. **Provider availability / blocked windows UI** — "Set My Schedule" with blocked windows
6. **Provider equipment manifest UI** — "Today's Loadout" checklist
7. **Customer ETA display** — show ETA ranges for scheduled visits, AM/PM for planned
8. **Admin route overview** — per-provider/day route summary + infeasibility flags

---

## Phased Implementation

### Phase 1: Schema & Config Foundation

**Migration:**

1. **Add `required_equipment text[] default '{}'`** to `service_skus` — declares what equipment each SKU needs
2. **Create `provider_blocked_windows` table:**
   - `id`, `provider_org_id` (FK), `day_of_week` (int, nullable for one-off), `start_time` (time), `end_time` (time), `label` (text), `location_lat` (numeric, nullable), `location_lng` (numeric, nullable), `is_recurring` (bool), `specific_date` (date, nullable for one-off), `created_at`, `updated_at`
   - RLS: provider members read/write own org's windows
3. **Create `route_sequence_runs` table** (audit trail for nightly runs):
   - `id`, `run_date` (date), `provider_org_id`, `status` (text), `total_stops` (int), `total_travel_minutes` (numeric), `total_service_minutes` (numeric), `estimated_finish_time` (timestamptz), `is_feasible` (bool), `infeasible_reason` (text), `summary` (jsonb), `created_at`
   - RLS: admin full access, service role full access
4. **Add columns to `visits`:**
   - `route_order` (int, nullable) — stop position in the sequenced route
   - `stop_duration_minutes` (numeric, nullable) — bundled duration after setup discount
   - `planned_arrival_time` (timestamptz, nullable) — internal planned arrival
   - `equipment_required` (text[], default '{}') — computed manifest per stop
5. **Seed assignment_config with Sprint 6 dials** (~18 new dials):
   - Bundling: `setup_base_minutes` (5), `setup_cap_minutes` (15), `split_penalty_minutes` (30)
   - Sequencing: `min_improvement_minutes` (8), `min_improvement_percent` (7), `overtime_weight` (2.0), `window_violation_weight` (3.0), `reorder_thrash_weight` (1.0), `split_penalty_weight` (1.5)
   - ETA: `base_range_minutes` (60), `increment_per_bucket` (15), `bucket_thresholds` ([2,5])
   - Availability: `min_handled_hours_per_week` (8), `full_marketplace_hours_per_week` (12), `max_recurring_blocks_per_week` (3), `max_segments_per_day` (3), `min_segment_minutes` (90)
   - Anchored: `anchor_buffer_minutes` (30), `max_added_drive_minutes_per_day` (20), `max_extra_stops_per_day` (1)
   - Late: `late_grace_minutes` (15)
6. **Indexes:** `provider_blocked_windows(provider_org_id)`, `route_sequence_runs(provider_org_id, run_date)`, `visits(provider_org_id, scheduled_date, route_order)`

### Phase 2: Route Sequencing Edge Function (`route-sequence`)

**New edge function `supabase/functions/route-sequence/index.ts`** (~600-800 lines):

1. **Load config dials** from `assignment_config`
2. **For each provider with assigned visits in days 1-7:**
   a. Load provider work profile (home lat/lng, working hours, equipment)
   b. Load provider blocked windows for each day
   c. Load visits + visit_tasks + property locations
   d. **Algorithm 1 — Bundling:** Group visit_tasks by property+date into stops, compute `stop_duration_minutes` with setup discount
   e. **Algorithm 2 — Sequencing:** Nearest-neighbor baseline → 2-opt improvement → feasibility simulation through time segments (respecting blocked windows) → stability check vs prior night's order
   f. **Algorithm 3 — ETA Ranges:** Simulate through ordered route to compute `planned_arrival_time`, then widen to customer-facing `eta_range_start`/`eta_range_end` based on stop position buckets
   g. **Algorithm 4 — Equipment Manifest:** Union of `required_equipment` from all SKUs across all stops → write to `visits.equipment_required`
3. **Write results:** Update `visits` with `route_order`, `stop_duration_minutes`, `planned_arrival_time`, `eta_range_start`, `eta_range_end`, `equipment_required`
4. **Create `route_sequence_runs` record** with summary
5. **Flag infeasible routes** via notification event `ADMIN_ROUTE_INFEASIBLE`
6. **Wrap notifications in try/catch** (lesson from Sprint 5)

Register in `config.toml` with `verify_jwt = false` (system/cron caller).

### Phase 3: Provider UX — Blocked Windows & Availability

**New components/pages:**

1. **`useProviderBlockedWindows` hook** — CRUD for blocked windows
2. **Enhance `WorkSetup.tsx`** or create **`ProviderAvailability.tsx`** page:
   - Weekly availability template (already exists in `working_hours` jsonb)
   - Blocked windows list: add/edit/remove with day-of-week, time range, optional location (map pin), label
   - Availability health meter: compute total Handled-available hours/week, show "Limited" / "Good" / "Great for routing"
   - Fragmentation warnings (segments per day, min segment check)
3. **Provider nav:** Add "Availability" link if not already present

### Phase 4: Provider UX — Equipment Manifest & Day View Enhancements

1. **`useProviderDayPlan` hook** — fetch visits for a provider/day with route_order, tasks, equipment
2. **"Today's Loadout" section** on provider Jobs page or a new sub-view:
   - Aggregated equipment checklist from all stops
   - Mark "Packed" toggle per item (client-side for v1)
   - "Missing item" flag (emits notification to ops)
3. **Enhanced stop cards** in Jobs view:
   - Show bundled task count, stop duration estimate
   - Show ETA window per stop (internal, for provider)
   - "Move to end" action (after Start Day, rate-limited to 2/day)

### Phase 5: Customer UX — ETA Ranges

1. **Update `useUpcomingVisits` hook** to include `eta_range_start`, `eta_range_end`, `route_order`
2. **Update `UpcomingVisits.tsx`:**
   - **Scheduled visits (days 1-7):** Show ETA range as "10:00 AM – 11:30 AM"
   - **Planned visits (days 8-14):** Show coarse block "Wed (AM)" or "Thu (PM)" based on `planned_arrival_time` — AM = before noon, PM = noon-5pm
   - Microcopy: "Planned visits may shift nightly until they become Scheduled."

### Phase 6: Admin UX — Route Overview

1. **`useRouteSequenceRuns` hook** — fetch runs with provider org names
2. **Admin Route Overview page** (`/admin/routes`):
   - Per-provider/day cards: total stops, drive minutes, service minutes, estimated finish, feasibility status
   - Exceptions list: infeasible routes highlighted
   - Link to Assignment Dashboard for cross-reference
3. **Add route config dials** to existing `AssignmentConfig.tsx` (or new tab) for the ~18 new dials

---

## Technical Details

### Bundling Formula
```text
StopDuration = Σ(task_minutes) - min(setup_cap, setup_base × (num_tasks - 1))
```

### ETA Range Widths
```text
Stop 1-2: ±30 min (base_range / 2)
Stop 3-5: ±45 min (base_range / 2 + increment)
Stop 6+:  ±60 min (base_range / 2 + 2 × increment)
```

### Sequencing Objective
```text
RouteCost = Σ TravelMinutes
          + α × OvertimeMinutes
          + β × WindowViolationMinutes
          + γ × ReorderThrashPenalty
          + δ × SplitPenaltyMinutes
```

### Blocked Window Segment Planning
```text
Provider day: 8:00 AM — 5:00 PM
Blocked: 10:00 — 11:30 (legacy client)

Segment 1: 8:00 — 10:00 (stops that fit)
Segment 2: 11:30 — 5:00 (remaining stops)
```

---

## File Summary

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1 | — | migration SQL |
| 2 | `supabase/functions/route-sequence/index.ts` | `supabase/config.toml` |
| 3 | `src/hooks/useProviderBlockedWindows.ts`, `src/pages/provider/Availability.tsx` | Provider nav |
| 4 | `src/hooks/useProviderDayPlan.ts` | `src/pages/provider/Jobs.tsx` |
| 5 | — | `src/hooks/useUpcomingVisits.ts`, `src/pages/customer/UpcomingVisits.tsx` |
| 6 | `src/hooks/useRouteSequenceRuns.ts`, `src/pages/admin/RouteOverview.tsx` | `src/App.tsx`, `AdminShell.tsx`, `AssignmentConfig.tsx` |

First action: Copy PRD to `docs/prds/unfinished/` and begin Phase 1 migration.

