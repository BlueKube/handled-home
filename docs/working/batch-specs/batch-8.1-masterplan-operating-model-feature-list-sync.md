# Batch 8.1 — masterplan + operating-model + feature-list sync

> **Round:** 64 · **Phase:** 8 of 8 · **Batch:** 8.1 of 2
> **Branch:** `docs/round-64-batch-8.1-masterplan-operating-model-sync`
> **Size:** Small · **Tier:** Quality

## Review: Quality

Per CLAUDE.md §5 "Fact-checker lane (for business-critical documents)" rule: Lane 2 (Bug Scan) is replaced with **Fact Checker**. So 2 lanes total: Lane 1 (Spec Completeness) + Lane 2 (Fact Check) + synthesis. Lane 3 skipped (docs-only, no code history relevance).

## Why

Round 64 shipped 7 phases of structural change without updating the north-star "why" docs. Anyone reading masterplan / operating-model / feature-list today sees pre-Round-64 state — Essential/Plus/Premium tiers, "$X handles," no Snap-a-Fix, no bundles, no growth-rotation surfaces. Phase 8 batches 8.1 + 8.2 close that gap before round close.

## Scope

### In

1. **`docs/feature-list.md`** — append new entries for Round 64 features and flip statuses for things that shipped:
   - Plan variants (`plan_family` + `size_tier` — basic/full/premier × 10/20/30/40 = 12 variants) — DONE
   - Credits top-up UX (Starter/Homeowner/Year-round packs) — IN PROGRESS (Stripe products pending — see TODO)
   - Snap-a-Fix — DONE
   - Seasonal bundles (`bundles` + `bundle_items` + atomic `replace_bundle_items` RPC; customer BundleDetail; admin SeasonalBundles) — DONE
   - 4-tab customer nav + AvatarDrawer — DONE
   - VisitDetail three-mode (preview / live / complete) — DONE
   - 4-category ReportIssueSheet — DONE
   - Trust-copy patterns (UX.1 sweep — Pattern A why-we-ask micro-copy + Pattern B transition reassurance + Pattern C origin framing) — DONE
   - Growth rotation surfaces (Phase 7: post-visit, dashboard, onboarding) — DONE

2. **`docs/operating-model.md`** — replace the Plan Tier Structure section's flat Essential/Plus/Premium with the basic/full/premier × size-tier variant model. Add a Credit Top-Up Revenue line item under Revenue Streams. Reference seasonal bundles in the Bundle Design section. Add Snap routing cost assumption to Operational Exception Handling.

3. **`docs/masterplan.md`** — narrative-level updates only:
   - Customer Value Proposition section: mention credits-currency framing (replaces "handles") and Snap-a-Fix as the wedge for unplanned issues.
   - "Technology as the Enabler" section: add the 4-tab nav + Snap FAB + AvatarDrawer reorganization as a substantive UX change.
   - Add a brief Round 64 retrospective sub-section under "Go-to-Market Strategy" or as a top-level "Round 64 Build" sub-section noting the structural changes shipped.
   - **Do NOT** rewrite Executive Summary, Mission, or strategic sections — those are narrative-stable.

4. **`docs/upcoming/TODO.md`** — append any human-action items surfaced by the closeout that aren't already there (none expected; existing entries cover everything).

### Out (deferred to 8.2)

- `docs/screen-flows.md` — Phase 8.2 work
- `docs/app-flow-pages-and-roles.md` — Phase 8.2 work
- `docs/design-guidelines.md` — Phase 8.2 work
- `docs/working/plan.md` archive — Phase 8.2 work
- `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` deletion (post-archive) — Phase 8.2 work
- Renaming legacy `src/pages/admin/Bundles.tsx` → `Routines.tsx` — Phase 8.2 work
- Major rewrites of strategic narrative — out of scope; reserved for an explicit narrative-revision batch in a future round if needed

## Files touched

```
docs/feature-list.md           MODIFIED (append + status flips, ~80 lines diff)
docs/operating-model.md        MODIFIED (Plan Tier Structure rewrite + ~3 small adds)
docs/masterplan.md             MODIFIED (3 narrative updates, no rewrites)
docs/upcoming/TODO.md          MAYBE-MODIFIED (only if new items surface)
```

4 files. Docs-only.

## Acceptance criteria

- [ ] `feature-list.md` contains entries for all 9 Round 64 feature groups listed In-scope above with correct status markers.
- [ ] `operating-model.md` Plan Tier Structure references basic/full/premier × 10/20/30/40, not Essential/Plus/Premium-flat.
- [ ] `operating-model.md` Revenue Streams enumerates credit top-up packs as a revenue line.
- [ ] `masterplan.md` Customer Value Proposition mentions credits and Snap-a-Fix.
- [ ] `masterplan.md` Technology as the Enabler mentions the 4-tab nav restructure.
- [ ] No dollar-amount claims that contradict simulator output (fact-check focus).
- [ ] No claims about features that aren't actually shipped on `main`.

## Testing tier

Docs-only. No T1/T2 needed. Fact-check via Lane 2.

## Branching

- Branch: `docs/round-64-batch-8.1-masterplan-operating-model-sync` (off `main` after PR #53 merge).
- Self-merge per CLAUDE.md §11 — docs-only, fully within self-merge authority.
