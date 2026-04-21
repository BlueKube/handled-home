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
| 2.1 | `PlanFamilyCard` + `PlanVariantCard` split | M | ✅ | | Reusable components + `planTierStyles.ts`. Medium review (2 lanes + synthesis; Lane 3 skipped — first batch in phase). 4 SHOULD-FIX applied in `c36eb0e`. |
| 2.2 | `PlanStep` variant resolution + rationale + override | M | ✅ | | Family cards → `pick_plan_variant` → resolved variant card + one-line rationale + adjacent-tier override with reason dropdown. Admin flag stashed in `customer_onboarding_progress.metadata.plan_variant_selection`. Decomposed into `PlanStep.tsx` (256 lines) + `PlanStepResolved.tsx` (153 lines). Medium review: 1 MUST-FIX (cache shape drift) + 6 SHOULD-FIX applied; re-review clean. |
| 2.3 | Browse + Plans + Subscribe/Checkout integration | L | ⬜ | | `Browse.tsx` family-level cards; `Plans.tsx` resolved variant; `create-checkout-session` writes resolved `plan_id`. Largest batch — Large review (5 agents). |

---

## Session Handoff

- **Branch:** `claude/handled-home-phase-2-YTvlm` (per this session's task-rule override of the handoff's suggested `feat/round-64-phase-2-...` name). Branched implicitly via `git reset --hard origin/main` to pick up commit `5b8b334` (settings.local.json pattern). Two commits pushed this session: `f6e44b8` (Batch 2.1 impl) + `c36eb0e` (Batch 2.1 review fixes).
- **Last completed:** Batch 2.2 — PlanStep variant resolution + rationale + override. Adds `usePlanVariants`, `useResolvePlanVariant`, `planRationale.ts`, refactored `PlanStep.tsx` (+ `PlanStepResolved.tsx` sub-component to stay under the 300-line threshold), updated `OnboardingWizard.tsx` handler to pass the new `PlanSelectionPayload`, and changed `useOnboardingProgress` metadata semantics from replace → merge. Medium review caught a cache-shape-drift MUST-FIX (`plan_handles_all` Map collided with Plans.tsx/PlanActivateStep.tsx shapes) plus 6 SHOULD-FIX. All fixed; re-review clean. 3 commits on branch: `0882012` (impl), `5bad760` (review fixes), `15bb1c2` (dead-prop cleanup).
- **Next up:** Batch 2.3 — Browse + Plans + Subscribe/Checkout integration. Large batch (5-agent review per CLAUDE.md §5). Replaces `Browse.tsx` hardcoded `PLANS` array with live family query → `PlanFamilyCard`s. Migrates `customer/Plans.tsx` from `PlanCard` to family/variant cards (resolved variant prominent; "See other sizes" for the family's other variants). Wires the resolved variant from onboarding metadata into `Subscribe.tsx` + `create-checkout-session` so `subscriptions.plan_id` receives the correct variant id, not the family root. Migrates `byoc-onboarding/PlanActivateStep.tsx` off `PlanCard` as well. Finally deletes the legacy `PlanCard.tsx` and consolidates `shared.ts` once no callers remain.
- **Context at exit:** (unreported — see /context). Session did orientation + full Batch 2.1 cycle (spec + impl + review + fix + re-review).
- **Blockers:** None for Batch 2.2. Pre-existing non-blocking items: `/root/.r64_5_secrets.env` missing from this sandbox (re-source if available in next session for infra ops); `supabase`/`vercel` CLIs not installed locally (Phase 2 is frontend-only — not needed).
- **Round progress:** Phase 1 done. Phase 2: 1 of 3 batches complete (2.1 ✅). Phases 3–8 not started.

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
