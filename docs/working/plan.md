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
| **DX.1** | **Workflow self-improvements (drop Stitch, /pre-pr, migration-chain check, /closeout, types-regen workflow)** | **Micro** | **🟡 in progress** | |

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

- **Branch at session end:** `main` clean, synced at `76d1e87` (PR #33 — Batch 5.5 merged). **Phase 5 ✅ complete.**
- **Last completed:** Batch 5.5 — ReportIssueSheet 4-category rewrite. Replaces the legacy 3-step wizard with a 4-category picker (Fix didn't hold · Damage · Task skipped · Feedback) + per-category micro-flows (damage required photo; feedback text-only). Adds nullable `customer_issues.category` column with CHECK on the 4 new values; legacy `reason` column preserved + derived via `CATEGORY_TO_REASON`. Medium-tier review returned no MUST-FIX; 3 SHOULD-FIX resolved in the fix pass (button `type="button"`, `fileRef.current.value` clear on Remove, DRY reset via shared helper) plus one nice-to-have compile-time-exhaustiveness swap (`Record<VisitIssueCategory, CategoryCopy>` keyed lookup replaces non-null-assertion `find`). **Supabase Preview Branch applied the migration cleanly — first real-DB validation of the new column on this session.** Tier 5 on final CI: Customer 3.9 / 3.2 / 7.6.
- **Round 64 Phase 5 round-up — what shipped:** 11 batches across 4 sessions. Structural nav + drawer (5.1, 5.2). Testing harness unlock (T.1–T.7: PR-triggered Tier 3/5, visibility layer, milestone captures, artifact-flow debug, diagnostic demotion, credit verification, finding-triage rule). Page shells (5.3). Three-mode VisitDetail rewrite + type chips (5.4). ReportIssueSheet 4-category rewrite (5.5). Tier 5 went from scaffold-only to live Sarah-persona scoring with the §5.9 triage + §5.8 convergence architecture + the sarah-backlog 3-strikes promotion rule all wired end-to-end.
- **🛑 Next session MUST-FIX — cut Batch UX.1 trust-copy sweep:** The `transition-trust-copy` finding hit 3 consecutive PRs (#28, #31, #33) — 3/3 rule triggered per `docs/testing-strategy.md` §5.9. See `docs/working/sarah-backlog.md` for scope and grep approach. Needs design/product input on voice before the sweep lands.
- **Next substantive work:** Phase 6 (seasonal bundles as ARR loop) per `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` — **fresh-session boundary per CLAUDE.md §8**. Phase 6 includes migrations (seasonal_bundle_templates, bundle_line_items) + customer Services-page bundle spotlight + admin tooling for bundle windows + per-line credit pricing. Non-trivial; deserves a clean context window.
- **Open TODOs** (persist in `docs/upcoming/TODO.md`):
  - Seed property profile for the 3 persistent test users — 3rd PR in a row flagged the skeleton/placeholder artifacts. **Priority jumped again.**
  - Real `getChipType` classifier (snap_request_id linkage, bundle membership, credits-paid detection) — backend batch. Chips hidden today.
  - Real GPS / live ETA provider-location feed → Phase 7.
  - Inline rating widget refactor → 5.4.1 follow-up.
  - Rotate Vercel Protection Bypass secret (carried from T.1).
  - Regen `src/integrations/supabase/types.ts` post-merge for the new `customer_issues.category` column (removes the `as any` carry-over from `useSubmitCustomerIssue`).
- **Context at exit:** check `/context` before deciding Phase 6 entry.
- **Blockers:** None.
- **Round progress:** Phases 1–4 ✅ · **Phase 5 ✅ complete (11/11 batches)** · Phases 6–8 ⬜.
