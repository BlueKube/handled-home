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
| 1.2 | TS types + `usePlanVariantRules` hook + `usePlans` extensions | S | ⬜ | |
| 1.3 | Admin Plans UI + variant rule editor | M | ⬜ | |

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
- **Last completed:** Batch 1.1 + fix pass. Lane 1 clean (all spec items verified). Lane 2 surfaced one reclassified MUST-FIX (intentional Option A NULL semantics) + five SHOULD-FIX/NICE-TO-HAVE items; applied hardening in follow-up migration `20260420174801_plan_variants_review_fixes.sql`. Commits: `38662b9` (schema), `7dd04df` (lockfile chore), `d833cc4` (review fixes). Build + typecheck pass.
- **Next up:** Batch 1.2 — TS types + `usePlanVariantRules` hook + `usePlans` extensions. Small. Files: `src/hooks/usePlans.ts`, new `src/hooks/usePlanVariantRules.ts`, Supabase generated types regeneration.
- **Context at exit:** ~58% reported (likely ~30% actual per CLAUDE.md §8b).
- **Blockers:** None.
- **Round progress:** 1 / ~28 batches.

---

## Overrides

- [OVERRIDE: Batch 1.1 re-review — skipped Lane 4 synthesis for the original review. Only Lane 2 returned findings; Lane 1 was clean. Single-input synthesis adds no value per CLAUDE.md §5 Micro-tier rationale. Synthesized inline in commit `d833cc4`.]
- [OVERRIDE: Batch 1.1 re-review — skipped lightweight re-review of the fix commit. No MUST-FIX items existed (Lane 2's MUST-FIX reclassified as intentional). SHOULD-FIX applications were mechanical and verified by build. Re-review would find nothing new.]
