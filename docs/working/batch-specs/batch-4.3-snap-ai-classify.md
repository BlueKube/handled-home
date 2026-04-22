# Batch 4.3 — snap-ai-classify edge function + AI preview wire-up

> **Phase:** 4 (Snap-a-Fix) · **Size:** Medium · **Review tier:** Medium 3-lane + Lane 4 synthesis (**as sub-agent**, per §5 — no inline synthesis)
> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` lines 200–253
> **Depends on:** Batch 4.1 (schema) + Batch 4.2 (capture UI) — both merged

---

## Goal

Wire AI triage into the Snap flow so the customer sees "We think this is a leaky faucet — about 120 credits" before committing. The SnapSheet's current step 3 placeholder becomes a real result card.

This requires splitting `useSubmitSnap` (the one-shot mutation from 4.2) into three smaller pieces so classification can run **between** photo upload and credit hold:

1. `useCreateSnapDraft` — upload photo + insert `snap_requests` row (no credits held).
2. `useClassifySnap` — invoke the new `snap-ai-classify` edge function (synchronous call that updates `ai_classification` and returns the result).
3. `useFinalizeSnap` — update routing + credits_held on the existing row, then call `spend_handles`.

Legacy `useSubmitSnap` is deleted — all call sites move to the new hooks.

---

## Files touched

### New
- `supabase/migrations/20260422100000_ai_inference_runs_snap_support.sql`
- `supabase/functions/snap-ai-classify/index.ts`
- `src/hooks/useCreateSnapDraft.ts`
- `src/hooks/useClassifySnap.ts`
- `src/hooks/useFinalizeSnap.ts`

### Modified
- `src/components/customer/SnapSheet.tsx` — three-hook flow + AI card in step 3 + cleanup path on close mid-flow.

### Deleted
- `src/hooks/useSubmitSnap.ts` — superseded.

---

## Migration `20260422100000_ai_inference_runs_snap_support.sql`

Adds snap-aware columns so a single table tracks both ticket-classify and snap-classify runs:

```sql
ALTER TABLE public.ai_inference_runs
  ALTER COLUMN ticket_id DROP NOT NULL;

ALTER TABLE public.ai_inference_runs
  ADD COLUMN snap_request_id uuid REFERENCES public.snap_requests(id) ON DELETE CASCADE;

ALTER TABLE public.ai_inference_runs
  ADD CONSTRAINT ai_inference_runs_subject_chk
  CHECK (ticket_id IS NOT NULL OR snap_request_id IS NOT NULL);

CREATE INDEX idx_ai_inference_runs_snap_request
  ON public.ai_inference_runs(snap_request_id)
  WHERE snap_request_id IS NOT NULL;
