

## Round 2H — Fix Pack Implementation Plan

The uploaded spec replaces the existing Round 2H section in `tasks.md` with 5 focused sprints that close gaps identified in the PRD completeness review. Here's the implementation plan.

---

### Step 0: Documentation Setup
- Copy `2u-prd-completeness-review.md` → `docs/2H/prd-completeness-review.md`
- Copy `round-2h-fix-pack-spec-updated-single.md` → `docs/2H/round-2h-fix-pack-spec.md`
- Replace the existing Round 2H section in `docs/tasks.md` with the new sprint structure

---

### Sprint 2H-A — Cron Infrastructure + Run Logging (P0)

| ID | Size | Task |
|----|------|------|
| 2H-A1 | M | Create `cron_run_log` table (id, job_name, started_at, finished_at, status, result_summary, error_message, meta jsonb). RLS: admin read, system write via SECURITY DEFINER RPCs |
| 2H-A2 | M | Create `start_cron_run()` and `finish_cron_run()` helper RPCs for consistent logging pattern |
| 2H-A3 | L | Build `/admin/cron-health` page — last N runs per job, status + runtime, failure details, superuser-only "Retry Now" button. Add to AdminShell Governance nav |

**Technical notes:**
- pg_cron/pg_net are Lovable Cloud managed — we schedule via edge functions invoked by Supabase cron instead
- Each scheduled job will be an edge function that calls the compute RPC + logs to `cron_run_log`
- Cron schedules configured via `supabase/config.toml` or SQL `cron.schedule()` calls

---

### Sprint 2H-B — Quality Score Compute Pipeline (P0)

| ID | Size | Task |
|----|------|------|
| 2H-B1 | XL | Create `compute_provider_quality_scores()` RPC — query `visit_feedback_quick` + `visit_ratings_private` for rolling 28 days, compute weighted score (rating 35%, issues 25%, photos 20%, on-time 20%), upsert into `provider_quality_score_snapshots`, call `evaluate_provider_tier()` per provider, emit `admin_provider_risk_alert` for band downgrades. Log to `cron_run_log` |
| 2H-B2 | M | Fix `evaluate_training_gates()` RPC — change `composite_score` → `score`, `snapshot_at` → `computed_at`. Wire to run daily after quality compute. Log to `cron_run_log` |
| 2H-B3 | M | Create `compute-quality-scores` edge function — wrapper that calls both RPCs in sequence (quality first, then training gates), handles errors, writes cron_run_log |

**Technical notes:**
- Verify actual column names in `provider_quality_score_snapshots` from types.ts before writing SQL
- Training gates: check `requires_training_gate` on SKU + `required_score_minimum` on gate row

---

### Sprint 2H-C — BYOC Automation + Weekly Rollups (P0)

| ID | Size | Task |
|----|------|------|
| 2H-C1 | L | Create `run_byoc_lifecycle_transitions()` RPC — advance `installed_at`/`subscribed_at` from signup/subscription events, activate bonus window on first visit via `activate_byoc_attribution()`, expire ACTIVE→ENDED when bonus window passes. Log to `cron_run_log` |
| 2H-C2 | M | Create `compute_provider_weekly_rollups()` RPC — aggregate completion rate, on-time rate, redo rate, avg duration vs expected, customer feedback for each active provider. Write to `provider_feedback_rollups`. Log to `cron_run_log` |
| 2H-C3 | M | Create `run-scheduled-jobs` edge function (or individual edge functions) — orchestrate daily lifecycle + weekly BYOC bonus + weekly rollups on their respective schedules |

**Technical notes:**
- `compute_byoc_bonuses()` RPC already exists — just needs a scheduled caller
- Weekly boundary: Monday–Sunday UTC per spec Q10

---

### Sprint 2H-D — Provider Map View (P1)

| ID | Size | Task |
|----|------|------|
| 2H-D1 | S | Install `mapbox-gl` + `@types/mapbox-gl` (or `react-map-gl`). Add `MAPBOX_ACCESS_TOKEN` to env |
| 2H-D2 | XL | Build `ProviderMapView.tsx` — numbered pins for today's stops from `provider_route_plans`, tap pin → stop preview card, "Navigate" deep link (`maps://` / `geo:` URL scheme), optional provider location dot (geolocation permission), "Map unavailable" fallback when lat/lng missing |
| 2H-D3 | L | Integrate map into provider Dashboard/Jobs — list/map toggle, synced selection (tap list row → highlight pin and vice versa), "Navigate to next stop" primary action |
| 2H-D4 | M | Admin read-only map — show provider's today route pins on service day detail and provider org detail pages |
| 2H-D5 | S | Geocode handling — ensure lat/lng cached on properties at job creation. Show "Report address issue" for providers, "Fix address" for admin when missing |

**Technical notes:**
- Per spec: no polyline routing, no multi-stop navigation, no offline tiles in 2H
- Next stop = first incomplete stop in planned order, skipping blocked/skipped
- Mapbox free tier: 50k loads/month — sufficient for MVP

---

### Sprint 2H-E — Admin Completeness Polish (P1.5)

| ID | Size | Task |
|----|------|------|
| 2H-E1 | M | Wire `DecisionTraceCard` to service day detail, provider org detail, payout/hold detail, exception detail (currently only on job detail) |
| 2H-E2 | M | Add 4 missing SOP playbooks — Growth Manager zone launch, BYOC close checklist, coverage exception approvals (ops), payout/hold escalation (superuser) |
| 2H-E3 | L | Build Control Room gaps — Incentive caps page (max BYOC bonus per period, launch incentive ceilings), Algorithm params page (daily capacity cap, tier weights, backup selection — read from `admin_system_config` table), Policy guardrails (max pricing change/week, emergency override TTL) |
| 2H-E4 | S | Add payout schedule visibility — "Next payout: Friday, Mar 6" card on provider Payouts page |
| 2H-E5 | S | Wire dispatcher keyboard shortcuts E (escalate) and N (note) to open DispatcherActionsDialog on respective tabs |

---

### Migration / Schema Summary

New tables:
- `cron_run_log` — durable run history for all scheduled jobs
- `admin_system_config` — key-value config for algorithm params, guardrails, caps (superuser-only write)

Modified RPCs:
- `evaluate_training_gates()` — fix column references
- New: `compute_provider_quality_scores()`, `run_byoc_lifecycle_transitions()`, `compute_provider_weekly_rollups()`, `start_cron_run()`, `finish_cron_run()`

New edge functions:
- `compute-quality-scores` (daily)
- `run-scheduled-jobs` (orchestrator for BYOC lifecycle, bonuses, rollups)

New UI pages:
- `/admin/cron-health`
- `ProviderMapView.tsx` component

New dependency:
- `mapbox-gl` or `react-map-gl`

---

### Execution order
Sprint A → B → C → D → E (strict sequence — B/C depend on A's cron logging, D is independent but lower priority)

