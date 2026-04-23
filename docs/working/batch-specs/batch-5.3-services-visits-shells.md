# Batch 5.3 — `/customer/services` + `/customer/visits` page shells

> **Round:** 64 · **Phase:** 5 · **Size:** Medium
> **Review:** Quality — 3 lanes + Lane 4 synthesis (sub-agent). Lane 3 scope: prior review findings on `Services.tsx`, `Activity.tsx`, `App.tsx` from earlier batches.
> **Testing tiers:** T1 mandatory · T2 unit for any new pure helper · T3 smoke on Vercel Preview (tab switching works, sections render). T4 deferred — see Out of scope.
> **Branch:** `feat/round-64-phase-5-batch-5.3-services-visits-shells`

---

## Problem

Batch 5.1 swapped the customer bottom nav to `Home / Services / [Snap] / Visits / Help`, and wired `/customer/visits` to `CustomerActivity` as a temporary stand-in. The current `/customer/services` page is a generic SKU catalog (browse/search/featured/category groups) — not the plan-contextual "Included + add-ons + seasonal spotlight" surface the Phase 5 PRD calls for. This batch replaces both page bodies with the PRD-defined shells so Phase 6 (seasonal bundles) and Phase 7 (growth cards) have the right mount points to extend.

## Goals

- `/customer/services` renders: (1) seasonal-bundle spotlight placeholder (Phase 6 fills in), (2) "Included in your plan" list with cadence/status labels, (3) "Available add-ons" grid.
- `/customer/visits` renders three tabs — **Upcoming** / **In progress** / **Past** — each listing the relevant jobs. Rows link to the existing `/customer/visits/:id` route.
- `CustomerActivity` component becomes orphaned and is deleted (its content inspired `Activity.tsx`; the three-mode `VisitDetail` in Batch 5.4 picks up the receipt-card aesthetic).
- No schema changes. No new Tier 3/5 failures.

## Scope (files)

