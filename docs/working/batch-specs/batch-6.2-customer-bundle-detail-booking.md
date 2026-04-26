# Batch 6.2 — Customer Bundle detail + booking flow + Services-page spotlight

> **Round 64 · Phase 6 · Batch 2 of 3**
> **Created:** 2026-04-26
> **Mode:** Quality (production-facing customer surfaces + booking flow that holds credits)
> **Review:** Medium — 3 parallel lanes + Lane 4 synthesis (sub-agent)

---

## Why

Batch 6.1 shipped the schema + Fall Prep strawman seed. Batch 6.2 lights up the customer-facing surfaces so the bundle is reachable, viewable, and bookable. The booking mutation holds credits via `spend_handles` and inserts `job_tasks` rows onto the customer's chosen routine job — no new appointment, just a richer existing visit.

## Goals

1. Customers see one in-season bundle spotlight on `/customer/services` (replaces existing "coming soon" stub).
2. Bundle detail page at `/customer/bundles/:slug` renders hero + itemized line list + savings pill.
3. "Choose visit day" picker shows the next 3 `NOT_STARTED` routine jobs and attaches the bundle to the chosen one.
4. Booking flow holds `total_credits` via `spend_handles` and inserts a `job_tasks` row per `bundle_item` (task_type='bundle').
5. Savings math is correct AND covered by a unit test (bundle.separate_credits − bundle.total_credits = "Save N").

## Scope

### New hooks

- **`src/hooks/useBundles.ts`** — list query: `SELECT * FROM bundles` (RLS already filters to active+window+zone). Returns `Bundle[]` typed via `as any` cast on the row (bundles types pending regen). Returns the *first* in-season match for spotlight (RLS only returns ones the customer can see).
- **`src/hooks/useBundle.ts`** — single-row by slug + nested `bundle_items` join. Returns `{ bundle, items } | null`.
- **`src/hooks/useBookBundle.ts`** — mutation:
  1. Validate balance ≥ bundle.total_credits.
  2. Call `spend_handles(subscription_id, customer_id, total_credits, bundle.id)`.
  3. If success, insert one `job_tasks` row per `bundle_item` with `job_id = targetJobId`, `task_type='bundle'`, `sku_id = item.sku_id`, `description = item.label`, `credits_estimated = item.credits`.
  4. If `job_tasks` insert fails after credits debited, surface a "credits held but routing failed — contact support" toast + log a `billing_exceptions` row (HIGH severity, like the stripe-webhook precedent in Batch 3.3).
  5. On success: invalidate `["customer_jobs"]` + `["handle_balance"]` query caches; navigate to the visit detail.

### New components

- **`src/components/customer/SeasonalBundleSpotlight.tsx`** — small card. Shows bundle.name, "Save N credits" pill, hero image (or fallback gradient), "View bundle" CTA → navigate to `/customer/bundles/:slug`. Renders nothing when no bundle is active for the customer.
- **`src/components/customer/BundleVisitDayPicker.tsx`** — list-of-3 of `useCustomerJobs("upcoming")` filtered to `status='NOT_STARTED'`, sorted by `scheduled_date asc`. Each row: date, day-of-week, job's primary SKU snapshot. Tapping selects. Sheet-style picker.

### New page

- **`src/pages/customer/BundleDetail.tsx`** — route `/customer/bundles/:slug`:
  - Hero: image (or gradient fallback) + name + season tag + window dates.
  - Description.
  - Itemized line list with credits per line.
  - Big "savings" box: `total_credits` vs `separate_credits` vs "Save N (~X%)".
  - "Add to a visit" CTA opens `BundleVisitDayPicker` sheet.
  - On pick: confirm sheet → call `useBookBundle`. On success: toast + navigate to the chosen `/customer/visits/:job_id`.

### New helper + test

- **`src/lib/bundleSavings.ts`** — pure function: `computeBundleSavings({ totalCredits, separateCredits })` → `{ saveCredits, savePercent }`. `savePercent` rounded to nearest int.
- **`src/lib/bundleSavings.test.ts`** — vitest cases:
  - Standard: 540 / 660 → save 120, 18% (rounded)
  - Zero discount edge: 540 / 540 → save 0, 0%
  - Throws on inverted inputs (separate < total) — defensive, even though DB constraint blocks it.

