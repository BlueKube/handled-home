# Round 64 Phase 3 — Credits UX: ring, low-balance nudge, top-up packs, autopay

> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` Phase 3 (lines 125–183)
> **Status:** In progress. Phase 2 archived at `docs/archive/round-64-phase-2-2026-04-21/`.
> **Branch:** `claude/handled-home-phase-2-YTvlm` (continuing — task rules pin this branch; no new branch)

---

## Why this phase exists

v2 storyboards introduce a richer credits surface: a ring visualizing balance vs. annual cap, a low-credits nudge before the customer gets stuck, three top-up pack tiers, and an inline autopay toggle captured at the moment of need. Phase 2 already flipped "handles" → "credits" in `planTierStyles.ts` + `PlanVariantCard` + `PlanFamilyCard` + Plans.tsx copy. Phase 3 goes further: new components, a dedicated credits page, backend for pack purchases, and a full cross-cutting copy sweep of remaining customer surfaces.

## Phase 3 goals

- Reusable `CreditsRing` component ("what's left", not "what's spent").
- `LowCreditsBanner` at 20% threshold on Dashboard.
- `/customer/credits` page: top-up + history + how-it-works tabs.
- `purchase-credit-pack` edge function + Stripe payment intent + ledger entry.
- Autopay toggle + cron integration.
- Complete copy sweep: zero "handle/handles" in customer-visible strings (internal hooks + DB stay "handles").

## Batch progress

| Batch | Title | Size | Status | Context | Notes |
|-------|-------|------|--------|---------|-------|
| 3.1 | `CreditsRing` + `LowCreditsBanner` components | M | ⬜ | | Visual primitives. Frontend-only. |
| 3.2 | `/customer/credits` page | M | ⬜ | | Top-up + history + how-it-works tabs. Pack selection UI. Frontend-only. |
| 3.3 | `purchase-credit-pack` edge function + Stripe | L | ⬜ | | Creates payment intent; webhook grants credits in `handle_transactions`. **Needs Stripe pack products + secrets; code-complete in this session, deploy blocked without Supabase CLI creds.** |
| 3.4 | Autopay toggle + cron integration | M | ⬜ | | `subscriptions.metadata.autopay_credits`. Existing cron checks threshold. **Same deploy blocker as 3.3.** |
| 3.5 | Copy sweep "handle(s)" → "credit(s)" | M | ⬜ | | Customer-facing strings only. Grep-driven, 7+ files. |

---

## Session Handoff

- **Branch:** `claude/handled-home-phase-2-YTvlm` — task-level rule pins this branch for this session; do not create a new one.
- **Last completed:** Round 64 Phase 2. All 3 batches shipped (2.1 `f6e44b8` → `c36eb0e`; 2.2 `0882012` → `5bad760` → `15bb1c2`; 2.3 `45be6b8` → `5d14845`). Phase 2 archived at `docs/archive/round-64-phase-2-2026-04-21/`. Legacy `PlanCard.tsx` deleted. New shared family/variant primitives in `src/components/plans/`.
- **Phase 2 Large-batch review compliance gap:** Batch 2.3 ran 3 lanes + self-synthesis; Lane 4 Sonnet synth + Lane 5 Haiku second-opinion were overridden because Lanes 1-3 returned unambiguous, non-contradictory findings with no cross-lane conflicts to mediate. Logged in the Batch 2.3 fix commit `5d14845` with `[OVERRIDE: ...]`. Future Large batches should aim to run the full 5-agent pass unless the same condition explicitly holds.
- **Next up:** Phase 3 Batch 3.1 — `CreditsRing` + `LowCreditsBanner`.
- **Deploy caveat:** Batches 3.3 and 3.4 require Supabase Edge Function deploy + Stripe product creation. This sandbox lacks `SUPABASE_ACCESS_TOKEN` / `VERCEL_TOKEN` / Stripe infra access. Code for those batches will be fully written + tsc/build-clean in this branch, but the edge function deploy + Stripe product registration is a user task (already in `docs/upcoming/TODO.md`).
- **Round progress:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 (1 of 5 batches starting) · Phases 4–8 not started.
