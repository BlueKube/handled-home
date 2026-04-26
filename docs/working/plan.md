# Round 64 Phase 6 — Seasonal bundles as the ARR loop

> **Round:** 64 · **Phase:** 6 of 8 · **Started:** 2026-04-26
> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` §"Phase 6 — Seasonal bundles as the ARR loop"
> **Execution mode:** Quality (production-facing schema + customer + admin surfaces)
> **Branch root:** Each batch ships as its own PR against `main`.

---

## Why this phase

Phase 6 is the primary ARR expansion mechanism for the round. A Basic-30 customer paying ~$189/mo becomes a ~$2,800/yr customer once they adopt 2 seasonal bundles. The mechanic: bundles attach to an existing visit day (no new appointment friction), with itemized credit savings per line ("save 120 credits"). One in-season bundle spotlight on the Services page; admin curates window dates + per-zone rollout + per-line credits.

Existing infra to coexist with (NOT replace):
- `seasonal_templates` (SKU-anchored, per-SKU default windows) + `useSeasonalOrders` / `useSeasonalSelections` / `useSeasonalTemplates` hooks. Different concept (per-SKU recurring) — Phase 6's `bundles` is multi-SKU bundles with their own metadata.
- `src/pages/admin/Bundles.tsx` is misnamed (it shows **routines**, not service bundles). Batch 6.3 introduces a new `SeasonalBundles.tsx` admin page at `/admin/seasonal-bundles` to avoid the collision. **Phase 8 doc-sync** can rename the legacy `Bundles.tsx` → `Routines.tsx` cleanly.

## Batch table

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| 6.1 | Migration: `bundles` + `bundle_items` tables + RLS + Fall Prep strawman seed | M | ✅ | |
| 6.2 | Customer: Bundle detail page + booking flow + Services-page spotlight integration | M | ✅ | |
| 6.3 | Admin: `SeasonalBundles.tsx` CRUD + zone rollout + window date editor | M | ⬜ | |

### Review sizing per batch

| Batch | Tier | Agents | Rationale |
|-------|------|--------|-----------|
| 6.1 | Medium | 3 lanes + Lane 4 synthesis (sub-agent) | Schema + seed + RLS — new tables; first batch in phase, skip Lane 3 |
| 6.2 | Medium | 3 lanes + Lane 4 synthesis (sub-agent) | New customer page + booking RPC integration; revisit Lane 3 |
| 6.3 | Medium | 3 lanes + Lane 4 synthesis (sub-agent) | Admin CRUD with destructive write paths |

### Testing tier per batch

| Batch | T1 | T2 | T3 | T4 | T5 |
|-------|----|----|----|----|----|
| 6.1 | ✅ | — | ✅ (smoke SQL: bundles + bundle_items shape, RLS read as customer) | — | — |
| 6.2 | ✅ | ✅ (bundle savings math helper) | ✅ | ✅ recommended (`e2e/bundle-detail.spec.ts`) | ✅ optional (Sarah on bundle detail) |
| 6.3 | ✅ | ✅ (form validation) | ✅ | — | — |

## Fresh-session boundaries

Phase 6 is large. Each batch deserves its own session per CLAUDE.md §8:
- **This session:** Batch 6.1 only (schema + seed). Closeout. Stop.
- **Next session:** Batch 6.2 (customer-facing). Closeout. Stop.
- **Following session:** Batch 6.3 (admin). Closeout. Phase 6 ✅ → Phase 7 entry decision.

## Blast radius / escalation triggers

- Any change to `seasonal_templates` or `seasonal_orders` tables (those are working today; Phase 6 must NOT touch them)
- Any production data write before the schema is validated by the Supabase Preview check
- RLS policy that exposes admin-only writes to non-admin roles

## Post-merge regen-types reminder

Each Phase 6 batch that lands a migration will trigger `regen-types.yml` to auto-open a `chore/regen-supabase-types` PR (verified working in PR #39). Self-merge those PRs after `tsc --noEmit` clean.

---

# Round 64 Phase 5 — Nav shape + Visit Detail as page-of-the-day (archived to Round 64.5 archive at phase end)

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

- **Branch at session end:** `main` clean, synced at `1c799f5` (PR #44 — Batch 6.2 customer bundle detail + booking + Services spotlight merged). **Phases 1–5 ✅ · DX.1 ✅ · UX.1 ✅ · Phase 6 in progress (2/3 batches done).**
- **Last completed:** **Batch 6.2 — Customer Bundle detail + booking + Services-page spotlight** (PR #44, `1c799f5`). 8 new files (3 hooks, 2 components, 1 page, 1 helper + test) + 2 modifications (Services.tsx replaces local stub, App.tsx route). `useBookBundle` mutation: client-side balance pre-check → ref-based double-tap debounce → empty-items guard → `spend_handles` RPC → `job_tasks` inserts (task_type='bundle') → on partial-success writes `billing_exceptions` HIGH with entity_type='bundle'. onSuccess seeds handle_balance cache via `setQueryData` BEFORE invalidating (avoids stale-balance flash — same pattern useFinalizeSnap adopted after Phase 4 Batch 4.2 review; **Lane 3 caught this as a repeat-mistake from prior history**). Medium-tier review with all 4 lanes (Lane 3 included this time): 1 MUST-FIX + 5 SHOULD-FIX + 2 DROP, all 6 fixes shipped in fix-pass commit `7caa915`. Sarah re-run scored avgClarity 4.8 / avgTrust 3.9 / avgFriction 7.1 — improvements are within run-to-run AI variance since the captured screens are still avatar-drawer not bundle surfaces (UX.1 follow-up gap).
- **🟡 Auto-PR pending:** `regen-types.yml` should auto-open a `chore/regen-supabase-types` PR shortly after the Batch 6.1 schema landed (still pending — investigate next session). Once it lands, self-merge to clean up `as any` casts on `bundles` / `bundle_items` queries in 6.2's hooks.
- **Next substantive work:** **Batch 6.3 — Admin `SeasonalBundles.tsx` CRUD + zone rollout + window editor** per `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` §Phase 6 + spec at `docs/working/batch-specs/batch-6.3-admin-seasonal-bundles-crud.md` (drafted in this session, ready for implementation). Medium tier review. Final batch of Phase 6 — closes out the 3-batch sequence so the human admin can curate bundles without writing migrations.
- **Open TODOs** (persist in `docs/upcoming/TODO.md`):
  - **🟡 Pending:** Self-merge the regen-types auto-PR (still hasn't appeared after PR #42's merge — may need a manual workflow re-trigger).
  - **NEW (UX.1 follow-up):** Add Tier 5 milestone captures for onboarding/auth/snap/bundles surfaces — Sarah keeps measuring the same drawer screens. The bundle work in 6.2 is invisible to the harness.
  - **NEW (UX.1 follow-up):** Provider-name interpolation on customer trust copy (Round 65).
  - Stripe credit-pack products + secrets + deploys + cron verify (Phase 3 close-out).
  - Stale `supabase/config.toml:1` `project_id` — should be `gwbwnetatpgnqgarkvht`.
  - Revoke the Stitch bearer token left in git history (DX.1).
  - Seed property profile for the 3 persistent test users.
  - Real `getChipType` classifier — backend batch.
  - Real GPS / live ETA provider-location feed → Phase 7.
  - Inline rating widget refactor → 5.4.1 follow-up.
  - Rotate Vercel Protection Bypass secret (carried from T.1).
  - Rename legacy `src/pages/admin/Bundles.tsx` → `Routines.tsx` during Phase 8 doc-sync.
- **Context at exit:** check `/context` before deciding Batch 6.3 entry.
- **Blockers:** None.
- **Round progress:** Phases 1–5 ✅ · DX.1 ✅ · UX.1 ✅ · **Phase 6 🟡 (Batch 6.1 ✅, 6.2 ✅, 6.3 ⬜)** · Phases 7–8 ⬜.