### Existing-file edits

- **`src/pages/customer/Services.tsx`** — replace the local placeholder `SeasonalBundleSpotlight` (lines 107-119) with the new external component. Conditional rendering: only renders when `useBundles()` returns a non-empty list.
- **`src/App.tsx`** — register `/customer/bundles/:slug` lazy route to `BundleDetail`.

## RLS reliance

The schema's RLS policies (Batch 6.1) already enforce: customers only see bundles when status='active' AND today is in window AND zone matches. The hooks just `SELECT * FROM bundles` and trust RLS. Status='draft' bundles (like the Fall Prep seed in `'draft'` state) return zero rows — admin needs to flip status='active' + populate zone_ids via Batch 6.3 to actually surface anything to customers.

## Acceptance criteria

- [ ] `useBundles()` returns active+in-window bundles for the customer's zone.
- [ ] `/customer/bundles/:slug` renders hero + items + savings pill correctly.
- [ ] Visit-day picker lists at most 3 `NOT_STARTED` upcoming jobs.
- [ ] Booking flow calls `spend_handles` exactly once + inserts N `job_tasks` rows (N = bundle_items count).
- [ ] On `insufficient_handles` error, the booking is aborted and the customer sees a clear message (no `job_tasks` rows inserted).
- [ ] On `job_tasks` insert failure after credits debited, a `billing_exceptions` HIGH row is written with `type='bundle_routing_failed'` and bundle/job context.
- [ ] Savings math: `bundleSavings({ totalCredits: 540, separateCredits: 660 })` returns `{ saveCredits: 120, savePercent: 18 }`.
- [ ] `npx tsc --noEmit` clean (`as any` casts allowed on bundles + bundle_items queries until regen-types lands).
- [ ] `npm run build` clean.
- [ ] `npm test` — bundleSavings test passes.

## Testing tiers

| Tier | Run? | Notes |
|---|---|---|
| T1 (tsc + build + lint) | ✅ via `/pre-pr` | Mandatory |
| T2 (vitest unit) | ✅ | bundleSavings.test.ts |
| T3 (smoke) | — | No edge function changes |
| T4 (Playwright E2E) | — | Defer to a later batch — Sarah harness already covers customer surfaces |
| T5 (Sarah persona) | ✅ via playwright-pr.yml | Optional / advisory; bundle detail not in milestone capture set yet |

## Out of scope

- Bundle hero image storage / upload — admin handles in 6.3.
- Real zone selection on Fall Prep seed — admin chooses in 6.3.
- E2E spec for bundle booking — defer to a polish batch after admin UI lands so the test can flip the seed to active itself.
- Receipts / post-booking confirmation page beyond the toast — relies on existing visit detail.
- Provider-side rendering of bundle line items in their job task list — separate provider batch.

## Risks + override notes

- **Bundles types not regenerated yet** — `as any` casts on `bundles` + `bundle_items` queries until the regen-types workflow's auto-PR lands. Document with `[OVERRIDE: bundles types pending regen-types.yml auto-PR — clean up in follow-up]`.
- **Race in booking** — `spend_handles` is transactional in Postgres but the subsequent `job_tasks` INSERT is a separate round-trip. Mitigated by writing `billing_exceptions` on partial-success per CLAUDE.md's stripe-webhook precedent.
- **Empty upcoming-jobs list** — if a customer has no `NOT_STARTED` jobs, the picker shows an empty state with "Activate a routine first" message and disables the booking CTA.
- **Insufficient credits** — picker still renders, booking attempt shows insufficient-credits toast + suggests credit top-up.

## Batch deliverables checklist

- [ ] 5 new files: 3 hooks, 2 components.
- [ ] 1 new page (BundleDetail).
- [ ] 1 new helper + test pair (bundleSavings).
- [ ] 2 existing-file edits (Services.tsx, App.tsx).
- [ ] All gates green.
- [ ] PR opened with Test plan citing T1 + T2 + T5.
- [ ] Self-merge after Vercel + Supabase Preview ✅ + reviews ✅.
