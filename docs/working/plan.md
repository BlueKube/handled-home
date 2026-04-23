# Round 64 Phase 5 — Nav shape + Visit Detail as page-of-the-day

> **Round:** 64 · **Phase:** 5 of 8 · **Started:** 2026-04-22
> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` §"Phase 5 — Nav shape + Visit Detail as page-of-the-day"
> **Execution mode:** Quality (production-facing structural change across the customer app)

---

## Why this phase next

Phase 5 is the largest structurally-valuable work remaining in Round 64 and is a *prerequisite* for Phases 6 and 7:

- **Phase 6** (seasonal bundles) fills in the Services-page spotlight created here.
- **Phase 7** (BYOC/BYOP/referrals) extends the new three-mode VisitDetail with post-visit CTAs.

Doing Phase 5 first avoids re-doing cross-cutting nav + VisitDetail work later.

## Batch table

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| 5.1 | BottomTabBar 4-tab restructure + center Snap FAB + legacy route redirects | M | ✅ | TBD |
| 5.2 | AvatarDrawer + AppHeader integration (plan/billing/credits/account/referrals/help in drawer) | M | ✅ | TBD |
| **T.1** | **Tooling sidebar — PR-triggered Tier 3/5 workflow + AvatarDrawer Tier 4 spec + secrets inventory** | **M** | **✅** | TBD |
| **T.2** | **Retrospective doc sync — lessons from T.1 into CLAUDE.md / testing-strategy / lessons-learned** | **S** | **✅** | TBD |
| 5.3 | `/customer/services` + `/customer/visits` page shells (consume existing data) | M | ✅ | TBD |
| **T.3** | **Tier 5 visibility — inline scores + advisory threshold + dismiss-list stub (Layer 1 + 2 stub of convergence architecture)** | **S** | **✅** | TBD |
| **T.4** | **Tier 5 milestone captures on avatar-drawer.spec.ts** | **Micro** | **✅** | TBD |
| **T.5** | **Autonomous coding system paper — end-to-end workflow documentation for publication** | **S** | **✅** | TBD |
| **T.6** | **Tier 5 artifact-flow debug → stale model ID + silent try/catch fix (model bump to `claude-haiku-4-5-20251001` + error.json surfacing)** | **Micro→Small `[OVERRIDE]`** | **✅** | TBD |
| 5.4 | VisitDetail three-mode rewrite (preview / live / complete) + type chips | L | ⬜ | |
| 5.5 | ReportIssueSheet 4-category rewrite | M | ⬜ | |

### Review sizing per batch

| Batch | Tier | Agents | Rationale |
|-------|------|--------|-----------|
| 5.1 | Medium | 3 lanes + Lane 4 synthesis (sub-agent) | New nav + redirects — cross-cutting but well-scoped. Skip Lane 3 — first batch in phase. |
| 5.2 | Medium | 3 lanes + Lane 4 synthesis (sub-agent) | New drawer component + AppHeader rewrite + many consumer-link rewrites. |
| 5.3 | Medium | 3 lanes + Lane 4 synthesis (sub-agent) | Two new page shells; existing-data reuse reduces risk. |
| 5.4 | Large | 3 lanes + Sonnet synthesis + Haiku second-opinion | VisitDetail is a high-traffic page; three-mode split is the most subtle batch of the phase. |
| 5.5 | Medium | 3 lanes + Lane 4 synthesis (sub-agent) | Replaces a user-visible flow; "credits back" promise needs trust-signal review. |

### Testing tier per batch

Per `docs/testing-strategy.md` Appendix A + §3.

| Batch | T1 | T2 | T3 | T4 | T5 |
|-------|----|----|----|----|----|
| 5.1 | ✅ | — | ✅ (smoke: tab navigation works, FAB opens SnapSheet) | — | Optional after Vercel Preview green |
| 5.2 | ✅ | ✅ (drawer state hook) | ✅ (smoke: drawer opens from every page) | — | Optional |
| 5.3 | ✅ | ✅ (list/grouping logic) | ✅ (smoke: Services + Visits render seeded fixtures) | — | Optional |
| 5.4 | ✅ | ✅ (mode-detection helper) | ✅ | ✅ (`e2e/visit-detail-three-mode.spec.ts`) | ✅ recommended — Sarah judge per mode |
| 5.5 | ✅ | ✅ (category routing) | ✅ | ✅ (`e2e/report-issue.spec.ts`) | ✅ recommended — trust signals on "credits back" |

Each batch cites tiers in the PR's Test plan section.

## Blast radius / escalation triggers

Batches 5.1–5.3 + 5.5 are within self-merge authority. Escalate only if:

- A redirect loop appears in prod browser testing.
- VisitDetail (5.4) live-mode exposes a provider's real-time location to the wrong customer (auth boundary).
- Any of the migrations these batches touch land in `supabase/migrations/` — none planned, but if one appears, escalate for review.

## Phase-level verification (run at the end of 5.5)

Per PRD "Deliverables" block:

- All 4 bottom tabs render; FAB opens SnapSheet.
- Avatar drawer reachable from every customer page; Plan/Billing/Credits in drawer list.
- `grep -r '/customer/more\|/customer/routine\|/customer/activity' src/` returns only App.tsx redirect entries.
- VisitDetail renders correctly for seeded preview/live/complete fixtures.
- Issue flow shows 4 categories; "Fix didn't hold" creates a support ticket with `category` populated.
- `npx tsc --noEmit` + `npm run build` + `npm run lint` clean.

## Branch strategy

Each batch ships as its own PR against `main`, following `BlueKube/handled-home` Round 64 Phase 4 convention:

- Branch name: `feat/round-64-phase-5-batch-<N>-<slug>` (e.g. `feat/round-64-phase-5-batch-5.1-bottom-nav`).
- Every PR runs the review protocol per CLAUDE.md §5, with Lane 4 as a sub-agent (never inline).
- Self-merge after pre-merge checklist clears (CLAUDE.md §11).
- Migration bootstrap-chain rule applies if any SQL lands (none planned this phase).

---

## Session Handoff

- **Branch at session end:** `feat/round-64-phase-5-t6-tier5-artifact-flow-debug` — T.6 review-resolved, pending self-merge.
- **Last completed:** T.6 root-caused the Tier 5 scaffold-mode regression from PR #23: not an artifact-flow issue at all — every model call was silently 404ing against the stale default `claude-sonnet-4-20250514`. Fixed by bumping all 3 AI-eval scripts to `claude-haiku-4-5-20251001` (matches `supabase/functions/_shared/anthropic.ts`) and hardening the try/catch error path to write a visible `ux-review-report-${role}-error.json` + surface a 🛑 advisory line in the PR comment. The latest CI on commit `0eba41f` (run 24859813878) proved both halves work: the fix made the call reach Anthropic, and the new error path caught the subsequent credit-exhaustion 400 and rendered it in the PR comment. That credit-balance issue is now the only blocker to real Sarah scores and is a human action item logged in `docs/upcoming/TODO.md`.
- **Next up:** (1) Self-merge T.6 — the infrastructure is ready to light up the moment credits are refilled. (2) Human: top up Anthropic credits (or rotate `ANTHROPIC_API_KEY` to a funded account). (3) After credits arrive, any subsequent PR's Tier 5 matrix should produce real Sarah-persona scores with zero additional code. (4) Then fresh session for Batch 5.4 (VisitDetail three-mode — Large tier, 5-agent review) or Phase 6 (seasonal bundles).
- **Open TODOs** (persist in `docs/upcoming/TODO.md`):
  - 🛑 **Anthropic credit balance exhausted** — only blocker to live Tier 5 signal.
  - T.6-follow-up: demote diagnostic from `if: always()` to `if: failure() || ACTIONS_STEP_DEBUG == 'true'` once the first clean green Tier 5 run posts real scores. Keep a 1-line "milestones present: N/7" summary in the always-on path.
  - Seed property profile for the 3 persistent test users (carried over from Phase 5).
  - Rotate Vercel Protection Bypass secret (carried over from T.1).
- **Context at exit:** TBD — check `/context` after each batch.
- **Blockers:** T.6 "real scores visible" acceptance criterion is blocked by external Anthropic credit exhaustion — not a code issue. Override documented in the batch spec.
- **Round progress:** Phases 1–4 ✅ · Phase 5: Batches 5.1 ✅ · 5.2 ✅ · T.1 ✅ · T.2 ✅ · 5.3 ✅ · T.3 ✅ · T.4 ✅ · T.5 ✅ · T.6 ✅ (pending self-merge) · 5.4–5.5 ⬜ · Phases 6–8 ⬜.
