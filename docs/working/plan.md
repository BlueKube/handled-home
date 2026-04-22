# Round 64 — Phase 4 (Snap-a-Fix)

> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` lines 200–253
> **Branch:** `claude/phase-4-snap-a-fix-CJKXs` (harness-assigned; supersedes the `feat/round-64-phase-4-snap-a-fix` name in the previous handoff)
> **Round progress:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · **Phase 4 ▶** · Phases 5–8 ⬜
> **Previous phase archives:** `docs/archive/round-64-phase-2-2026-04-21/`, `docs/archive/round-64-phase-3-2026-04-21/`

---

## Phase 4 summary

Photo-first capture flow with a floating Snap FAB on the customer surface. Per-snap routing (urgent → ad-hoc dispatch, or next-visit → credits held on the next scheduled job). AI triage on the photo at submit time surfaces a suggested SKU + credit estimate before the customer commits.

Reuses:
- `useJobActions.uploadPhoto` canvas compression util (extracted to `src/lib/imageCompression.ts` in 4.2).
- `support-ai-classify` edge function pattern for structured tool-based Haiku 4.5 calls.
- `spend_handles` / `refund_handles` RPCs with `reference_type='snap_hold'` / `'snap_spend'` / `'snap_refund'` (`reference_type` is free-form TEXT — no CHECK constraint to widen).

New primitives:
- `snap_requests` table + RLS.
- `job_tasks` table + RLS (new; not an extension of an existing table).
- `dispatch_requests` table + RLS (new; Batch 4.4).
- `snap-photos` storage bucket (new; `job-photos` INSERT is locked to provider members per migration `20260403053002`, so customer uploads need their own surface).
- `snap-ai-classify` edge function.

Phase 4 does **not** touch the bottom nav shape — that restructure is Phase 5. The Snap FAB in this phase is an overlaid floating button rendered above the current 5-tab bar on customer screens.

---

## Batches

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| 4.1 | Schema: snap_requests + job_tasks + snap-photos bucket + RLS | M | ✅ | — |
| 4.2 | SnapSheet + useSubmitSnap + SnapFab (capture / describe / route / submit; static preview) | M | ✅ | — |
| 4.3 | snap-ai-classify edge function + SnapSheet AI preview wire-up | M | ✅ | — |
| 4.4 | Routing handlers (next_visit → job_tasks, ad_hoc → dispatch_requests) + refund path + status machine | L | ✅ | — |

**Phase 4 complete.** Next session / user action: archive `docs/working/plan.md` + `docs/working/batch-specs/*` to `docs/archive/round-64-phase-4-<date>/` per CLAUDE.md §8 phase-transition protocol. This happens after PR #10 merges and the branch is deleted — doing it in a follow-up commit on main keeps the batch spec visible to PR reviewers until merge.

### Batch 4.1 — Schema (M, review tier = Medium 3-lane + synthesis)

**Scope:**
- New migration `supabase/migrations/<ts>_snap_a_fix_schema.sql`:
  - `snap_requests` table with columns per PRD + `subscription_id uuid` (needed for `spend_handles` calls) + `CHECK status IN (...)` + indexes on `customer_id`, `linked_job_id`, `status`.
  - `job_tasks` table (new, not an ALTER): `(id, job_id, task_type, snap_request_id, sku_id, credits_estimated, credits_actual, description, status, created_at, completed_at)` with `CHECK task_type IN ('included','snap','bundle','addon')` and `CHECK status IN ('pending','in_progress','done','skipped')`.
  - `snap-photos` storage bucket + INSERT/SELECT/DELETE policies.
  - RLS on both tables: customer-own + admin-all + provider-via-job-linkage.
- Regen `src/integrations/supabase/types.ts`.
- Skip frontend — schema-only batch.

**Acceptance:**
- Migration applies cleanly on the self-hosted project (`supabase db push` or GitHub-integration auto-apply).
- Types regen compiles (`npx tsc --noEmit` clean).
- `npm run build` clean.
- `mcp__supabase__get_advisors` returns no new RLS warnings.

**Lane skip:** Lane 3 skip rule applies (first batch in phase, no prior review findings). Runs 2 lanes + synthesis = 3 agents.

### Batch 4.2 — SnapSheet + hook + FAB (M, review tier = Medium)

**Scope:**
- `src/lib/imageCompression.ts` — extract `compressImage` from `useJobActions` so both hooks share it (refactor `useJobActions.ts` to import it).
- `src/hooks/useSubmitSnap.ts` — wraps: upload to `snap-photos` bucket at `${customer_id}/${snap_id}/${photo_id}.jpg`, insert `snap_requests` row with `status='submitted'`, call `spend_handles` with `reference_type='snap_hold'` and `reference_id = snap_id`.
- `src/components/customer/SnapSheet.tsx` — 4-step sheet (capture / describe+area / preview placeholder / route radio+submit). Uses `Sheet` from the ReportIssueSheet pattern.
- `src/components/customer/SnapFab.tsx` — floating 56×56 button bottom-center, visible on all `/customer/*` routes above the bottom tabs. Renders only for authenticated customers.
- Wire `SnapFab` into `AppLayout.tsx` conditional on `effectiveRole === 'customer'`.
- No AI call yet — preview step shows a static "We'll estimate after submit" placeholder card.

**Acceptance:**
- Sheet opens from FAB, submits, closes.
- Photo uploads to bucket; `snap_requests` row written; `handle_transactions` row with `reference_type='snap_hold'` and matching `reference_id`.
- Insufficient credits → toast + abort, no row written.
- `tsc` + build clean.

### Batch 4.3 — AI triage (M, review tier = Medium)

**Scope:**
- `supabase/functions/snap-ai-classify/index.ts` — forked from `support-ai-classify`:
  - Auth: customer owner of `snap_request` or service_role (mirror the ticket-owner pattern).
  - Fetch `snap_requests` row + photos from `snap-photos` bucket.
  - Generate signed URLs (10-min expiry) for up to 4 photos.
  - Tool-based Haiku 4.5 call → `{suggested_sku_id, suggested_credits, area_inference, confidence, summary}`.
  - Writes `snap_requests.ai_classification` + `snap_requests.status='triaged'`.
  - Logs `ai_inference_runs` row (reuses existing table; `snap_request_id` column add if not present).
- Frontend: `SnapSheet` Step 3 calls `snap-ai-classify` after upload, renders returned summary + credit estimate. On timeout / error, fall back to static preview.
- `useSubmitSnap` adjusts: upload + insert first, then fire classify async, hold credits only after customer confirms routing.

**Acceptance:**
- Classify returns within 5s on a real photo.
- `ai_inference_runs` row written with `snap_request_id`, `model_name`, `latency_ms`.
- Graceful timeout path renders "We'll estimate after submit" instead of blocking the flow.

### Batch 4.4 — Routing + refund (L, review tier = Large 3-lane + Sonnet synth + Haiku synth)

**Scope:**
- `dispatch_requests` table (new): `(id, snap_request_id, property_id, status, urgency, assigned_provider_org_id, dispatched_at, resolved_at)` + RLS.
- `handle_snap_routing` RPC (SECURITY DEFINER):
  - `next_visit` path: find customer's next scheduled `jobs` row in routine, insert `job_tasks` row with `task_type='snap'` + `snap_request_id`, update `snap_requests.linked_job_id` + `status='scheduled'`.
  - `ad_hoc` path: insert `dispatch_requests` row, update `snap_requests.status='dispatched'`.
- `resolve_snap` RPC: on job completion or provider completes dispatch, convert the `snap_hold` → `snap_spend` (credits_actual), or if canceled → `refund_handles` with `snap_refund`.
- Frontend: `SnapSheet` submit calls `handle_snap_routing` after routing selection.
- Visit Detail & provider Job Detail surface `job_tasks` rows tagged `snap` with photo + AI summary (minimal chip rendering; full Visit Detail polish is Phase 5).

**Acceptance:**
- E2E urgent: photo → submit → credits held → `dispatch_requests` row → cancel → refund.
- E2E next-visit: photo → submit → credits held → `job_tasks` row on next job → completion flips hold→spend → snap resolved.
- `tsc` + build clean.

---

## Review protocol

Per CLAUDE.md §5. Each batch:
1. Write spec in `docs/working/batch-specs/batch-4.N-<slug>.md` before coding.
2. Implement → commit → push.
3. Run review lanes per tier (Medium = 3-lane + synth; Large = 3-lane + 2 synth; Lane 3 skipped on first-batch-in-phase or when there's no prior-review history).
4. Fix MUST-FIX → re-review (lightweight, ≤3 passes).
5. Log suggestions + agent signals to `lessons-learned.md` at batch end.

---

## Known drift flagged at phase start

1. Harness branch is `claude/phase-4-snap-a-fix-CJKXs`, not the `feat/round-64-phase-4-snap-a-fix` the prior handoff suggested. Working on the harness branch.
2. `job_tasks` and `dispatch_requests` do not exist — the PRD's "(or extension if exists)" / "(existing table or new)" hedges resolve to **new tables**.
3. `job-photos` bucket INSERT is locked to provider members (migration `20260403053002`). Customer snap uploads use a new `snap-photos` bucket instead of reusing `job-photos`.
4. Phase 4 does not touch the 5-tab bottom nav shape; the FAB is overlaid. Phase 5 is the nav restructure.

---

## Pending human tasks (carry-forward from Phase 3 — don't block Phase 4)

- Stripe pack products + `STRIPE_CREDIT_PACK_*` price-id env vars.
- `supabase functions deploy purchase-credit-pack` + `... process-credit-pack-autopay`.
- Verify `process-credit-pack-autopay` cron at 07:00 UTC.

Phase 4 will add its own deploy task: `supabase functions deploy snap-ai-classify` after Batch 4.3 lands.

---

## Session Handoff

- **Branch:** `claude/phase-4-snap-a-fix-CJKXs`. Even with origin/main as of session start.
- **Last completed:** Phase 3 (shipped on `claude/handled-home-phase-2-YTvlm`, merged to main).
- **Next up:** Batch 4.1 — schema. Spec: `docs/working/batch-specs/batch-4.1-snap-schema.md`.
- **Context at exit:** — (8% reported at session start; plan + spec cost expected ~5% more).
- **Blockers:** None on code. Secrets bundle `/root/.r64_5_secrets.env` is missing in the sandbox, so any `supabase db push` / `supabase functions deploy` / cron verification is deferred to the next interactive step. Migration-only Batch 4.1 can be committed without deploy; GitHub→Supabase integration auto-applies on push to main.
- **Round progress:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 ▶ (batches decomposed, none started) · Phases 5–8 ⬜
