# Sprint 3A Phase 1+2 Review — SKU Levels Schema + Hooks

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** Migration `20260301043325` (4 tables + 2 ALTER TABLE), `useSkuLevels.ts` hooks, `types.ts` regen, pre-req edge function fix
**Spec:** `docs/Sprints/3A-Levels.md`

---

## Verdict: PASS — 1 HIGH, 2 MEDIUM, 2 LOW

Schema is solid and well-aligned with the spec. Hooks are functionally correct. The courtesy upgrade guardrail has a security gap (client-side only) that should be addressed before Phase 5.

---

## Schema Review

### `sku_levels` — PASS

Matches spec §6.1 required fields:
- `level_number` (1..N) with `UNIQUE(sku_id, level_number)` — correct
- `label`, `short_description`, `inclusions` (TEXT[]), `exclusions` (TEXT[])
- `planned_minutes`, `proof_photo_min`, `proof_checklist_template` (JSONB)
- `handles_cost` (INT)
- `is_active`, `effective_start_cycle`
- RLS: public read, admin write — correct for catalog data
- Index on `sku_id` — good

### `sku_guidance_questions` — PASS

Matches spec §6.4:
- `question_order` with `UNIQUE(sku_id, question_order)` — enforces ordering
- `question_text`, `is_mandatory`, `options` (JSONB array of `{label, value, level_bump?, minutes_bump?}`)
- RLS: public read, admin write — correct
- Index on `sku_id` — good

### `level_recommendations` — PASS

Matches spec §4.4 / §6.6:
- `job_id`, `provider_org_id`, `scheduled_level_id`, `recommended_level_id`, `reason_code`, `note`
- RLS: provider can insert + read own (via `provider_members` check), admin all
- Index on `job_id` — good

### `courtesy_upgrades` — PASS with findings

Matches spec §6.7:
- `job_id`, `property_id`, `sku_id`, `scheduled_level_id`, `performed_level_id`, `reason_code`, `provider_org_id`
- RLS: provider insert own, customer read own property, admin all
- Index on `(property_id, sku_id)` — correct for guardrail queries

### FK Columns — PASS

- `routine_items.level_id` (nullable) — confirmed in types.ts
- `job_skus.scheduled_level_id` + `job_skus.performed_level_id` (nullable) — confirmed

Plan mentioned a standalone `job_skus.level_id` in addition to `scheduled_level_id`/`performed_level_id`. The implementation correctly dropped `level_id` since `scheduled_level_id` serves the same purpose. Better design.

---

## Hooks Review

### Level CRUD (`useSkuLevels`, `useCreateLevel`, `useUpdateLevel`, `useDeleteLevel`) — PASS

- Query key `["sku_levels", skuId]` with proper invalidation on mutations
- `useUpdateLevel` correctly sets `updated_at` on every update
- All hooks use `(supabase as any)` — expected since types weren't regenerated when hooks were written; types.ts now has the tables

### Guidance Questions CRUD — PASS

- Same clean pattern as levels. Query key `["sku_guidance_questions", skuId]`
- Proper invalidation on all mutations

### `useLevelRecommendation` — PASS

- Simple insert mutation. No guardrails needed per spec (multiple recommendations per job are fine).

### `useCourtesyUpgrade` — PASS with HIGH finding

The 6-month guardrail logic is correct but **client-side only**.

---

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| **3A-F1** | **HIGH** | **Courtesy upgrade 6-month guardrail is client-side only.** The `useCourtesyUpgrade` hook checks for existing upgrades via a SELECT before INSERT, but this is easily bypassed by a direct API call or race condition. The spec (§6.7) says this is a "required v1 guardrail." The check should be enforced server-side — either via a DB trigger/function or a unique partial index like `CREATE UNIQUE INDEX idx_courtesy_upgrade_rate_limit ON courtesy_upgrades (property_id, sku_id) WHERE created_at >= (now() - interval '6 months')`. The simplest approach is a SECURITY DEFINER RPC that does the check + insert atomically. |
| **3A-F2** | **MEDIUM** | **No `level_id` column on `job_skus` in the plan but `scheduled_level_id` correctly serves this purpose.** However, when creating jobs from routine items, the job creation logic needs to map `routine_items.level_id` → `job_skus.scheduled_level_id`. This mapping doesn't exist yet and should be wired in Phase 4/5. Not a schema bug — just a reminder for the next phases. |
| **3A-F3** | **MEDIUM** | **`level_recommendations` has no unique constraint preventing duplicate recommendations for the same job.** A provider could submit multiple recommendations for the same job (different levels, same job). Consider adding `UNIQUE(job_id, provider_org_id)` or `UNIQUE(job_id)` if only one recommendation per job is expected per spec §6.6. |
| **3A-F4** | LOW | **`useSkuLevels.ts` uses `(supabase as any)` casts throughout.** Now that `types.ts` is regenerated with the new tables, these casts should be removed and the hooks should use the typed client directly. The manual type definitions at the top of the file can also be replaced with imports from `types.ts`. Not urgent but should be cleaned up. |
| **3A-F5** | LOW | **Spec §6.7 mentions "Ops can disable courtesy upgrades per provider/org or per SKU"** but there's no `courtesy_upgrade_enabled` flag on `service_skus` or `provider_orgs`. Consider adding this in a future phase when the ops override UI is built. |

---

## Spec Coverage Check

| Spec Requirement | Covered in Phase 1+2? | Notes |
|-----------------|----------------------|-------|
| §6.1 Level fields | YES | All required fields present |
| §6.4 Guidance questions (0-3 per SKU) | YES | Schema + hooks. Max-3 enforcement not in schema (UI concern) |
| §6.6 Provider recommendation with reason codes | YES | Schema + hook. Reason codes are free-text (UI will constrain) |
| §6.7 Courtesy upgrade with guardrails | PARTIAL | Schema + hook present. Guardrail is client-side only (3A-F1) |
| §6.7 1 per property/SKU/6mo | PARTIAL | Client-side check exists, no server-side enforcement |
| §6.10 Scheduling uses `planned_minutes` | YES | Column exists on `sku_levels` |
| FK: routine_items.level_id | YES | Nullable, backward compatible |
| FK: job_skus.scheduled/performed_level_id | YES | Both nullable, backward compatible |

---

## Bonus: Ancillary Changes

The merge also included:
- **Pre-req fix:** `create-connect-account-link/index.ts` switched from `npm:` to `esm.sh` import
- **AdminReadOnlyMap:** Added `stop_index` prop for correct pin numbering (addresses D-F1/E2-F5)
- **ProviderMapView:** Similar pin ordering fix
- **run-scheduled-jobs:** Refactored to use `runSubJob()` helper (cleaner), added `quality_compute_daily` and `training_gates_daily` as separate sub-jobs
- **compute-quality-scores:** Now logs to `cron_run_log` with idempotency key

These are all improvements — no issues.

---

## Instructions for Lovable

> **Proceed to Phase 3 (Admin UI).** Address findings as follows:
>
> 1. **3A-F1 (HIGH):** Before Phase 5 (Provider UI with courtesy upgrade flow), move the 6-month guardrail to a SECURITY DEFINER RPC or database constraint. The client-side check is insufficient for a billing-adjacent guardrail.
>
> 2. **3A-F3 (MEDIUM):** Add a `UNIQUE(job_id)` constraint to `level_recommendations` — the spec implies one recommendation per job completion.
>
> 3. **3A-F4 (LOW):** When convenient, remove `(supabase as any)` casts in `useSkuLevels.ts` now that types are regenerated.
>
> Phase 3 (Admin UI) can proceed without blocking on these — they affect Phase 5 (Provider UI).