1. **`src/pages/customer/Services.tsx`** (rewrite) — 3 sections in vertical stack:
   - **Seasonal bundle spotlight**: lightweight placeholder card that says "Seasonal bundles coming soon — check back for fall prep and other one-click service stacks." Phase 6 replaces the content.
   - **Included in your plan**: uses `useEntitlements` filtered for `status === "included"`. Each row: icon + name + cadence hint (if present in entitlement row) + "tap to learn more." Opens the existing `SkuDetailView` sheet. Empty state if the customer has no plan yet.
   - **Available add-ons**: 2-column grid filtered for `status === "extra_allowed"`. Reuses `ServiceCard` component with entitlementStatus passed through.
   - Hide `blocked` + `provider_only` statuses for customer view (they're admin/provider concerns).
   - Page heading: "Services" (simpler than current "Our Services" — matches nav label).
2. **`src/pages/customer/Visits.tsx`** (new) — Radix `Tabs` with three panels:
   - **Upcoming**: jobs with `status === 'NOT_STARTED'` + a future `scheduled_date`. Ordered by date asc.
   - **In progress**: jobs with `status === 'IN_PROGRESS'`. Ordered by `started_at` desc.
   - **Past**: jobs with `status IN ('COMPLETED', 'PARTIAL_COMPLETE')`. Ordered by `completed_at` desc.
   - Rows: same shape as the existing Activity timeline rows — sku names, date, photo count. Click → `navigate(/customer/visits/:id)`.
   - Empty states per tab ("No upcoming visits" / "Nothing happening right now" / "Your service history will build here").
   - Fetch via `useCustomerJobs("all")` once; partition client-side into the three buckets.
3. **`src/pages/customer/Activity.tsx`** — DELETE. No longer referenced once App.tsx wiring moves to `CustomerVisits`. Git history preserves the reference implementation for the 5.4 VisitDetail rewrite.
4. **`src/App.tsx`** — replace the `/customer/visits` wiring:
   - Remove `const CustomerActivity = lazy(() => import("@/pages/customer/Activity"));`
   - Add `const CustomerVisits = lazy(() => import("@/pages/customer/Visits"));`
   - Change `/customer/visits` route's element to `<CustomerVisits />`.

## Out of scope (explicit)

- **Tier 4 spec for these pages.** Both routes are wrapped in `CustomerPropertyGate`, which redirects the un-onboarded test user to `/customer/onboarding`. Per `lessons-learned.md` + `docs/upcoming/TODO.md`, Tier 4 destination assertions against gated routes are unreliable until the 3 persistent test users have property profiles seeded. `[OVERRIDE: Tier 4 deferred — property seeding follow-up needed; the existing `e2e/avatar-drawer.spec.ts` already uses the gate-tolerant assertion pattern if a spot-check is needed.]`
- **Seasonal bundle content.** Phase 6 fills in the spotlight card with real data from a new `bundles` table.
- **Routine builder re-entry point.** The `/customer/routine/review` + `/customer/routine/confirm` sub-routes remain on onboarding flows; not touched.
- **Consumer-link sweep for `/customer/routine`.** The ~10 `navigate("/customer/routine")` calls across the codebase still redirect via the 5.1 rule. This batch doesn't migrate them.

## Acceptance criteria

1. Loading `/customer/services` renders 3 stacked sections in order: spotlight placeholder, Included, Available add-ons.
2. The spotlight placeholder mentions "Seasonal bundles coming soon" or equivalent copy pointing at Phase 6.
3. "Included in your plan" only shows skus with entitlement `status === "included"`.
4. "Available add-ons" only shows skus with entitlement `status === "extra_allowed"`.
5. Skus with `status === "blocked"` or `"provider_only"` are NOT rendered in either section.
6. Tapping an included row OR an add-on card opens the `SkuDetailView` sheet.
7. Loading `/customer/visits` renders a 3-tab interface: Upcoming / In progress / Past.
8. Upcoming tab shows only jobs with `status === 'NOT_STARTED'`.
9. In progress tab shows only jobs with `status === 'IN_PROGRESS'`.
10. Past tab shows jobs with `status IN ('COMPLETED', 'PARTIAL_COMPLETE')`.
11. Tapping a row navigates to `/customer/visits/:id`.
12. Each tab has a contextual empty state when its bucket is empty.
13. `src/pages/customer/Activity.tsx` is deleted; `App.tsx` no longer imports `CustomerActivity`.
14. Visits tab highlighting in `BottomTabBar` still works (regression check of Batch 5.1's `TAB_CHILD_PATHS`).
15. `npx tsc --noEmit`, `npx eslint` on changed files, `npm run build`, and vitest all pass.

## Data shape / schema changes

None.

## Edge cases

- **No subscription / no plan:** `useEntitlements(null, null, null)` returns `{ skus: [] }`. "Included in your plan" shows empty state: "Activate a plan to see what's included." Add-ons section similarly hides.
- **Loading state:** both sections show skeletons; the tabs show a spinner while the initial `useCustomerJobs` query settles.
- **Error state:** use `QueryErrorCard` pattern from `Activity.tsx` for both pages' query failures.
- **Zero jobs anywhere:** all three Visits tabs show their empty states; customer can still navigate via bottom tabs.
- **Customer has 50+ jobs:** partitioning happens client-side; if performance becomes an issue, narrow the initial query later. No pagination this batch.

## Testing notes

- **Tier 1 (mandatory):** tsc, build, eslint on changed files, `npm test -- --run src/pages/customer` if any Vitest hits touched code.
- **Tier 2:** if a new pure helper lands (e.g. `partitionJobsByStatus`), add a Vitest; otherwise none required.
- **Tier 3 smoke** (automatic via `playwright-pr.yml`): the existing `avatar-drawer.spec.ts` test 2 already clicks the drawer's "Credits" item; no guarantee it passes here since /customer/services and /customer/visits render depend on the customer test user's property state. Deliberately leaving assertions tolerant per Batch T.1's lessons-learned entry.
- **Tier 4 — deferred.** See Out of scope.
- **Tier 5:** the `ai-judge` matrix will run automatically on the PR and score the customer-role screens with the Sarah persona. First real Tier 5 signal on a feature batch; budget acknowledged.

## Risks

- **Orphan-component deletion.** Deleting `Activity.tsx` removes a reference implementation for VisitDetail styling. Before deletion, I'll note the key patterns (stats pills, receipt card, month-grouped timeline) in the 5.4 batch spec's "Reusable patterns" section so 5.4 doesn't have to dig git history.
- **Client-side partitioning cost.** `useCustomerJobs("all")` returns every job; sorting + bucketing is O(n) and fine up to a few hundred jobs. Documented here so a future polish batch knows where to look if slow.
- **Mismatch between entitlement "cadence" and plan display.** The `useEntitlements` payload includes per-SKU rule data but no uniform cadence field. Rendering "weekly lawn / monthly sprinkler check" may require fall-back copy like "Included — ask your provider for the cadence." Acceptable for a shell batch.

## Review-lane notes

- **Lane 1 (spec completeness):** Verify each AC 1–15 is implemented.
- **Lane 2 (bug scan):** Focus on client-side partitioning logic (is ISSUE_REPORTED handled?), empty-state handling, SkuDetailView sheet wiring, tab-state persistence (URL vs state — if state-only, document that), import cleanup in App.tsx, no double-imports, dark-mode colors for new component variants.
- **Lane 3 (historical context):** `git blame` + `log` on `Services.tsx`, `Activity.tsx`, `App.tsx`. Skippable if no prior review findings on these files from Phase 5 scope — Batch 5.1 touched App.tsx, so Lane 3 should check the diff doesn't revert the 5.1 route redirects.
- **Lane 4 (synthesis):** Run as sub-agent. Cross-check that the Visits status filter is exhaustive (no statuses dropped on the floor) + the `CustomerActivity` deletion leaves no dangling imports.
