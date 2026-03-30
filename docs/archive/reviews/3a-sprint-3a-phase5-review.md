# Sprint 3A Phase 5 Review — Provider UI + P4 Finding Fixes

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** Migration `20260301052228` (P4-F1 fix), `LevelSufficiencyForm`, `JobDetail`, `JobComplete`, `useJobDetail` enrichment, `VisitDetail` button wiring (P4-F2), `AddServicesSheet` level gate (P4-F3), `RoutineItem.level_id` (P4-F4), `SkuDetailModal` guidance questions (P4-F5)
**Spec:** `docs/Sprints/3A-Levels.md`

---

## Verdict: PASS — 0 CRITICAL, 1 HIGH, 2 MEDIUM, 2 LOW

Phase 5 is well-implemented and the LevelSufficiencyForm is particularly well-designed. All previous CRITICAL/HIGH findings are resolved.

---

## P4 Finding Fix Verification

### P4-F1 (CRITICAL → FIXED): Auth check case mismatch

Migration `20260301052228` recreates `insert_courtesy_upgrade` with `pm.status = 'ACTIVE'` (line 28). Verified correct — matches all existing RLS policies. Auth check, advisory lock, and 6-month guardrail all intact.

### P4-F2 (HIGH → FIXED): VisitDetail buttons now wired

`VisitDetail.tsx` now:
- Imports `useUpdateRoutineItemLevel` and `useRoutine` (lines 6-7)
- Creates `handleUpdateLevel(levelId, skuId)` that finds the matching routine item and calls `updateLevel.mutate()` (lines 35-52)
- Courtesy upgrade button calls `handleUpdateLevel(courtesyUpgrade.performed_level_id, courtesyUpgrade.sku_id)` (line 215)
- Recommendation "Update going forward" button calls `handleUpdateLevel(recommendation.recommended_level_id, recommendation.sku_id)` (line 243)
- Both buttons show `disabled={updateLevel.isPending}` loading state
- `useCustomerVisitDetail` enriched to pass `performed_level_id` + `sku_id` through the courtesy upgrade and recommendation objects

**Residual**: "Keep current level" button (line 247) still has no `onClick` handler. See P5-F3.

### P4-F3 (MEDIUM → FIXED): Quick-add button now gates SKUs with levels

`AddServicesSheet` refactored with a `QuickAddButton` sub-component:
- `useDefaultLevelId(skuId)` hook checks if the SKU has active levels
- SKUs with levels show "Choose Level" button that opens the detail modal instead of quick-adding
- SKUs without levels show the normal "Add" button
- Clean separation of concerns

### P4-F4 (MEDIUM → FIXED): `RoutineItem.level_id` added to interface

`useRoutine.ts` line 19: `level_id: string | null;` — confirmed. `RoutineItemCard` now uses `item.level_id` directly (line 23) instead of `(item as any).level_id`.

### P4-F5 (MEDIUM → FIXED): Guidance questions shown in SkuDetailModal

`SkuDetailModal` now:
- Fetches `useGuidanceQuestions(sku.sku_id)` (line 35)
- Renders questions with tap-to-select option buttons (lines 72-97)
- Computes `guidanceRecommendedLevelId` via `useMemo` that finds the highest `maps_to_level_number` from selected answers (lines 54-68)
- Auto-selects recommended level via `useEffect` (lines 71-75)
- Shows "Recommended based on your answers" hint (line 103)

**Note**: The mapping uses `maps_to_level_number` from options, but the option schema defined in `GuidanceQuestionEditor` stores `level_bump` (additive) and `minutes_bump`, not `maps_to_level_number` (absolute). See P5-F1.

---

## Phase 5 Provider UI Review

### useJobDetail Enrichment — PASS

- `job_skus` query now explicitly selects level columns: `scheduled_level_id, performed_level_id` (line 104)
- Batch-resolves level IDs to full level objects (label, inclusions, planned_minutes, proof_photo_min) via `levelMap` (lines 116-130)
- `JobSku` interface properly typed with all resolved fields (lines 24-36)

### JobDetail "What to do" Card — PASS

