# Batch 5.1 — BottomTabBar 4-tab restructure + center Snap FAB + legacy route redirects

> **Round:** 64 · **Phase:** 5 · **Size:** Medium
> **Review:** Quality — 3 lanes + Lane 4 synthesis (sub-agent). Lane 3 SKIPPED — first batch in this phase (no prior review findings on these files from Phase 5 scope).
> **Testing tiers:** T1 mandatory · T3 smoke on Vercel Preview (navigate each tab, open Snap FAB)
> **Branch:** `feat/round-64-phase-5-batch-5.1-bottom-nav`

---

## Problem

Customer bottom nav today is `Home | Schedule | Routine | Activity | More` — 5 tabs. The Round 64 design replaces it with 4 tabs + a center Snap FAB + (later) an avatar drawer: `Home | Services | [Snap FAB] | Visits | Help`. "Routine" collapses into Services (recurring services list); "Activity" collapses into Visits (a visit is an activity); "Schedule" collapses into Visits (upcoming visits tab); "More" becomes the avatar drawer (Batch 5.2).

For Batch 5.1 we ship the nav restructure + legacy route redirects. The AvatarDrawer itself is Batch 5.2.

## Goals

- Customer bottom nav renders 4 tabs with the Snap FAB in the visual center.
- Tapping the Snap FAB opens the existing `SnapSheet` (from Phase 4).
- Legacy tab routes (`/customer/more`, `/customer/routine`, `/customer/activity`) redirect to their canonical successors.
- `/customer/help` resolves (redirect to `/customer/support` — a dedicated Help page is a later concern).
- No redirect loops; existing sub-routes (`/customer/routine/review`, `/customer/routine/confirm`, `/customer/visits/:jobId`) continue to work.

## Scope (files)

1. **`src/components/BottomTabBar.tsx`** — restructure `customerTabs` from 5 entries to 4 + center FAB slot. Render the FAB inline inside the tab bar so tab-bar layout owns FAB positioning. Update `TAB_CHILD_PATHS` for the new hierarchy.
2. **`src/components/customer/SnapFab.tsx`** — remove the fixed-overlay positioning. Keep the trigger + SnapSheet wiring; restyle to fit as a center-slot element rendered by `BottomTabBar`. (Alternative that minimises diff: keep `SnapFab` as the same component; change only its positioning classes; adjust `BottomTabBar` to leave a center gap.)
3. **`src/components/AppLayout.tsx`** — remove the conditional `<SnapFab />` render now that `BottomTabBar` owns it.
4. **`src/App.tsx`** — route adjustments:
   - **Redirect** `/customer/more` → `/customer` (replace).
   - **Redirect** `/customer/routine` → `/customer/services` (replace).
   - **Redirect** `/customer/activity` → `/customer/visits` (replace).
   - **Remove** the existing `/customer/visits` → `/customer/activity` redirect (line 239).
   - **Add** `/customer/visits` → `<CustomerPropertyGate><CustomerActivity /></CustomerPropertyGate>` — temporary wiring; Batch 5.3 swaps `CustomerActivity` for a new `CustomerVisits` component. Using the same component at the new URL avoids a redirect loop and keeps content live.
   - **Add** `/customer/help` → `<Navigate to="/customer/support" replace />`.
   - **Keep** `/customer/routine/review`, `/customer/routine/confirm` active (they are onboarding sub-flows linked from `RoutineReview.tsx` / `RoutineConfirm.tsx`).
   - **Keep** existing redirects `/customer/history`, `/customer/upcoming`, `/customer/timeline` as-is (not in scope).

## Out of scope (explicit)

- **Consumer-link sweep.** ~18 places call `navigate("/customer/routine")` or `navigate("/customer/more")`. The redirects handle them correctly. Link updates happen in later batches (5.2 rewrites `/customer/more` consumers to open the drawer; 5.3 updates dashboard shortcuts).
- **`CustomerVisits` page.** Placeholder wiring only — Batch 5.3 creates the new component.
- **`AvatarDrawer`.** Batch 5.2.
- **Provider + admin tab bars.** Unchanged.
- **`MoreMenuPage` component removal.** Still used by provider + admin (`/provider/more`, `/admin/more`). Do not delete.

## Acceptance criteria

