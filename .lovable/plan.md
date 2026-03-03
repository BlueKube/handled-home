

# Sprint 5: Provider Assignment v1 (Clustered, Capacity-Constrained)

## Current State Assessment

The existing assignment system (`auto_assign_job` RPC + `assign-jobs` edge function) is a simple zone-category lookup: find the PRIMARY provider for the zone+category, check capacity count, assign or overflow. There is no scoring, no clustering, no stability rules, no explainability beyond basic logs.

Sprint 5 replaces this with a proper assignment engine that operates on **visits** (not jobs), scores candidates on distance/balance/spread/familiarity, enforces stability rules, and provides admin tools for exceptions and manual overrides.

### Schema gaps vs PRD requirements:
- `visits` table lacks: `backup_provider_org_id`, `assignment_confidence`, `assignment_reasons`, `assignment_locked`, `assignment_run_id`
- No `assignment_runs` table for nightly run tracking
- No `assignment_config` table for tuning dials (weights, thresholds)
- `provider_work_profiles` has `max_jobs_per_day` but no minutes-based capacity
- No familiarity tracking (need to query visit history)

---

## Implementation Plan — 4 Phases

### Phase 1: Schema & Config Foundation

**Migration 1 — Extend visits + create assignment tables:**

```sql
-- Add assignment columns to visits
ALTER TABLE visits ADD COLUMN backup_provider_org_id uuid REFERENCES provider_orgs(id);
ALTER TABLE visits ADD COLUMN assignment_confidence text; -- Low/Medium/High
ALTER TABLE visits ADD COLUMN assignment_reasons jsonb DEFAULT '[]';
ALTER TABLE visits ADD COLUMN assignment_locked boolean DEFAULT false;
ALTER TABLE visits ADD COLUMN assignment_run_id uuid;
ALTER TABLE visits ADD COLUMN assignment_score numeric;
ALTER TABLE visits ADD COLUMN unassigned_reason text;

-- Assignment runs (parallel to plan_runs)
CREATE TABLE assignment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  triggered_by text DEFAULT 'system',
  started_at timestamptz,
  completed_at timestamptz,
  run_date date NOT NULL,
  idempotency_key text UNIQUE,
  summary jsonb,
  created_at timestamptz DEFAULT now()
);

-- Assignment tuning dials
CREATE TABLE assignment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by_user_id uuid
);
-- Seed default weights and thresholds

-- Visit assignment log (audit trail for manual overrides)
CREATE TABLE visit_assignment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) NOT NULL,
  action text NOT NULL, -- assign, swap, lock, unassign, auto_assign
  provider_org_id uuid REFERENCES provider_orgs(id),
  previous_provider_org_id uuid REFERENCES provider_orgs(id),
  reason text,
  performed_by uuid, -- null = system
  score_breakdown jsonb,
  candidates jsonb,
  created_at timestamptz DEFAULT now()
);
```

**RLS**: Admin read/write on assignment_runs, assignment_config, visit_assignment_log. Providers read own visits. Customers read own visits (no backup shown).

**Seed assignment_config** with PRD dials:
- `w_distance` = 0.40
- `w_balance` = 0.25
- `w_spread` = 0.20
- `w_familiarity` = 0.10
- `w_zone_affinity` = 0.05
- `max_candidate_drive_minutes` = 45
- `utilization_target` = 0.80
- `default_task_minutes` = 30
- `reassign_min_score_delta` = 5.0
- `reassign_min_percent` = 0.15
- `freeze_strictness_multiplier` = 2.0
- `familiarity_cap_minutes` = 15
- `buffer_minutes` = 10

### Phase 2: Assignment Engine (Edge Function)

**New edge function: `assign-visits/index.ts`**

This is the core solver. Runs nightly after `run-nightly-planner`.

