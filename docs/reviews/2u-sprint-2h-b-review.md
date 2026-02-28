# Sprint 2H-B Review — Quality Score Compute Pipeline

**Status:** CONDITIONAL PASS — 1 HIGH finding (photo score bug), 1 MEDIUM, 1 LOW. Training gates fix is correct. Edge function is clean.

---

## 2H-B1 — `compute_provider_quality_scores()` RPC

**Migration:** `20260228044227` (268 lines)

### Architecture
- SECURITY DEFINER ✓
- Auth guard: admin_memberships or service role (`auth.uid() IS NULL`) ✓
- Cron logging: `start_cron_run()` → work → `finish_cron_run()` with exception handler ✓
- Loops over all active `provider_orgs` ✓
- Calls `evaluate_provider_tier()` per provider after scoring ✓
- Returns `{providers_scored, band_downgrades}` ✓

### Score Components

| Component | Weight | Source Table | Calculation | Default |
|-----------|--------|-------------|-------------|---------|
| Rating | 35% | `visit_ratings_private` | `AVG(rating) * 20` (1-5 → 20-100) | 50 |
| Issues | 25% | `visit_feedback_quick` | `100 - (issue_rate * 100)` | 75 |
| Photos | 20% | `jobs` + `job_photos` | `jobs_with_photos / completed_jobs * 100` | 50 |
| On-time | 20% | `jobs` | `on_time_arrivals / timed_jobs * 100` | 75 |

**Weights match spec** (rating 35%, issues 25%, photos 20%, on-time 20%) ✓

### Band Thresholds
```
GREEN  ≥ 85
YELLOW ≥ 70
ORANGE ≥ 55
RED    < 55
```

Note: `evaluate_provider_tier()` comments mention GREEN ≥ 80, YELLOW ≥ 60 as the old expectation. The new thresholds (85/70/55) are slightly stricter. Since tier mapping uses band *names* not score values (GREEN → gold, YELLOW → silver), this just means the threshold to reach Gold is 85 instead of 80. This is the first actual backend computation, so these are the authoritative thresholds.

### Band Change Detection
- Compares new band vs previous snapshot's band ✓
- Inserts `provider_quality_score_events` row on change ✓
- Detects downgrades correctly (GREEN→YELLOW, GREEN/YELLOW→ORANGE, etc.) ✓

### Downgrade Notifications
- Notifies all active superuser admins via `emit_notification()` ✓
- Function signature matches: `(user_id, type, title, body, data)` ✓
- Notification type: `admin_provider_risk_alert` ✓

### Exception Handling
- `EXCEPTION WHEN OTHERS` catches all errors ✓
- Logs failure to `cron_run_log` before re-raising ✓
- Guards against null `v_run_id` ✓

---

## 2H-B2 — `evaluate_training_gates()` Fix

### Column Reference Fix
| Old (broken) | New (fixed) | Correct? |
|--------------|-------------|----------|
| `composite_score` | `score` | ✓ (matches `provider_quality_score_snapshots` schema) |
| `snapshot_at` | `computed_at` | ✓ (matches `provider_quality_score_snapshots` schema) |

### Logic
- Iterates all `pending` training gates ✓
- Gets latest quality score snapshot per provider ✓
- Auto-completes gate if `score >= required_score_minimum` ✓
- Updates `status = 'completed'`, `completed_at = now()` ✓
- Cron logging pattern matches `start_cron_run` / `finish_cron_run` ✓
- Exception handling identical to quality scores ✓
- Idempotency key: `gates_YYYY-MM-DD` ✓

### Auth Guard
Same pattern as quality scores: admin membership or service role. ✓

---

## 2H-B3 — `compute-quality-scores` Edge Function

**File:** `supabase/functions/compute-quality-scores/index.ts` (66 lines)

- Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) ✓
- CORS headers ✓
- Calls RPCs in sequence: quality scores first, then training gates ✓
- If quality scores fail → returns 500 with step info ✓
- If training gates fail → returns 500 with step info + quality scores result ✓
- Console.log for observability ✓
- `verify_jwt = false` in config.toml ✓

Clean and minimal. Matches the spec §4.4 "compute quality first, then evaluate gates" sequencing.

---

## Findings

| ID | Severity | Issue |
|----|----------|-------|
| B-F1 | **HIGH** | **Photo score uses wrong `upload_status` value — always returns 0.** The RPC queries `jp.upload_status = 'confirmed'` but the `job_photos` table has a CHECK constraint: `upload_status IN ('PENDING','UPLOADED','FAILED')`. There is NO `'confirmed'` status in the schema. All uploaded photos have status `'UPLOADED'` (uppercase). Since no photos will ever match `'confirmed'`, the photo score will be 0 for every provider with completed jobs. This systematically undervalues quality scores by up to 20 points (20% weight × 100-point swing). **Fix:** Change `'confirmed'` to `'UPLOADED'` in the LEFT JOIN condition (line 84). |
| B-F2 | MEDIUM | **Weights and band thresholds hardcoded instead of reading from `admin_system_config`.** Sprint 2H-A seeded `quality_score_weights` config with `{"rating": 0.35, "issues": 0.25, "photos": 0.20, "on_time": 0.20}`. But the RPC hardcodes these same values instead of reading from the config table. This defeats the purpose of making them admin-configurable. Similarly, band thresholds (85/70/55) are hardcoded with no config row. **Fix:** Add `SELECT config_value FROM admin_system_config WHERE config_key = 'quality_score_weights'` at the top, parse the jsonb, and use the values. Add a `quality_band_thresholds` config row with `{"green": 85, "yellow": 70, "orange": 55}`. |
| B-F3 | LOW | **Notification loop is convoluted.** Uses `FOR v_admin_users IN SELECT ARRAY_AGG(...) LOOP` which returns a single row containing an array, then `PERFORM ... FROM unnest(v_admin_users)`. Simpler: `FOR v_uid IN SELECT user_id FROM admin_memberships WHERE ... LOOP PERFORM emit_notification(v_uid, ...); END LOOP;`. Functionally correct but unnecessarily complex. |

---

## What passed well

- **Training gates fix is correct** — column references match actual schema, logic is clean
- **Cron logging pattern** is consistent between both RPCs: `start_cron_run` → work → `finish_cron_run` with exception handler
- **Edge function** is minimal and well-structured with step-specific error reporting
- **Score computation** correctly handles empty data with neutral defaults (50-75 range) — new providers don't start at 0
- **Band change detection** with event logging and admin notifications is a complete audit trail
- **Idempotency keys** prevent duplicate runs on the same day

---

## Verification checklist for B-F1 fix

After Lovable fixes the photo score status value, verify:
1. Change `'confirmed'` → `'UPLOADED'` on line 84 of the migration
2. Confirm the LEFT JOIN now matches: `jp.upload_status = 'UPLOADED'`
3. The photo score should return >0 for providers who have completed jobs with uploaded photos

---

## Open findings tracker (cumulative)

### HIGH — 1 open
| ID | Status | Description |
|----|--------|-------------|
| B-F1 | **OPEN** | Photo score uses `'confirmed'` instead of `'UPLOADED'` — always 0 |

### MEDIUM — 4 open
| ID | Status | Description |
|----|--------|-------------|
| B-F3 (Round 2G) | OPEN | Search filter injection in `.or()` |
| B-F4 (Round 2G) | OPEN | Non-standard event types in job_events |
| A-F1 | OPEN | `cron_run_log` INSERT/UPDATE RLS overly permissive |
| B-F2 | OPEN | Quality weights/thresholds hardcoded instead of reading from admin_system_config |

### LOW — 22 open
(Prior 21 + B-F3 new)