1. `BottomTabBar` customer render contains 4 labelled tabs + 1 center Snap FAB button.
2. Tapping `Snap` opens `SnapSheet` (same behavior as the overlay version had).
3. Tapping `Home` navigates to `/customer`.
4. Tapping `Services` navigates to `/customer/services`.
5. Tapping `Visits` navigates to `/customer/visits` and the existing Activity content renders (temporary; 5.3 replaces).
6. Tapping `Help` navigates to `/customer/help` → redirects to `/customer/support`.
7. Visiting `/customer/more` redirects to `/customer`.
8. Visiting `/customer/routine` redirects to `/customer/services`.
9. Visiting `/customer/activity` redirects to `/customer/visits`.
10. Sub-routes `/customer/routine/review`, `/customer/routine/confirm`, `/customer/visits/:jobId` continue to render their current components (no regression).
11. Navigating to `/customer/visits/<id>` highlights the Visits tab (via `TAB_CHILD_PATHS`).
12. Provider tab bar still shows 5 tabs; admin still uses `AdminShell` sidebar (no regression).
13. `npx tsc --noEmit` exits 0.
14. `npm run build` exits 0.
15. `npm run lint` exits 0 (mandatory per testing-strategy.md §3 Tier 1).

## Data shape / schema changes

None.

## Edge cases

- **Deep link to `/customer/more?drawer=true`.** Batch 5.2 will later consume this param to open the drawer. For 5.1, the redirect simply drops it. Document the param in the redirect comment for Batch 5.2 to pick up.
- **`replace` vs. push navigation.** All redirects use `replace` so the back button doesn't loop through deleted URLs.
- **Visit detail route highlighting.** `TAB_CHILD_PATHS` must now map `/customer/visits` → `["/customer/visits/"]` (trailing slash for visit detail child paths).

## Testing notes

- **Tier 1 (mandatory):** `npx tsc --noEmit` + `npm run build` + `npm run lint`.
- **Tier 2:** No new pure functions or hooks; no Vitest additions expected.
- **Tier 3 smoke (run after Vercel Preview green):**
  - Navigate to `/customer`; tab bar renders 4 tabs + FAB.
  - Tap each tab; destination loads.
  - Tap Snap FAB; SnapSheet opens.
  - Tap a Visit row; `/customer/visits/:id` loads and Visits tab highlights.
  - Visit `/customer/more`, `/customer/routine`, `/customer/activity` manually; each redirects.
- **Tier 5:** Optional, not required to merge. If time permits, run the Sarah judge on the Home → Snap flow to establish a baseline; not merge-blocking.

## Screenshots

After implementation:
- `/customer` with new 4-tab nav + FAB → attach to PR.
- Visit Detail URL with new tab highlighting → attach to PR.

## Risks

- **SnapFab regression.** The overlay version is in use today; changing its DOM parent could shift z-index or safe-area positioning. Mitigation: preserve `safe-bottom` behavior; validate on a real preview URL (Tier 3 smoke).
- **Provider/admin MoreMenuPage.** Changing the customer `/customer/more` route must not cascade to provider/admin routes. The change is customer-scoped.
- **Consumer-link redirects add a flash.** `navigate("/customer/routine")` from Dashboard will now render Dashboard → Routine → immediate replace to Services. Acceptable for 5.1; 5.2/5.3 clean up callers.

## Review-lane notes

- **Lane 1 (spec completeness):** Verify each acceptance criterion is implemented. Call out missing redirects or missing tab-bar entries.
- **Lane 2 (bug scan):** Diff-only. Watch for: infinite redirect loops (did we remove the old `/customer/visits` → `/customer/activity` redirect?), TAB_CHILD_PATHS drift, SnapFab z-index regression, `CustomerPropertyGate` wrapping lost on any route.
- **Lane 3 SKIPPED** — first batch in phase; no prior review findings on `BottomTabBar.tsx`/`App.tsx` redirect block from Phase 5 scope. Documented as `[OVERRIDE: Lane 3 skipped — first batch in phase, no prior review findings]` in the fix commit if any.
- **Lane 4 (synthesis):** Must run as a sub-agent per lessons-learned.md "Code review" and CLAUDE.md §7. Cross-read the redirect block + TAB_CHILD_PATHS + SnapFab integration for subtle loops or highlight drift.
