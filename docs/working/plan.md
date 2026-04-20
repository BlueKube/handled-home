# Round 64 — Working Plan

> **Branch:** `claude/pricing-tiered-model-6WCj9`
> **Scope doc:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md`
> **Current phase:** Phase 1 — Schema: size_tier on plans + variant selection RPC

---

## Phase 1 Progress

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| 1.1 | Migration + seed + `pick_plan_variant` RPC + RLS | M | ✅ | ~55% |
| 1.1 | ↳ fix pass (Lane 2 SHOULD-FIX) | S | ✅ | ~58% |
| 1.2 | TS types + `usePlanVariantRules` hook + `usePlans` extensions | S | ✅ | ~52% |
| 1.3 | Admin Plans UI + variant rule editor | M | ✅ | ~60% |
| 1.3 | ↳ fix pass (tailwind token + defensives + TODO.md) | S | ✅ | ~60% |

**Phase 1 complete.** All 12 variant plans + 12 seed rules in place, `pick_plan_variant` RPC deployed (pending Lovable apply), admin UI wired for family grouping + rule CRUD.

## Future phases (abbreviated — decomposed at each phase boundary)

| Phase | Title | Batches | Total est. |
|-------|-------|---------|------------|
| 1 | Schema: size_tier + plan_family + variant RPC | 1.1, 1.2, 1.3 | 3 |
| 2 | Onboarding: home signals → variant → "Starts at" pricing | 2.1, 2.2, 2.3 | 3 |
| 3 | Credits UX: ring, nudge, top-up, autopay, copy sweep | 3.1–3.5 | 5 |
| 4 | Snap-a-Fix: capture + AI triage + per-snap routing | 4.1–4.4 | 4 |
| 5 | Nav shape + VisitDetail three-mode + issue flow | 5.1–5.5 | 5 |
| 6 | Seasonal bundles + Services spotlight + admin | 6.1, 6.2, 6.3 | 3 |
| 7 | Referral / BYOC / BYOP elevation | 7.1, 7.2, 7.3 | 3 |
| 8 | Docs sync + round cleanup | 8.1, 8.2 | 2 |

**Round total:** ~28 batches across 8 phases.

---

## Session Handoff

- **Branch:** `claude/pricing-tiered-model-6WCj9`
- **Last completed:** Phase 1 end-to-end + inter-phase cleanup. Commits: `38662b9` 1.1 schema · `d833cc4` 1.1 hardening · `6592623` 1.2 hooks · `3f5fe9b` 1.3 admin UI · `962377a` 1.3 tailwind fix + TODO.md · `eb88e55` plan handoff · (next commit) cleanup + doc sync.
- **Phase 1 archived to:** `docs/archive/round-64-phase-1-pricing-tiered-model-2026-04-20/` (3 batch specs).
- **Blocker for Phase 2:** Lovable needs to apply migrations `20260420173758_plan_variants_schema.sql` + `20260420174801_plan_variants_review_fixes.sql` and regenerate `src/integrations/supabase/types.ts`. Tracked in `docs/upcoming/TODO.md` under "Round 64: Tier Variants".
- **Next up:** Phase 2 — onboarding variant resolution + "Starts at" pricing. Starts with Batch 2.1 (`PlanFamilyCard` + `PlanVariantCard` component split). See `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` Phase 2 for scope.
- **Context at exit (actual):** 53% per `/context` before cleanup; roughly 55% after. Session boundary appropriate for a merge-to-main checkpoint.
- **Merge plan:** User will merge `claude/pricing-tiered-model-6WCj9` to `main` and start a fresh session for Phase 2.
- **Round progress:** Phase 1 / 8 complete. 3 / ~28 batches.

---

## Overrides

- [OVERRIDE: Batch 1.1 re-review — skipped Lane 4 synthesis for the original review. Only Lane 2 returned findings; Lane 1 was clean. Single-input synthesis adds no value per CLAUDE.md §5 Micro-tier rationale. Synthesized inline in commit `d833cc4`.]
- [OVERRIDE: Batch 1.1 re-review — skipped lightweight re-review of the fix commit. No MUST-FIX items existed (Lane 2's MUST-FIX reclassified as intentional). SHOULD-FIX applications were mechanical and verified by build. Re-review would find nothing new.]
