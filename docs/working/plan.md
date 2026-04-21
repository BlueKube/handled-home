# Round 64 Phase 2 — Onboarding: home signals → variant → "Starts at" pricing

> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` Phase 2 (lines 80–122)
> **Status:** Ready to start. Round 64.5 (Supabase self-host migration unblocker) completed 2026-04-21 — archived at `docs/archive/round-64.5-supabase-self-host-migration-2026-04-21/`.
> **Branch:** Recommended `feat/round-64-phase-2-onboarding-variant-pricing` (new branch off main; do not continue on `claude/supabase-self-host-migration`).

---

## Why this phase exists

Round 64 Phase 1 shipped the schema + RPC for plan variants (`plan_variants_schema`, `pick_plan_variant`, admin variant rule editor) — see commits `38662b9` through `27c31c7`. Phase 2 wires those into the customer-visible onboarding flow + public Browse + Plans page so the customer's property signals actually drive what plan they see and pay for.

## Phase 2 goals (from FULL-IMPLEMENTATION-PLAN.md)

- Onboarding resolves `pick_plan_variant` before checkout and surfaces a one-line rationale ("Based on your ~2,800 sqft home, your Basic plan is Basic 30").
- Public `/browse` and authenticated `/customer/plans` switch to family-level cards showing "Starts at $X" (smallest variant in the family).
- Checkout writes the resolved variant's `plans.id` to `subscriptions.plan_id` — not the family root.

---

## Batch progress

| Batch | Title | Size | Status | Context | Notes |
|-------|-------|------|--------|---------|-------|
| 2.1 | `PlanFamilyCard` + `PlanVariantCard` split | M | ⬜ | | Reusable components. Foundation for 2.2 + 2.3. |
| 2.2 | `PlanStep` variant resolution + rationale + override | M | ⬜ | | Calls `pick_plan_variant`; renders one-line rationale; manual override with admin-flag. |
| 2.3 | Browse + Plans + Subscribe/Checkout integration | L | ⬜ | | `Browse.tsx` family-level cards; `Plans.tsx` resolved variant; `create-checkout-session` writes resolved `plan_id`. Largest batch — Large review (5 agents). |

---

## Session Handoff

- **Branch:** Round 64.5 work was on `claude/supabase-self-host-migration`. That branch is merged and can be deleted (`git push origin --delete claude/supabase-self-host-migration`). Next session should branch off main: `git checkout main && git pull && git checkout -b feat/round-64-phase-2-onboarding-variant-pricing`.
- **Last completed:** Round 64.5 (Supabase self-host migration). Production now runs on the new self-hosted Supabase project `gwbwnetatpgnqgarkvht`. Sign-up tested live at https://handledhome.app, customer onboarding flow renders.
- **Next up:** Batch 2.1 — `PlanFamilyCard` + `PlanVariantCard` split. Spec → implement → review → push, per Section 5.
- **Context at exit:** Current session is at end of Round 64.5 cutover. Recommend fresh session for Phase 2 start (round boundary).
- **Blockers:** None known. All Round 64.5 user-side dashboard config is complete.
- **Round progress:** Phase 1 done (Batches 1.1, 1.2, 1.3). Phase 2 not started. Phases 3–8 not started.

---

## Round 64.5 completion summary (for reference)

15 of 16 phase-steps complete. C-2 explicitly skipped (test data only, reset before launch). Final tip: commit `420dd12` on main.

Major artifacts shipped to main:
- 198 schema migrations applied to new project (via Management API workaround for sandbox pooler block)
- Plus 1 new migration: `20260421050000_round_64_5_repoint_cron_jobs_to_vault.sql` (cron jobs → Vault-backed service_role_key)
- 39 edge functions deployed to new project + `_shared/anthropic.ts` helper for Anthropic API
- `predict-services` + `support-ai-classify` swapped from Lovable AI gateway → direct Anthropic (`claude-haiku-4-5-20251001`)
- `stripe-webhook` updated for Stripe 2025 API (transfer.created/reversed instead of retired transfer.paid/failed)
- 6 Edge Function secrets pushed
- Vercel project `handled-home` created with custom domain `handledhome.app`
- Supabase↔GitHub + Supabase↔Vercel integrations enabled
- `vercel.json` SPA rewrite for `BrowserRouter` deep links
- Phase F: `.env` flipped to new project values

User actions still outstanding (post-merge cleanup, non-blocking):
- Disable OLD Stripe webhook on legacy Lovable Stripe dashboard (it's firing into a dead URL — harmless but noisy)
- Investigate `check-weather` "[object Object]" error serialization (pre-existing bug, not introduced by 64.5; flagged in TODO.md)
- Wire Resend SMTP to Supabase Auth → SMTP Settings before relying on email confirmations in production