Spec §6.6 requires: SKU name + Level label, Planned minutes target, Scope bullets (max 6), Proof requirements.

All present:
- Level label badge: `s.scheduled_level_label` rendered as colored inline badge (lines 143-147)
- Planned minutes: `{s.scheduled_level_planned_minutes} min target` with Clock icon (lines 150-155)
- Scope bullets: inclusions sliced to 6 with checkmark styling (lines 156-163)
- Proof photos: `{s.scheduled_level_proof_photo_min} photo(s) required` with Camera icon (lines 165-171)
- Fallback for SKUs without levels shows `duration_minutes_snapshot` (lines 172-178)

### LevelSufficiencyForm — PASS (excellent)

Three-step flow matching spec §6.6:

**Step 1 "ask"**: "Was the scheduled level sufficient to meet Handled standards?"
- Yes → mark done, call `onComplete()`
- No → proceed to recommendation

**Step 2 "recommend"**:
- Shows only higher levels than scheduled (filtered by `level_number`)
- 6 reason codes matching spec §6.6 exactly
- Note field appears for "other" reason code (or if user starts typing)
- Courtesy upgrade checkbox: "I performed the higher level today"
- Submit disabled until both `recommendedLevelId` and `reasonCode` are set
- If "other" selected, note is required too (line 231)

**Step 3 "courtesy"** (only if checkbox was checked):
- Confirmation card showing "You performed X instead of Y"
- "Skip" button to proceed without recording upgrade
- "Confirm Upgrade" calls `courtesyMutation.mutateAsync()` which uses the SECURITY DEFINER RPC

**Error handling**: If courtesy upgrade fails (6-month guardrail), still proceeds to done (lines 100-104). This is correct — the recommendation was already recorded, and the guardrail failure is expected and should not block completion.

### JobComplete Page — PASS

- Filters `skusWithLevels = skus.filter(s => !!s.scheduled_level_id)` (line 44)
- Gates submit button with `allLevelFeedbackDone` (line 48)
- Shows "Complete level feedback first" label when feedback is pending (line 182)
- Passes `propertyId` and `providerOrgId` from job data to each `LevelSufficiencyForm`
- Tracks completion via `completedLevelSkus` Set (local state)

---

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| **P5-F1** | **HIGH** | **Guidance question option mapping mismatch.** `SkuDetailModal` (line 62) reads `opt.maps_to_level_number` to compute the recommended level, but the `GuidanceQuestionEditor` stores options with `level_bump` (additive integer) and `minutes_bump` — NOT `maps_to_level_number`. No admin-created options will have `maps_to_level_number`, so `guidanceRecommendedLevelId` will always be `null`. **Fix:** Either (a) change the recommendation logic to use `level_bump` additively (starting from Level 1, add the max `level_bump` from answers), or (b) update `GuidanceQuestionEditor` to store `maps_to_level_number` as an absolute field. Option (a) is simpler and consistent with the existing editor. |
| **P5-F2** | **MEDIUM** | **`LevelSufficiencyForm` returns `null` when `!hasLevels`, but `JobComplete` doesn't call `onComplete` for these.** When a SKU has no active levels or no `scheduled_level_id`, the component returns `null`. However, `skusWithLevels` already filters to only those with `scheduled_level_id` (JobComplete line 44), so this is safe. The actual gap is: if a SKU has `scheduled_level_id` but all its levels were deactivated after the job was scheduled, `hasLevels` becomes `false`, the form returns `null`, and the level feedback is never marked complete — **the submit button stays permanently disabled**. **Fix:** In `LevelSufficiencyForm`, when `!hasLevels`, call `onComplete()` via a `useEffect` on mount instead of silently returning null. |
| **P5-F3** | **MEDIUM** | **"Keep current level" button still has no handler.** `VisitDetail.tsx` line 247 renders the decline button with no `onClick`. Per spec §6.8: "Track declines for ops insight." At minimum it should dismiss the recommendation UI. Ideally it should record the decline (e.g., insert into `level_recommendations` with a `declined_at` column, or a separate `level_recommendation_responses` table). **Fix for now:** Add `onClick` that hides the recommendation card (local state) + optionally `toast.info("Keeping current level")`. |
| **P5-F4** | LOW | **Courtesy upgrade error is silently swallowed.** `LevelSufficiencyForm` lines 100-104 catch the error and proceed to done. The provider gets no feedback that the courtesy upgrade failed (e.g., 6-month guardrail violation). Should show a toast: `toast.error("Courtesy upgrade not recorded: already used in last 6 months")` before proceeding. The recommendation is still saved correctly. |
| **P5-F5** | LOW | **`useRoutine` called without `planId` in VisitDetail.** Line 32: `useRoutine(property?.id)` — the `useRoutine` hook's second parameter is `planId` which defaults to the active subscription. If the customer has no active subscription, the routine query will fail silently and `handleUpdateLevel` will show "No active routine found." This is an edge case (completed visits imply an active subscription), but worth noting. |

