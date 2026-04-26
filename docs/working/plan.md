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
| **T.7** | **Demote T.6 diagnostic — always-on one-liner + on-failure/debug full block. Also validates Anthropic credit refill.** | **Micro** | **✅** | |
| 5.4 | VisitDetail three-mode rewrite (preview / live / complete) + type chips | L | ✅ | |
| 5.5 | ReportIssueSheet 4-category rewrite | M | ✅ | |
| **DX.1** | **Workflow self-improvements (drop Stitch, /pre-pr, migration-chain check, /closeout, types-regen workflow)** | **Micro** | **✅** | |

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

- **Branch at session end:** `main` clean, synced at `d1fa15b` (PR #40 — Batch UX.1 trust-copy sweep merged). **Phase 5 ✅ · DX.1 ✅ · DX.1 follow-up #37 ✅ · regen-types verified via PR #39 ✅ · UX.1 ✅.**
- **Last completed:** **Batch UX.1 — trust-copy sweep (MVP scope)** (PR #40, `d1fa15b`). Closed the 3/3-promotion `transition-trust-copy` finding from sarah-backlog. Pattern A (why-we-ask micro-copy) on every data-collection field across onboarding + auth + snap + payment; Pattern B (transition reassurance) on every step destination; Pattern C (origin framing) on `OnboardingWizard` self-signup + `AuthPage` BYOC banner ("Your provider stays the same. Handled Home is the system around them."). Voice rubric: present-tense, outcome-stated, specifics over vague reassurance. 10 files, 185 net additions, JSX-only. Medium-tier review: 0 MUST-FIX, 6 SHOULD-FIX (all resolved in fix-pass commit), 4 DROP including a Lane 2 BYOC false-positive verified via grep. Lane 4 synthesis ran as sub-agent. Tier 5 Sarah re-run scored avgTrust 3.2 → 3.4 (small uptick); the 5.0 advisory threshold was NOT cleared because the existing milestone capture set (avatar-drawer.spec.ts) doesn't include the onboarding/auth/snap surfaces UX.1 modified — Sarah measured the same drawer screens as prior runs. Two follow-ups logged.
- **Next substantive work:** Phase 6 (seasonal bundles ARR loop) per `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` — **fresh-session boundary per CLAUDE.md §8**. UX.1 cleared the pre-Phase-6 MUST-FIX gate. Phase 6 includes migrations (seasonal_bundle_templates, bundle_line_items) + customer Services-page bundle spotlight + admin tooling for bundle windows + per-line credit pricing. Non-trivial; deserves a clean context window.
- **Open TODOs** (persist in `docs/upcoming/TODO.md`):
  - **NEW (UX.1 follow-up):** Add Tier 5 milestone captures for onboarding/auth/snap so a future Sarah run can actually validate the trust-copy patterns UX.1 added. Without these captures, Sarah keeps measuring the same drawer screens.
  - **NEW (UX.1 follow-up):** Provider-name interpolation on customer-facing trust copy ("Your [Provider Name] service continues") — Sarah's #3 friction in PR #40 explicitly asked for this. Round 65 work.
  - **NEW (UX.1 carry-over):** Sarah's PR #40 also flagged loading-state messaging gaps and step-progression indicator inconsistencies — separate themes from trust-copy. If they reappear on Phase 6 PRs they'll get sarah-backlog entries.
  - Stale `supabase/config.toml:1` `project_id = "yxhdschpeezawraqsmug"` — should be `gwbwnetatpgnqgarkvht`. Small cleanup, not blocking.
  - Revoke the Stitch bearer token left in git history (DX.1) — user-side action.
  - Seed property profile for the 3 persistent test users — high priority; would unblock cleaner Tier 4 destination assertions.
  - Real `getChipType` classifier (snap_request_id linkage, bundle membership, credits-paid detection) — backend batch.
  - Real GPS / live ETA provider-location feed → Phase 7.
  - Inline rating widget refactor → 5.4.1 follow-up.
  - Rotate Vercel Protection Bypass secret (carried from T.1).
- **Context at exit:** check `/context` before deciding Phase 6 entry.
- **Blockers:** None — Phase 6 is gated only on starting a fresh session.
- **Round progress:** Phases 1–4 ✅ · **Phase 5 ✅ complete (11/11 batches)** · DX.1 ✅ · DX.1 follow-up #37 ✅ · UX.1 ✅ · Phases 6–8 ⬜.
