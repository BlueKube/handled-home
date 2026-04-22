# Batch 4.2 — SnapSheet + useSubmitSnap + SnapFab

> **Phase:** 4 (Snap-a-Fix) · **Size:** Medium · **Review tier:** Medium 3-lane + synthesis
> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` lines 200–253
> **Depends on:** Batch 4.1 (schema) — merged to main as PR #6

---

## Goal

Ship the capture flow: a floating Snap FAB on every customer screen opens a photo-first sheet that uploads a photo, lets the user describe + pick an area + pick a routing, and writes a `snap_requests` row with `snap_hold` credits locked via `spend_handles`. No AI call yet (4.3), no routing handlers yet (4.4) — just the end-to-end capture and persist.

---

## Files touched

- **New:** `src/lib/imageCompression.ts` — extract the canvas compressor from `useJobActions` so snap + job flows share it.
- **Modified:** `src/hooks/useJobActions.ts` — import `compressImage` from `@/lib/imageCompression` instead of the inline helper.
- **New:** `src/hooks/useSubmitSnap.ts` — mutation hook: compress → upload to `snap-photos` bucket → insert `snap_requests` → `spend_handles` with `reference_type='snap_hold'`.
- **New:** `src/components/customer/SnapSheet.tsx` — 4-step bottom sheet (capture / describe+area / preview / route+submit).
- **New:** `src/components/customer/SnapFab.tsx` — floating button, bottom-center above bottom tabs.
- **Modified:** `src/components/AppLayout.tsx` — mount `SnapFab` when `effectiveRole === 'customer'`.

No new migrations. No edge functions. No routing handlers.

---

## Scope

### `src/lib/imageCompression.ts`

Extract the existing `compressImage(file: File, maxDim: number): Promise<Blob>` from `src/hooks/useJobActions.ts` (lines 187–213) verbatim. Default quality 0.85, jpeg output. Exported as a named function. `useJobActions.ts` imports it and drops the local copy.

### `src/hooks/useSubmitSnap.ts`

Signature: `useSubmitSnap()` → mutation that takes:
```ts
type SnapSubmitInput = {
  file: File;
  description?: string;
  area?: 'bath' | 'kitchen' | 'yard' | 'exterior' | 'other';
  routing: 'next_visit' | 'ad_hoc';
  creditsToHold?: number; // defaults to a placeholder until 4.3 wires AI
};
```

Returns the inserted snap_request id.

Steps (in order):
1. Resolve `customer_id = user.id`.
2. Fetch the active subscription (`useCustomerSubscription`-style query inside the mutation, or take it as a prop) to get `subscription_id` and `property_id`.
3. Generate `snap_id = crypto.randomUUID()` + `photo_id = crypto.randomUUID()`.
4. `compressImage(file, 1200)` → `Blob`.
5. Upload to `snap-photos` bucket at path `${customer_id}/${snap_id}/${photo_id}.jpg` with `contentType: 'image/jpeg'`.
6. Insert `snap_requests` row with: `id=snap_id`, `customer_id`, `property_id`, `subscription_id`, `photo_paths=[<path>]`, `description`, `area`, `routing`, `status='submitted'`, `credits_held=<amount>`.
7. Call `supabase.rpc('spend_handles', { p_subscription_id, p_customer_id, p_amount, p_reference_id: snap_id })`. (The existing `spend_handles` RPC takes the subscription + customer + integer amount + reference_id UUID; the `reference_type` on the transaction row is currently plain TEXT in the `handle_transactions` table. If the RPC doesn't accept a reference_type argument, fall back to the existing call shape and note that we'll set `reference_type='snap_hold'` in a later refinement — a follow-up RPC tweak.)

On any failure after the upload: delete the uploaded object (best-effort), rethrow. If `spend_handles` fails, delete the `snap_requests` row too.

Invalidation: `queryClient.invalidateQueries({ queryKey: ['subscription', user.id] })` so CreditsRing refreshes.

Types gap: until Supabase types regen for `snap_requests`, cast at the `.from('snap_requests')` call with `as any` per lessons-learned (Phase 2 Batch 2.2 pattern). Log in commit body as `[OVERRIDE: types not regen'd in sandbox — follow-up before 4.3 merges]`.

### `src/components/customer/SnapSheet.tsx`

Bottom sheet (reuses `@/components/ui/sheet`) with 4 steps. Opens via an `open`/`onOpenChange` controlled prop pair. Props:
```ts
type SnapSheetProps = { open: boolean; onOpenChange: (open: boolean) => void; };
```

State: `step: 1 | 2 | 3 | 4`, `photo: File | null`, `description: string`, `area: Area | null`, `routing: 'next_visit' | 'ad_hoc' | null`.

- **Step 1 — capture.** Single "Take photo / Upload" button (`<input type="file" accept="image/*" capture="environment" />`). Once a file is chosen, preview it and advance to step 2.
- **Step 2 — describe + area.** Optional `<Textarea>` (≤ 280 char). Area chip row: Bath / Kitchen / Yard / Exterior / Other. Continue button advances to step 3.
- **Step 3 — AI preview placeholder.** Static card: "We'll estimate credits after submit." (4.3 will replace with real AI classification result.) Continue → step 4.
- **Step 4 — routing + submit.** Radio: "Urgent — we'll dispatch soon" (holds `AD_HOC_HOLD = 200` credits, placeholder) vs "Next visit — add to my routine" (holds `NEXT_VISIT_HOLD = 120` credits, placeholder). Submit calls `useSubmitSnap` with the collected state.

On submit success: toast "Snap submitted", reset state, close sheet. On insufficient-credits error (surfaced by `spend_handles`): toast destructive with message, do not reset.

Reset on close (mirror `ReportIssueSheet` pattern).

### `src/components/customer/SnapFab.tsx`

Floating circular button, fixed position bottom-center above the bottom tab bar. 56×56px, accent color, camera icon, `aria-label="Snap a fix"`. Manages its own sheet `open` state. Renders `<SnapSheet open={open} onOpenChange={setOpen} />` alongside. `z-50` (same as BottomTabBar so it sits on top of page content but stays below any modal).

Position: `fixed bottom-16 left-1/2 -translate-x-1/2` so it sits just above the 14-tall bottom tabs without overlapping them. Phase 5 will reposition into the center tab slot.

### `src/components/AppLayout.tsx`

Add `<SnapFab />` right above `<BottomTabBar />`, conditional on `effectiveRole === 'customer'`. Import `useAuth` (already in scope via the preview banner) → read `effectiveRole`.

---

## What is deliberately NOT in this batch

| Item | Where |
|------|-------|
| AI triage / `snap-ai-classify` edge function | 4.3 |
| `handle_snap_routing` RPC / routing execution | 4.4 |
| `dispatch_requests` table | 4.4 |
| `resolve_snap` / refund path | 4.4 |
| Type regen for `snap_requests` / `job_tasks` | deferred (ran into sandbox tooling gap; will happen before 4.3 ships) |
| Bottom-nav restructure (5 → 4 + center FAB) | Phase 5 |
| Multi-photo capture / gallery step | deferred |

---

## Acceptance criteria

1. `SnapFab` renders only for authenticated customers, above the bottom tabs.
2. Sheet opens from FAB, advances through steps, closes cleanly.
3. Photo uploads to `snap-photos/${customer_id}/${snap_id}/${photo_id}.jpg`.
4. A `snap_requests` row is written with the expected fields.
5. `handle_transactions` row appears with `reference_type='snap_hold'` (if RPC allows) or the standard `reference_type` and `reference_id=snap_id`.
6. Insufficient credits → destructive toast, no row written.
7. `useJobActions.uploadPhoto` still works (imports from the extracted util).
8. `npx tsc --noEmit` clean (allowing the `as any` cast on snap_requests until types regen).
9. `npm run build` clean.

---

## Risks / known edge cases

- **Types gap.** `snap_requests` / `job_tasks` not yet in `src/integrations/supabase/types.ts`. Using `as any` at the boundary. Reviewers please flag this as an `[OVERRIDE]` not a bug.
- **`spend_handles` reference_type.** Existing RPC sets `reference_type` internally to `'job'` or similar. If we can't pass `'snap_hold'` via the current RPC signature, the credit hold is correctly recorded but labeled inaccurately in `handle_transactions.reference_type` — a schema-level refinement for a later batch. Non-blocking.
- **FAB overlap.** 56×56 button at `bottom-16` should clear the 14-tall tab bar. Verify on a short-height mobile viewport if possible (visual validation deferred — sandbox lacks a browser).
- **Camera permission UX.** `<input type="file" capture="environment">` works cross-platform without permission prompts on iOS/Android. Native camera capture via Capacitor is deferred.

---

## Review notes

Medium tier: 3 lanes + synthesis. Lane 3 applies — Batch 4.1 left review findings on this branch's history (the customer_id FK + search_path + index de-dup fixes). Lane 3 should scan for whether any of the new files re-introduce patterns those findings warned against.

Tag the commit with `[OVERRIDE: types not regen'd — as any on snap_requests at .from() call; will regenerate before 4.3 merges]` so it's visible in `git log`.