---

## Spec Coverage Check (Phase 5 — Provider UI)

| Spec Requirement | Covered? | Notes |
|-----------------|----------|-------|
| §6.6 Job header: SKU name + Level label | YES | Badge + label in "What to do" card |
| §6.6 Job header: Planned minutes target | YES | Clock icon + minutes |
| §6.6 Job header: Scope bullets (max 6) | YES | Inclusions with checkmark, sliced to 6 |
| §6.6 Job header: Proof requirements | YES | Camera icon + photo count |
| §6.6 Sufficiency prompt at completion | YES | LevelSufficiencyForm step 1 |
| §6.6 If "No": choose recommended level | YES | Higher levels shown in step 2 |
| §6.6 If "No": choose reason code | YES | All 6 spec codes present |
| §6.6 If "No": optional note | YES | Shown for "other" or any reason |
| §6.6 If "No": optional supporting photos | NO | Not implemented (P5-F6 below) |
| §6.7 Courtesy upgrade selection | YES | Checkbox + confirmation step |
| §6.7 Courtesy upgrade guardrails | YES | RPC with auth + advisory lock + 6-month check |
| §6.7 Proof + reason code for courtesy | PARTIAL | Reason code from recommendation, but no additional proof photos for the courtesy upgrade itself |
| Completion gated on level feedback | YES | Submit disabled until all SKU feedback done |

---

## Instructions for Lovable

> **Phase 5 is solid. Fix the following before Phase 6:**
>
> 1. **P5-F1 (HIGH):** Fix the guidance question mapping in `SkuDetailModal`. Change line 62 from:
>    ```js
>    if (chosen?.maps_to_level_number && chosen.maps_to_level_number > maxLevelNumber)
>    ```
>    to use the additive `level_bump` field that the admin editor actually stores:
>    ```js
>    // Start from base level 1, add the highest level_bump from answers
>    let totalBump = 0;
>    for (const q of activeQuestions) {
>      const answerIdx = questionAnswers[q.id];
>      if (answerIdx === undefined) continue;
>      const chosen = ((q.options as any[]) ?? [])[answerIdx];
>      if (chosen?.level_bump) totalBump = Math.max(totalBump, chosen.level_bump);
>    }
>    const targetNumber = 1 + totalBump;
>    return activeLevels.find(l => l.level_number === targetNumber)?.id ?? null;
>    ```
>
> 2. **P5-F2 (MEDIUM):** In `LevelSufficiencyForm`, add a `useEffect` that calls `onComplete()` when `!hasLevels`:
>    ```js
>    useEffect(() => { if (!hasLevels) onComplete(); }, [hasLevels]);
>    ```
>
> 3. **P5-F3 (MEDIUM):** Add an `onClick` to "Keep current level" that hides the recommendation (local `dismissed` state) + shows a toast.
>
> 4. **P5-F4, P5-F5 (LOW):** Add a toast on courtesy upgrade failure; consider passing `planId` to `useRoutine` in VisitDetail. Not blocking.
>
> **Phase 6 (Analytics) can proceed.** P5-F1 should be fixed in parallel — it affects the customer add flow, not provider completion.