```

RLS is already set (admin-only SELECT). Edge functions use service role and bypass.

---

## Edge function `supabase/functions/snap-ai-classify/index.ts`

Fork of `support-ai-classify` with a snap-specific payload. Structure:

1. **CORS** — same `corsHeaders` pattern (or use `_shared/cors.ts`).
2. **Auth.** Accept either a user JWT (owner or admin) or service role. Reuse `requireUserJwt` from `_shared/auth.ts`; service-role check by comparing token to `SUPABASE_SERVICE_ROLE_KEY` directly (same pattern `support-ai-classify` uses inline).
3. **Ownership check** (if not service role): the caller must own the `snap_request` OR be admin.
4. **Fetch snap_request + photos:** read `snap_requests` row; skip if `status='resolved'|'canceled'`. Generate signed URLs for up to 4 entries in `photo_paths` (10-min expiry) from the `snap-photos` bucket.
5. **Call Haiku 4.5** via `callAnthropicTool<SnapClassifyResult>` with tool schema:
   ```ts
   type SnapClassifyResult = {
     summary: string;                    // ≤ 120 chars, e.g. "Looks like a leaky faucet under the kitchen sink"
     suggested_sku_id: string | null;    // null if AI can't match; UUID from service_skus if it can
     suggested_credits: number;          // integer estimate (clamped 20–400)
     area_inference: 'bath' | 'kitchen' | 'yard' | 'exterior' | 'other' | 'unknown';
     confidence: number;                 // 0–100
     urgency_signal: 'low' | 'medium' | 'high'; // hint only — customer still picks routing
   };
   ```
   System prompt: brief; describe Handled Home context + the routing concept + that output is shown to the customer before they commit.
6. **Writes.** Update `snap_requests` with `ai_classification = <result jsonb>` + `status='triaged'`. Insert `ai_inference_runs` row with `snap_request_id`, `model_name`, `input_summary` (`description` + `area`), `output` (the full result jsonb), `classification` (sub-object), `latency_ms`.
7. **Returns** `{ success: true, ...result }` on success. Non-2xx errors return `{error}` + appropriate status code.

Failure modes:
- Photo signed-URL failure → return 500, log, do NOT mark triaged.
- AI 429/529 → return that status; client falls back to placeholder card.
- Schema CHECK violation (e.g. invalid `suggested_sku_id` if we validate) → not validated in this batch; the column is just jsonb.

Note the `supabase/config.toml` convention — the function config file is written automatically via the conventional `supabase functions deploy` step listed in TODO.md. No config file is needed in this batch.

---

## Hooks

### `useCreateSnapDraft`

Similar shape to the first half of the deleted `useSubmitSnap`:

- Input: `{ file, description, area }`.
- Fetch active subscription → subscription_id + property_id.
- Compress + upload to `snap-photos/${user.id}/${snapId}/${photoId}.jpg`.
- Insert `snap_requests` row with `status='submitted'`, `credits_held=0`, `routing=null`.
- Return `{ snapId, subscriptionId, propertyId }`.
- Rollback on insert failure = remove uploaded object.

Invalidation: none yet (no balance change until finalize).

### `useClassifySnap`

- Input: `{ snapId }`.
- Calls `supabase.functions.invoke('snap-ai-classify', { body: { snap_request_id: snapId } })`.
- Returns the `SnapClassifyResult` shape on success.
- No side effects on failure other than surfacing the error — the row remains `status='submitted'` and the UI falls back to a static card.

### `useFinalizeSnap`

- Input: `{ snapId, subscriptionId, routing, creditsToHold }`.
- Update `snap_requests` row: `routing`, `credits_held=creditsToHold`, (no status change — it's already `triaged` after classify; finalize doesn't advance it — routing logic in 4.4 will push to `scheduled`/`dispatched`).
- Call `spend_handles(subscriptionId, user.id, creditsToHold, snapId)`.
- Rollback: on spend_handles failure, reset `snap_requests.credits_held=0` and clear `routing`.
- Returns `{ newBalance }`.
- Invalidation (prefix-match): `["subscription"]`, `["handle_balance"]`, `["handle_transactions"]`; `setQueryData(["handle_balance", subscriptionId], newBalance)` to avoid stale flash (continuing the pattern from the N1 fix in 4.2).

---

## SnapSheet changes

New flow:

1. **Step 1 — capture.** (unchanged) Pick photo.
2. **Step 2 — describe + area.** (unchanged) Textarea + area chips. Continue button now calls `createSnapDraft` with `{ file, description, area }`. On success, stores `{ snapId, subscriptionId, propertyId }` in state and advances to step 3. On failure, toast + stay on step 2.
3. **Step 3 — AI card.** On mount (after draft created), calls `classifySnap({ snapId })`. Shows one of three states:
   - **Loading**: skeleton — "Analyzing your photo…"
   - **Success**: AI card with `summary`, `area_inference` (overrides user chip if different; user still gets final say), `suggested_credits` (displayed as "~N credits").
   - **Error / timeout (5s)**: static "We'll estimate after submit." fallback with no AI info.
   Stores the result (or null on fallback) in state for step 4 to use. Continue advances to step 4.
4. **Step 4 — routing + submit.** (mostly unchanged) Routing radios show the AI-suggested hold if available, else the placeholder `SNAP_HOLD_DEFAULTS`. Submit calls `finalizeSnap({ snapId, subscriptionId, routing, creditsToHold })`. Success toast + reset + close.

### Cleanup on early close

If the user closes the sheet after draft creation but before finalize, the draft row stays orphaned (`status in ('submitted','triaged')`, `credits_held=0`). Options:
- **Delete on close** — `DELETE FROM snap_requests WHERE id=snapId AND credits_held=0`. Fire-and-forget. Also remove the uploaded photo.
- **Ignore** — let the row live; admin can clean up later.

**This batch:** Delete-on-close. Keeps the dataset tidy. The delete uses the existing customer_update RLS policy which allows owners to modify their own rows (a soft-delete would require a new column; hard delete is simpler for drafts with no credit hold yet).

Implement as a `cleanupDraft(snapId)` function that runs from the sheet's `onOpenChange(false)` handler when `snapId !== null && !finalized`.

---

## Types

**Continued `[OVERRIDE]`:** `snap_requests` / `job_tasks` types aren't in `src/integrations/supabase/types.ts` because the sandbox lacks `SUPABASE_ACCESS_TOKEN`. New hooks still use `as any` at the `.from("snap_requests")` boundary. Will be regenerated in a dedicated cleanup batch before Phase 4 closes — tracked in `docs/upcoming/TODO.md`.

Edge function has no type regen concern — it uses its own typed client.

---

## Deploy step (human, post-merge)

Append to `docs/upcoming/TODO.md`:
- `supabase functions deploy snap-ai-classify`
- Verify `ANTHROPIC_API_KEY` is set in project secrets.
- Migration auto-applies via GitHub↔Supabase integration on merge.

---

## Acceptance criteria

1. Migration applies: `ticket_id` is nullable, `snap_request_id` FK + CHECK in place, `get_advisors` clean.
2. Edge function rejects unauthenticated callers (401) and non-owners (403).
3. Edge function returns classification result within ~5s on a real photo and writes both `snap_requests.ai_classification` + `ai_inference_runs` row.
4. SnapSheet step 3 shows the AI card, with graceful fallback on timeout/error.
5. Step 4 routing radios show AI-suggested credits when available.
6. Early-close cleanup deletes the draft snap_requests row + uploaded photo.
7. `npx tsc --noEmit` clean.
8. `npm run build` clean.
9. Deno check on the edge function (if available locally via `supabase functions serve` or manual review since we can't deploy from sandbox).

---

## Review

Medium 3-lane + synthesis.

- **Lane 1 — spec completeness** (as sub-agent): does the diff satisfy every item in "Files touched" + "Scope" + "Acceptance criteria"?
- **Lane 2 — bug scan** (as sub-agent): auth gaps, SQL/FK issues, edge-function error handling, race conditions on the 3-step flow, cleanup-on-close correctness, stale closures in React.
- **Lane 3 — historical context** (as sub-agent): does the split from `useSubmitSnap` preserve the Batch 4.2 Lane-4 findings (invalidation keys, setQueryData on handle_balance, aria-pressed, maxLength)? Any regressions from the refactor?
- **Lane 4 — synthesis** (**as sub-agent**, NOT inline): cross-validate + score + final MUST/SHOULD/DROP report.

If context budget gets tight, acceptable `[OVERRIDE]` is: inline Lane 4 with the reason stated explicitly in the commit body. Preferring NOT to invoke that escape hatch — the workflow violation was the cause of the previous round's misses.
