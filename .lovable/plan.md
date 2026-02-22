

# Module 07 Gap Remediation Plan

Based on the Claude Code review, this plan addresses all 15 identified gaps organized by priority.

---

## High Priority (3 items)

### H1: Demand model alignment (Issue #1)

The `confirm_routine` RPC computes demand as sum-of-weekly-equivalents x 4, which can reject valid routines. For example, 4 weekly items = demand 16, but the plan might give 4 "service weeks" meaning something different.

**Fix:** The current model actually aligns with the plan config as designed -- credits/count/minutes per cycle map directly to weighted demand over 4 weeks. The real issue is documentation clarity, not a bug. The RPC already handles all 3 model types (credits, count, minutes) and the client-side `computeCycleDemand` matches the RPC logic. No code change needed -- this is working as designed. If a plan gives "4 credits per cycle" and each weekly service costs 1 credit/week x 4 weeks = 4, that's correct.

**Action:** No code change. The demand model is consistent between client and RPC.

### H2: Biweekly pattern optimizer (Issue #2)

Currently defaults to pattern A. No scoring based on zone stop count balance or geo proximity.

**Fix:** Implement client-side scoring in a new `useBiweeklyOptimizer` hook. Logic:
- Query `zone_service_day_capacity` for the customer's zone to get assigned counts
- Query `routine_items` for other routines in the zone to count biweekly items on pattern A vs B
- Recommend the pattern with fewer existing stops (load balancing)
- Auto-set recommended pattern when a biweekly cadence is first selected
- Show recommendation indicator in `BiweeklyPatternToggle`

### H3: Allow draft without subscription (Issue #3)

The Build page currently blocks access without a subscription (lines 112-121 of Routine.tsx). Spec 5.1 says drafts should be allowed without a sub; only confirm should be gated.

**Fix:** Remove the subscription gate from the Build page. Instead:
- If no subscription, show the Truth Banner in a "preview" mode with placeholder values
- Allow adding services and adjusting cadences freely
- The "Review Routine" button changes to "Subscribe to continue" when no subscription exists
- The Confirm page already has a subscription gate -- that stays

---

## Medium Priority (6 items)

### M4: Implement Auto-fit (Issue #4)

Currently a stub that shows a toast. Need real logic.

**Fix:** Implement in `useRoutineActions.ts`:
- Sort items by cadence frequency (weekly first, then biweekly, etc.)
- Downgrade cadences one step at a time (weekly -> biweekly -> four_week) starting from the last item
- Stop when demand fits within entitlement
- Return a diff summary showing what changed
- Show the diff in a toast or inline summary

### M5: Add paused SKU check on confirm (Issue #5)

The `confirm_routine` RPC snapshots SKU data but never checks `service_skus.status`.

**Fix:** Add a check in the RPC: before snapshotting, verify each SKU has `status = 'active'`. If any SKU is paused/draft/archived, raise an exception naming the offending SKU. This requires a migration to update the RPC.

### M6: Unique constraint collision on activation (Issue #7)

`UNIQUE (property_id, status)` means setting a routine to "active" fails if another active routine exists.

**Fix:** In the `confirm_routine` RPC, before setting the new routine to active, archive any existing active routine for the same property by setting its status to "archived". This needs a migration to:
1. Add "archived" as a valid status
2. Update the RPC to archive the previous active routine first

### M7: Zone Ops Config admin UI (Issue #8)

The table and hooks exist but no admin UI renders them.

**Fix:** Create `src/components/admin/ZoneOpsConfigPanel.tsx`:
- Shows provider home base label + lat/lng fields
- Target stops per week (number input)
- Max stops per week (optional number input)
- Save button calling `useUpsertZoneOpsConfig`
- Render this panel inside the existing `ZoneDetailSheet` component

### M8: Admin bundles N+1 query (Issue #9)

Individual queries per routine in a loop.

**Fix:** Rewrite the admin bundles query to use a single join approach:
- Fetch all routines with a single query
- Fetch all versions for those routine IDs in one query
- Fetch all items for those version IDs in one query
- Join in JavaScript

### M9: Admin detail missing plan name + service day (Issue #13)

