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

- **Branch at session end:** `main` clean, synced at `4e7f58b` (PR #37 — `regen-types.yml` activation fix merged). **Phase 5 ✅ complete · DX.1 ✅ · DX.1 follow-up #37 ✅.**
- **Last completed:** PR #37 — `fix(workflows): regen-types — use supabase/setup-cli + capture stderr`. DX.1 follow-up triggered by the first activation attempt (after `SUPABASE_ACCESS_TOKEN` landed in GH Secrets) failing with bare `Process completed with exit code 1` and no readable stderr. Two fixes: (1) replaced `npm install -g supabase@latest` with `supabase/setup-cli@v1` — most likely root cause (PATH wiring + npm prefix flakes); (2) added `2> >(tee /tmp/x.err >&2)` stderr capture + `[ -s output.file ]` empty-file assertion + `::error::` annotation so any future failure surfaces directly in the runner UI. 3 new lessons-learned entries (CI workflow patterns ×2 + "between-phase tooling sweep" batch shape). Workflow-only diff, Micro tier review inherited from DX.1, Vercel Preview ✅ + Supabase Preview skipped (appropriate, no `supabase/` files), self-merged per CLAUDE.md §11.
- **🛑 Action required from human (post-#37):** Re-trigger the regen workflow to verify the fix — `Actions → Regen Supabase types after migration → Run workflow` against `main` at https://github.com/BlueKube/handled-home/actions/workflows/regen-types.yml. Expected: ✅ success, no PR opened (types already current); OR ✅ success with auto-opened `chore/regen-supabase-types` PR if drift exists. If still ❌, the new stderr capture will show the actual CLI error in the runner log + a `::error::` annotation on the job summary.
- **🛑 Next session MUST-FIX — cut Batch UX.1 trust-copy sweep:** The `transition-trust-copy` finding hit 3 consecutive PRs (#28, #31, #33) — 3/3 rule triggered per `docs/testing-strategy.md` §5.9. See `docs/working/sarah-backlog.md` for scope and grep approach. Needs design/product input on voice before the sweep lands. If the human isn't available, log a TODO and proceed — don't block.
- **Next substantive work:** Phase 6 (seasonal bundles as ARR loop) per `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` — **fresh-session boundary per CLAUDE.md §8**. Phase 6 includes migrations (seasonal_bundle_templates, bundle_line_items) + customer Services-page bundle spotlight + admin tooling for bundle windows + per-line credit pricing. Non-trivial; deserves a clean context window. **The new tooling will be load-bearing on Phase 6**: types-regen activates automatically post-merge (verified once human re-runs the workflow per above), `/pre-pr` runs before every PR, `check-migration-chain.sh` validates each new migration's bootstrap-chain.
- **Open TODOs** (persist in `docs/upcoming/TODO.md`):
  - **🟡 Pending verification:** `SUPABASE_ACCESS_TOKEN` is set in GH Secrets; `regen-types.yml` activation requires one human-triggered re-run to confirm PR #37's fix works.
  - **NEW:** Stale `supabase/config.toml:1` `project_id = "yxhdschpeezawraqsmug"` — pre-Round-64.5 leftover; should be `gwbwnetatpgnqgarkvht` per `DEPLOYMENT.md`. Small cleanup, not blocking.
  - Revoke the Stitch bearer token left in git history (DX.1) — user-side action.
  - Seed property profile for the 3 persistent test users — 3rd PR in a row flagged the skeleton/placeholder artifacts. **High priority.**
  - Real `getChipType` classifier (snap_request_id linkage, bundle membership, credits-paid detection) — backend batch.
  - Real GPS / live ETA provider-location feed → Phase 7.
  - Inline rating widget refactor → 5.4.1 follow-up.
  - Rotate Vercel Protection Bypass secret (carried from T.1).
- **Context at exit:** check `/context` before deciding Phase 6 entry.
- **Blockers:** None — Phase 6 entry is gated only on starting a fresh session.
- **Round progress:** Phases 1–4 ✅ · **Phase 5 ✅ complete (11/11 batches)** · DX.1 ✅ · DX.1 follow-up #37 ✅ · Phases 6–8 ⬜.