```text
Flow:
1. Idempotency check via assignment_runs
2. Load config dials from assignment_config
3. Fetch visits in 14-day horizon (planning/scheduled, not canceled)
4. Fetch all active provider_work_profiles + availability_blocks
5. For each visit:
   a. Compute VisitMinutes (sum of visit_tasks duration_estimate_minutes)
   b. Build candidate set (Step A — hard constraints)
   c. Score candidates (Step B — soft objective)
6. Greedy assignment: most-constrained visits first (Step C)
7. Local improvement pass: try pairwise swaps
8. Assign backups (Step D)
9. Apply stability rules (Step E) — compare with existing assignments
10. Write results: UPDATE visits, INSERT visit_assignment_log
11. Emit notifications (PROVIDER_JOBS_ASSIGNED, ADMIN_ZONE_ALERT_BACKLOG)
12. Complete assignment_run with summary
```

**Key algorithms:**

- **GeoCost**: Haversine × 1.4 city multiplier / 35 km/h (reuse existing pattern from zone builder)
- **Familiarity**: Query visits in last 90 days per provider×customer pair
- **BalancePenalty**: `max(0, (targetRemaining - remaining) / targetRemaining)`
- **SpreadPenalty**: Increase in max-distance from centroid of assigned visits
- **Stability**: Keep existing assignment unless improvement ≥ delta (2× delta in freeze window)

### Phase 3: Admin UX

**3a — Assignment Run Dashboard** (`src/pages/admin/AssignmentDashboard.tsx`)
- Run list with status/timestamp
- Summary cards: total visits, % assigned primary, % with backup, unassigned count, capacity hotspots, long-drive count
- Manual trigger button (like PlannerDashboard)

**3b — Exceptions Inbox** (extend existing `src/pages/admin/Exceptions.tsx` or new tab)
- Prioritized list: unassigned → single-candidate → near-capacity → long-drive
- Each item opens detail drawer with:
  - Visit details (date, property, tasks, minutes)
  - Ranked candidate list with scores and reasons
  - Recommended action buttons

**3c — Manual Override Tools** (in visit detail / exceptions drawer)
- Assign provider (select from candidates)
- Swap two visits between providers
- Lock assignment (prevents auto-reassignment)
- Remove assignment
- All require reason note → logged to visit_assignment_log

**3d — Tuning Dials** (`src/pages/admin/AssignmentConfig.tsx`)
- Card per dial group (weights, thresholds, capacity)
- Slider/input for each value
- Save with audit (updated_by_user_id)

### Phase 4: Provider & Customer UX Updates

**4a — Provider calendar/list** (update existing provider pages)
- Show assigned visits with Scheduled (Locked) vs Planned (May adjust) labels
- Each visit: property, task bundle, expected minutes, "Primary" tag

**4b — Customer upcoming visits** (update `useUpcomingVisits`)
- Scheduled visits: "Your pro is scheduled"
- Planned visits: "We're planning your visit" + "May adjust until scheduled"
- Do NOT prominently surface provider name for Planned visits

---

## Routing & Navigation

- `/admin/assignments` → AssignmentDashboard
- `/admin/assignments/config` → Tuning dials
- Exceptions integrated into existing exceptions page or as tab on assignments dashboard

## File Summary

| Change | Files |
|--------|-------|
| Schema migration | 1 migration (visits columns + 3 new tables + seeds + RLS) |
| Edge function | `supabase/functions/assign-visits/index.ts` (new, ~400 lines) |
| Hooks | `useAssignmentRuns.ts`, `useAssignmentConfig.ts`, `useVisitAssignment.ts` |
| Admin pages | `AssignmentDashboard.tsx`, `AssignmentConfig.tsx`, exceptions components |
| Provider UX | Update provider schedule views |
| Customer UX | Update `useUpcomingVisits` labels |
| Routing | Add admin routes |

## Phased Delivery Order

1. **Phase 1** — Schema + config (migration only, no UI breakage)
2. **Phase 2** — Edge function (the solver — largest single piece)
3. **Phase 3** — Admin UX (dashboard, exceptions, overrides, dials)
4. **Phase 4** — Provider + customer UX updates

Each phase will be followed by an Opus 4.6 code review before proceeding.