The admin bundles detail sheet shows truncated customer UUID, no plan name, no service day.

**Fix:** In the admin bundles query, also fetch:
- Plan name from `plans` table (join on plan_id)
- Customer name from `profiles` table (join on customer_id)
- Service day from `service_day_assignments` (join on property_id)
- Show these in both the list card and detail sheet

---

## Low Priority (6 items)

### L10: SKU detail uses generic text (Issue #10)

The `SkuDetailModal` shows "Full service as described in your plan" and "Specialty treatments, hazardous materials, structural work" as hardcoded placeholders.

**Fix:** Fetch the full SKU record when opening the modal. Use `inclusions` and `exclusions` arrays from `service_skus` table. Show actual data, with a fallback to a generic message if arrays are empty.

### L11: Review cards missing scope bullets (Issue #11)

`ReviewServiceCard` doesn't show what's included/excluded per SKU.

**Fix:** Fetch SKU inclusions/exclusions data and pass to ReviewServiceCard. Show bullet lists of included and excluded items.

### L12: Nudge not dismissible (Issue #12)

The gentle nudge banner on the dashboard has no dismiss mechanism and no frequency limit.

**Fix:** Add a dismiss button (X icon). Store dismissed state in localStorage with a timestamp. Only show again after 7 days.

### L13: Swap pattern never blocks (Issue #14)

The biweekly pattern toggle always allows swapping. Spec says it should block if infeasible.

**Fix:** Pass zone capacity data to `BiweeklyPatternToggle`. If the target pattern's weeks would create an imbalanced load (e.g., >90% capacity on those weeks), show a warning or disable the swap with an explanation.

### L14: Review acknowledgement checkbox (Issue #6)

No explicit acknowledgement before moving to confirm.

**Fix:** Add a checkbox at the bottom of the Review page: "I've reviewed the services and proof expectations above." The "Confirm Routine" button stays disabled until checked.

### L15: Cron still not configured (Issue #15, carried from M06)

The cleanup edge function has auth but no trigger.

**Fix:** Already addressed in the M06 remediation (pg_cron was configured). Verify it's still active.

---

## Files Impacted

**Database migration (new):**
- Update `confirm_routine` RPC: add paused SKU check + archive previous active routine (M5, M6)

**React hooks:**
- `src/hooks/useRoutinePreview.ts` (new `useBiweeklyOptimizer` export or separate file)
- `src/hooks/useRoutineActions.ts` (M4: auto-fit implementation)

**Components:**
- `src/pages/customer/Routine.tsx` (H3: remove sub gate, H2: wire optimizer)
- `src/components/routine/BiweeklyPatternToggle.tsx` (H2: show recommendation, L13: feasibility)
- `src/components/routine/EntitlementGuardrails.tsx` (M4: wire real auto-fit)
- `src/components/routine/SkuDetailModal.tsx` (L10: real SKU data)
- `src/components/routine/ReviewServiceCard.tsx` (L11: scope bullets)
- `src/pages/customer/RoutineReview.tsx` (L14: acknowledgement checkbox)
- `src/pages/customer/Dashboard.tsx` (L12: dismissible nudge)
- `src/pages/admin/Bundles.tsx` (M8: fix N+1, M9: add plan/customer/service day)
- `src/components/admin/ZoneDetailSheet.tsx` (M7: embed ZoneOpsConfigPanel)

**New files:**
- `src/hooks/useBiweeklyOptimizer.ts` (H2)
- `src/components/admin/ZoneOpsConfigPanel.tsx` (M7)

---

## Implementation Order

1. **Database migration**: M5 (paused SKU check) + M6 (archive previous active routine) in confirm_routine RPC
2. **Hooks**: H2 (biweekly optimizer), M4 (auto-fit logic)
3. **Customer UI**: H3 (remove sub gate), L10 (SKU detail), L11 (review scope), L14 (acknowledgement checkbox), L12 (dismissible nudge)
4. **Admin UI**: M7 (zone ops config panel), M8 + M9 (bundles query + detail enrichment)
5. **Polish**: L13 (swap pattern feasibility), H2 wiring into BiweeklyPatternToggle

