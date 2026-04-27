# Batch 8.2 — screen-flows + app-flow + design-guidelines + archive + Round 64 close

> **Round:** 64 · **Phase:** 8 of 8 · **Batch:** 8.2 of 2 · **FINAL BATCH OF ROUND 64**
> **Branch:** `docs/round-64-batch-8.2-screen-flows-archive-round-close`
> **Size:** Small · **Tier:** Quality

## Review: Quality

Per CLAUDE.md §5 fact-checker rule for business-critical docs: 2 lanes (Spec + Fact Check) + synthesis. Lane 3 skipped (docs + file moves only).

## Why

Final batch of Round 64. Closes the doc-sync gap on the remaining north-star docs (`screen-flows.md`, `app-flow-pages-and-roles.md`, `design-guidelines.md`), executes the Round Cleanup invariant (archive working folder, delete FULL-IMPLEMENTATION-PLAN.md), and ships the legacy `Bundles.tsx` → `Routines.tsx` rename that's been on the TODO since Phase 6.

## Scope

### In

1. **`docs/screen-flows.md`** — append new section "Round 64 New Screens" with brief sub-sections covering Snap sheet, customer Services + Visits pages, VisitDetail three-mode (preview / live / complete), AvatarDrawer, BundleDetail, Services SeasonalBundleSpotlight, admin SeasonalBundles + BundleEditSheet, BringSomeoneStep onboarding step, Referrals restyle, post-visit + dashboard growth cards. Each sub-section is short — purpose, layout outline, key states. Do NOT rewrite existing sections.

2. **`docs/app-flow-pages-and-roles.md`** — append new routes from Round 64 (`/customer/services`, `/customer/visits`, `/customer/snap`, `/customer/credits`, `/customer/bundles/:slug`, `/customer/onboarding/byoc/:token`, `/admin/seasonal-bundles`, `/admin/routines` after rename) and document the legacy redirects. Update onboarding step count (was 8, now 9 with `bring_someone`).

3. **`docs/design-guidelines.md`** — append "Type chip color tokens" sub-section (Included / Snap / Bundle / Credits-paid) under Component-scoped tokens; brief CreditsRing + LowCreditsBanner pattern notes under Component patterns.

4. **Rename `src/pages/admin/Bundles.tsx` → `src/pages/admin/Routines.tsx`**:
   - `git mv` the file
   - Update `src/App.tsx` lazy import from `AdminBundles` → `AdminRoutines`, route `/admin/bundles` → `/admin/routines`
   - Grep for any other references to `/admin/bundles` or the `Bundles.tsx` import path; update to `/admin/routines` / `Routines`
   - The new `/admin/seasonal-bundles` route from Phase 6.3 is unaffected

5. **Round Cleanup** (CLAUDE.md "Round Cleanup" section):
   - `mkdir -p docs/archive/round-64-pricing-tiered-model-2026-04-27/batch-specs`
   - Move `docs/working/plan.md` → `docs/archive/round-64-pricing-tiered-model-2026-04-27/plan.md`
   - Move `docs/working/batch-specs/*` → `docs/archive/round-64-pricing-tiered-model-2026-04-27/batch-specs/`
   - **Leave** `docs/working/sarah-backlog.md` in place — it's a persistent operational tool spanning rounds (per CLAUDE.md §5.9 wording), not a per-round artifact
   - Delete `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` (it stays in archive as the spec record via the working/plan.md archive linkage; per PRD: "It stays in archive as record" — keeping the original at `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` would imply it's still upcoming)

6. **`docs/upcoming/TODO.md`** — strike the "Rename legacy `src/pages/admin/Bundles.tsx`" item (now done in this PR). Add no new items unless surfaced.

### Out

- Wholesale rewrites of any north-star doc — out of scope; Round 65 work
- Deleting sarah-backlog.md (kept; cross-round persistent tool)
- New code beyond the rename + import update

## Files touched

```
docs/screen-flows.md                                           MODIFIED (append-only)
docs/app-flow-pages-and-roles.md                               MODIFIED (append-only)
docs/design-guidelines.md                                      MODIFIED (append-only)
docs/upcoming/TODO.md                                          MODIFIED (strike Bundles rename)
docs/upcoming/FULL-IMPLEMENTATION-PLAN.md                      DELETED
docs/working/plan.md                                           MOVED → docs/archive/...
docs/working/batch-specs/*                                     MOVED → docs/archive/.../batch-specs/
src/pages/admin/Bundles.tsx                                    RENAMED → Routines.tsx
src/App.tsx                                                    MODIFIED (import + route)
```

## Acceptance criteria

- [ ] `docs/working/plan.md` no longer exists in `docs/working/` (moved to archive).
- [ ] `docs/working/batch-specs/` is empty (or removed entirely if no other files remain besides this batch's own spec, which also moves).
- [ ] `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` no longer exists.
- [ ] `docs/archive/round-64-pricing-tiered-model-2026-04-27/` exists with the moved files.
- [ ] `docs/working/sarah-backlog.md` still exists.
- [ ] `src/pages/admin/Routines.tsx` exists; `src/pages/admin/Bundles.tsx` doesn't.
- [ ] `npx tsc --noEmit` clean (the rename + import update).
- [ ] No grep matches for `import.*Bundles.*admin/Bundles` except the new `SeasonalBundles` import.
- [ ] `screen-flows.md`, `app-flow-pages-and-roles.md`, `design-guidelines.md` each have a Round 64 addendum section.

## Testing tier

- T1 (tsc): yes (rename touches imports)
- T2/T3/T4/T5: not applicable

## Branching

- Branch: `docs/round-64-batch-8.2-screen-flows-archive-round-close`
- Self-merge per CLAUDE.md §11

## Round close

After this merge, **Round 64 is ✅ COMPLETE**. The next session reads `docs/upcoming/TODO.md` for Round 65 carry-overs and a fresh `FULL-IMPLEMENTATION-PLAN.md` will be authored to define Round 65 scope.
