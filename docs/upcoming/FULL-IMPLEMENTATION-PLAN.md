# Round 64 — Business-Model Shift: Tier Variants, Credits UX, Snap-a-Fix

> **Created:** 2026-04-20
> **Branches:** Phase 1 on `claude/pricing-tiered-model-6WCj9` (merged); Phase 2 + Phase 3 on `claude/handled-home-phase-2-YTvlm` (awaiting merge as of 2026-04-22).
> **Mode:** Quality (tiered review per CLAUDE.md §5)
> **Scope:** 8 phases — schema, onboarding, credits UX, Snap-a-Fix, nav + visit detail, bundles, referral elevation, docs sync.
> **Status (2026-04-22):** Phases 1 ✅ · 2 ✅ · 3 ✅ · 4–8 ⬜. Interstitial Round 64.5 (Supabase self-host migration) ✅.

---

## Why this round exists

Handled Home ships three fixed-price plans (Essential $99 / Plus $159 / Premium $249) with a handle-based allowance that already supports rollover and expiry. Three forces are pushing the model beyond what the current shape can express:

1. **Home signals drive SKU-level selection but not plan selection.** A 4,500 sqft home pays the same sticker as a 1,200 sqft home and eats the same handle budget, which breaks unit economics at the top end. The feature-list already has SKU-level auto-selection (#43/#51) — we need to lift that idea to the plan tier.
2. **The v2 storyboards** (customer-ux-redesign v2 + credits/bundles/visit-detail v2) replace the cost-forward navigation with a benefits-forward one: hide sticker price, lead with "what's covered," elevate Snap as the central FAB, and fold plan/billing into an avatar drawer. Credits (not dollars) is the currency the customer sees. Seasonal bundles and a credit top-up loop are the ARR expansion engine.
3. **Snap-a-Fix** is the wedge — "photo in, it gets handled" — but no photo-first capture component exists today. The closest path (`ReportIssueSheet`) is reason-first and job-anchored.

This round delivers the shift end-to-end.

### Decisions locked at plan time

- **New Round 64** — separate from polish Rounds 12–61, which continue in their own stream.
- **UI copy only rename** — "handles" → "credits" in user-visible strings; DB tables (`plan_handles`, `handle_transactions`), RPCs (`spend_handles`, `grant_cycle_handles`, `refund_handles`, `expire_stale_handles`), and `useHandles` hook keep their existing names.
- **size_tier column on plans** — variants modeled as rows: `(basic, 10)`, `(basic, 20)`, `(basic, 30)`, `(basic, 40)`, etc. `plan_family` groups them. `plan_variant_rules` table drives selection without migrations.
- **Snap routing** — customer picks per-snap at submit: urgent (ad-hoc dispatch) or next-visit (credits held, attached to next scheduled job).

### Out of scope

- Renaming the DB ledger or RPCs.
- Provider payout pricing changes (simulator verification only — no new payout logic).
- Provider-side mobile redesign.
- Scheduling engine changes beyond attaching snap tasks to existing jobs.

---

## Phase 1 — Schema: size_tier on plans + plan_family + variant selection RPC ✅ SHIPPED

> **Shipped:** 2026-04-20 on `claude/pricing-tiered-model-6WCj9`.
> **Archive:** `docs/archive/round-64-phase-1-pricing-tiered-model-2026-04-20/`.
> **Migrations live:** `20260420173758_plan_variants_schema.sql` + `20260420174801_plan_variants_review_fixes.sql`.

### Problem

The `plans` table has no dimension that captures "this is the Basic plan for a 2,800 sqft home" vs. "this is the Basic plan for a 1,200 sqft home." Three fixed rows (Essential / Plus / Premium) don't compose into the 12-variant grid the new model needs. Downstream, subscriptions can't express which variant they're on, and onboarding has no RPC to resolve property signals → variant.

### Goals

- Variant-level plan rows that slot into the existing subscription / entitlement / handles infrastructure without breaking live subscriptions.
- One query path for onboarding to resolve a property into the correct variant, with admin-tunable rules.
- Admin UI that groups variants by family so the 12-variant list doesn't become a long flat list.

### Scope

- **Migration** — `supabase/migrations/<new>.sql`:
  - `ALTER TABLE plans ADD COLUMN plan_family text`, `ADD COLUMN size_tier smallint NULL`.
  - Backfill legacy rows: `essential → (legacy, null)`, `plus → (legacy, null)`, `premium → (legacy, null)` so live subscriptions don't break.
  - Seed new variants behind a feature flag: `(basic, 10)`, `(basic, 20)`, `(basic, 30)`, `(basic, 40)`, `(full, 10..40)`, `(premier, 10..40)` with `status='draft'`.
  - New table `plan_variant_rules`: `(id, plan_family, sqft_tier_min, sqft_tier_max, windows_tier_min, windows_tier_max, yard_tier_min, yard_tier_max, stories_tier_min, stories_tier_max, target_size_tier, priority)`.
  - New RPC `pick_plan_variant(p_property_id uuid, p_plan_family text) returns uuid` — reads `property_signals`, matches against `plan_variant_rules` ordered by `priority`, returns the variant's `plans.id`. Falls back to the smallest tier in the family if no rule matches.
- **Types** — extend `Plan` interface in `src/hooks/usePlans.ts:4-40` with `plan_family?: string`, `size_tier?: number`. Add `PlanVariantRule` type. New hook `src/hooks/usePlanVariantRules.ts`.
- **Admin UI** — `src/pages/admin/Plans.tsx:17-170` + `src/components/admin/plans/PlanForm.tsx`: family + size_tier inputs, grouped table view, rule editor for `plan_variant_rules`.
- **RLS** — `plan_variant_rules` readable by authenticated, writable by admin role only. Same pattern as existing `plans` RLS.

### Deliverables

- Migration applied locally; all three legacy plans still resolve correctly (`useCustomerSubscription` returns without error).
- `pick_plan_variant(property_id, 'basic')` returns a correct variant for each of the four sqft tier buckets in seed data.
- Admin Plans page renders grouped by family.
- `npx tsc --noEmit` clean, `npm run build` clean.

### Review

Medium — schema change + RPC + admin UI. 3 parallel lanes + synthesis.

### Batch estimate

3 batches:
- **Batch 1.1** — Migration + seed data + `pick_plan_variant` RPC + RLS. Backend only.
- **Batch 1.2** — TS types + `usePlanVariantRules` hook + `usePlans` extensions.
- **Batch 1.3** — Admin Plans UI + rule editor.

---

## Phase 2 — Onboarding: home signals → variant → "Starts at" pricing ✅ SHIPPED

> **Shipped:** 2026-04-21 on `claude/handled-home-phase-2-YTvlm`.
> **Archive:** `docs/archive/round-64-phase-2-2026-04-21/`.
> **Batches:** 2.1 `PlanFamilyCard` + `PlanVariantCard` + `planTierStyles.ts`. 2.2 `PlanStep` variant resolution + rationale + one-tier override + `useOnboardingProgress` metadata-merge. 2.3 Browse (static family summaries), customer Plans migration, BYOC `PlanActivateStep` migration, legacy `PlanCard.tsx` deleted.

### Problem

Onboarding today shows three fixed sticker prices on the Plan step before the customer's property signals have been captured in a way that materially changes what they'll pay. The flip the v2 storyboards describe: size the home first, reveal the specific variant second, and anchor on "Starts at $X" in public browse — not on a single dollar figure.

### Goals

- Onboarding resolves `pick_plan_variant` before the customer commits and surfaces a transparent one-line rationale ("Based on your ~2,800 sqft home, your Basic plan is Basic 30").
- Public `/browse` and authenticated `/customer/plans` switch to family-level cards showing "Starts at $X" (smallest variant in the family).
- Checkout writes the resolved variant's `plans.id` to `subscriptions.plan_id` — not the family root.

### Scope

- **Onboarding order** — `src/pages/customer/onboarding/` wizard reorders to: Property → HomeSetup (coverage + sizing) → **Plan (variant-resolved)** → Subscribe → ServiceDay. Current order is already Property → HomeSetup → Plan → Subscribe → ServiceDay per the Explore audit, so the reshape is inside `PlanStep`, not the wizard graph.
- **PlanStep** (`src/pages/customer/onboarding/PlanStep.tsx:16-98`):
  - Renders three **family** cards (Basic · Full · Premier) instead of three plan rows.
  - Each card shows "Starts at $X / 4 weeks" (smallest variant) + a variant breakdown chip ("4 sizes").
  - On card tap, call `pick_plan_variant(property_id, family)`; card expands to "Your plan: Basic 30" with the one-line rationale and the full variant's credit allowance.
  - Customer can manually override to an adjacent variant (one tier up/down) with a clear "override reason" dropdown; admin review flag gets set.
- **Public browse** (`src/pages/Browse.tsx:46-71`): hardcoded PLANS array replaced with family-level query; cards show "Starts at" pricing, no per-variant sticker on public.
- **PlanCard** (`src/components/plans/PlanCard.tsx:76-81`): split into `PlanFamilyCard` (family-level, "Starts at") and `PlanVariantCard` (variant-resolved detail, includes per-cycle credits).
- **Subscribe** (`src/pages/customer/Subscribe.tsx` + `supabase/functions/create-checkout-session/index.ts`): reads resolved variant plan_id from `customer_plan_selections.plan_id` and writes it through to the subscription row.
- **Plans page** (`src/pages/customer/Plans.tsx:94-187`): authenticated customers see family cards; tapping expands to their resolved variant; no other variants shown unless they tap "See other sizes."

### Deliverables

- Playwright E2E: onboarding → home sizing → Plan step → `pick_plan_variant` returns Basic 30 for seeded 2,800 sqft property → subscribe → correct variant written to `subscriptions.plan_id`.
- Public `/browse` renders 3 family cards with "Starts at" pricing, no variant listing.
- Customer `/customer/plans` shows the customer's resolved variant prominently; other variants collapsed.
- `npx tsc --noEmit` + `npm run build` clean.

### Review

Medium — onboarding flow + two public surfaces + new checkout contract. 3 parallel lanes + synthesis.

### Batch estimate

3 batches:
- **Batch 2.1** — `PlanFamilyCard` + `PlanVariantCard` split; reusable components.
- **Batch 2.2** — PlanStep variant resolution + rationale copy + manual override.
- **Batch 2.3** — Browse + Plans page + Subscribe/Checkout integration.

---

## Phase 3 — Credits UX: ring, low-balance nudge, top-up packs, autopay ✅ SHIPPED

> **Shipped:** 2026-04-22 on `claude/handled-home-phase-2-YTvlm` (same branch as Phase 2 due to task-rule branch pin).
> **Archive:** `docs/archive/round-64-phase-3-2026-04-21/`.
> **Batches:** 3.1 `CreditsRing` + `LowCreditsBanner`. 3.2 `/customer/credits` page (Top up · History · How it works). 3.3 `purchase-credit-pack` edge fn + `grant_topup_credits` SECURITY DEFINER RPC + `stripe-webhook` mode=payment branch. 3.4 Autopay toggle + `process-credit-pack-autopay` off-session cron + daily schedule migration. 3.5 Dashboard `CreditsRing` + `LowCreditsBanner` wire-up, full customer-visible "handles" → "credits" copy sweep, `HandleBalanceBar` deleted, `HandlesExplainer` → `CreditsExplainer`.
> **Pending human tasks (see `docs/upcoming/TODO.md`):** Stripe pack products + 3 `STRIPE_CREDIT_PACK_*_PRICE_ID` Edge Function Secrets; `supabase functions deploy purchase-credit-pack` + `process-credit-pack-autopay`; verify 07:00 UTC cron registered.

### Problem

Customers see "handles" today (already non-dollar, which is good). But the v2 storyboards introduce a richer credits surface: a ring visualization showing balance vs. annual cap, a low-credits banner triggered before the customer is stuck, three top-up pack tiers with per-credit-rate anchoring, and an inline autopay toggle that captures opt-in at the moment of need (not buried in settings). The existing `HandleBalanceBar` is a flat progress strip — it can't carry the new design.

### Goals

- A reusable `CreditsRing` component that conveys "what's left" (not "what's spent"), framed as benefit not currency.
- A dashboard banner that nudges at 20% balance threshold without triggering anxiety.
- A `/customer/credits` page that holds top-up packs + autopay toggle + transaction history.
- Backend support for one-off credit-pack purchases via Stripe, layered on the existing `handle_transactions` ledger.
- Complete copy sweep: zero "handle" / "handles" in customer-visible strings.

### Scope

- **CreditsRing** (`src/components/customer/CreditsRing.tsx`, new): SVG arc, large center number, sub-label ("of N / yr"). Variants: `compact` for dashboard, `hero` for credits page.
- **LowCreditsBanner** (`src/components/customer/LowCreditsBanner.tsx`, new): rendered on Dashboard when `balance < 20% * annual_cap`. Copy is impact-framed ("avoid pausing work") not loss-framed.
- **Credits page** (`src/pages/customer/Credits.tsx`, new, routed from avatar drawer):
  - Hero ring + cap + reset date.
  - Segmented control: Top up | History | How it works.
  - Three top-up packs: Starter (300) / Homeowner (600, recommended) / Year-round (1200). Each shows per-credit rate as the price anchor and a "Save X%" pill on the larger packs.
  - Confirmation sheet shows "Balance after top-up", "Rate locked", and an inline autopay toggle ("Auto-top-up when low") with copy explaining cadence.
  - History tab maps `handle_transactions` rows to plain-language entries (Granted / Spent on / Topped up / Refunded).
- **Backend**:
  - New Stripe products + prices for the three credit packs (admin TODO item).
  - New edge function `supabase/functions/purchase-credit-pack/index.ts`: validates pack id, creates Stripe payment intent, on webhook success calls existing `grant_cycle_handles`-shaped insert into `handle_transactions` with `txn_type='grant'`, `metadata={origin:'topup', pack_id, pack_credits}`.
  - Autopay toggle writes `subscriptions.metadata.autopay_credits = {enabled, pack_id, threshold}`. Existing renewal cron checks it and triggers `purchase-credit-pack` server-to-server when balance drops below threshold.
- **Copy sweep** — every customer-visible "handle(s)" → "credit(s)". Files (from agent audit):
  - `src/components/customer/HandleBalanceBar.tsx`
  - `src/components/plans/PlanCard.tsx:84-92`
  - `src/components/plans/HandlesExplainer.tsx` (consider rename to `CreditsExplainer.tsx`; route both paths via re-export)
  - `src/pages/customer/Plans.tsx:19-36` TIER_HIGHLIGHTS
  - `src/pages/customer/Billing.tsx:82,133`
  - `src/pages/customer/Referrals.tsx:114-117` ($30 → 30 credits framing)
  - Onboarding helper text strings
  - Internal hook names + DB tables stay "handles" (decision locked).

### Deliverables

- `CreditsRing` renders correctly for empty / low / full / over-rollover states (Storybook or visual fixture screenshots).
- LowCreditsBanner appears on Dashboard at threshold; dismisses for 7 days when "Later" tapped.
- `/customer/credits` end-to-end: pick pack → confirm → Stripe Checkout → webhook → balance updated → autopay row written.
- Grep `src/pages/customer/**/*.tsx src/components/customer/**/*.tsx` for `\bhandle\b` returns zero matches outside comments.
- `npx tsc --noEmit` + `npm run build` clean.

### Review

Large — new edge function + Stripe integration + new pages + cross-cutting copy sweep. 5 agents (3 lanes + Sonnet synthesis + Haiku synthesis).

### Batch estimate

5 batches:
- **Batch 3.1** — `CreditsRing` + `LowCreditsBanner` components (visual primitives).
- **Batch 3.2** — `/customer/credits` page (top-up tab + history tab + how-it-works tab).
- **Batch 3.3** — `purchase-credit-pack` edge function + Stripe webhook handling + transaction ledger entries.
- **Batch 3.4** — Autopay toggle + cron integration.
- **Batch 3.5** — Cross-cutting copy sweep (handles → credits in customer surfaces only).

---

## Phase 4 — Snap-a-Fix: photo-first capture + per-snap routing

### Problem

The Snap-a-Fix flow doesn't exist yet. The closest path today is `ReportIssueSheet` — reason-first, anchored to a completed job, no AI triage on the photo at submit time. The v2 storyboards put a **center FAB** that opens a photo-first sheet: tap, capture, optionally describe, choose where in the home, and route. That's the brand wedge ("photo in, it gets handled"), and it's also the highest-intent ARR moment when the prompt fires mid-visit.

### Goals

- A reusable Snap sheet that takes a photo first, ask questions second, and feels like one tap from the FAB to "submitted."
- Per-snap routing: customer chooses urgent (ad-hoc dispatch) or next-visit (credits held, attached to next scheduled job).
- AI triage on the photo at submit time so the receipt screen can show "we think this is a leaky faucet — 120 credits estimated" before the customer commits.
- Reuses the existing `useJobActions.uploadPhoto` compression + storage path and the `support-ai-classify` edge function pattern.

### Scope

- **Migration** — `supabase/migrations/<new>.sql`:
  - `snap_requests`: `(id, customer_id, property_id, photo_paths text[], description text, area text, routing text check (routing in ('next_visit','ad_hoc')), status text, credits_held int, credits_actual int, ai_classification jsonb, linked_job_id uuid, created_at, resolved_at)`.
  - `job_tasks` table (or extension if exists): add `task_type text check (task_type in ('included','snap','bundle','addon'))` so visit detail can render type chips correctly.
  - RLS: customer reads/writes own; provider reads via job linkage.
- **Snap route + page** — `src/pages/customer/Snap.tsx`, new. Bottom-tab FAB opens this as a sheet (not a navigation replace).
- **Snap sheet** — `src/components/customer/SnapSheet.tsx`, new:
  - Step 1: capture (camera or library picker; compresses via existing `useJobActions.uploadPhoto` util).
  - Step 2: optional 1-line description + area chip selector (Bath / Kitchen / Yard / Exterior / Other).
  - Step 3: AI preview ("Looks like a leaky faucet — about 120 credits") shown after `snap-ai-classify` returns.
  - Step 4: routing radio — Urgent (dispatch) | Next visit (credits held) — with a clear explainer of credit hold mechanic.
  - Submit: write `snap_requests` row, hold credits via `spend_handles` with `reference_type='snap_hold'`, fire `snap-ai-classify` edge function async.
- **Hooks** — `src/hooks/useSubmitSnap.ts`, new. Wraps photo upload + RPC call.
- **Edge function** — `supabase/functions/snap-ai-classify/index.ts`, new. Forks `support-ai-classify` pattern — fetches the snap_request photo, sends to LLM with a Snap-specific prompt, writes back `ai_classification.suggested_sku`, `suggested_credits`, `area_inference`, `confidence`.
- **Routing handlers**:
  - `next_visit`: server-side trigger (or client-side post-submit) inserts a `job_tasks` row of type `snap` onto the customer's next scheduled `jobs` row in their routine.
  - `ad_hoc`: posts a `dispatch_request` (existing table or new) for provider ops queue.
- **Refund path**: if the snap is canceled or the provider can't complete, existing `refund_handles` is called with the held amount.
- **Visit Detail integration** — Phase 5 surfaces snap tasks with chip type, photo, and AI-suggested-vs-actual credit summary on completion.

### Deliverables

- E2E (urgent path): photo → submit urgent → credit held → dispatch_request created → refund on cancel.
- E2E (next-visit path): photo → submit next-visit → snap row → linked job_tasks row → completion writes credits_actual + closes the snap.
- AI classification fires within 5s of submit; UI shows preview before final commit.
- `npx tsc --noEmit` + `npm run build` clean.

### Review

Large — new table + new RPC + new edge function + new sheet + cross-cutting integration with jobs/dispatch. 5 agents.

### Batch estimate

4 batches:
- **Batch 4.1** — Migration + `snap_requests` table + `job_tasks.task_type` + RLS.
- **Batch 4.2** — `SnapSheet` component + `useSubmitSnap` hook (UI shell, no AI yet).
- **Batch 4.3** — `snap-ai-classify` edge function + Snap sheet AI preview integration.
- **Batch 4.4** — Routing handlers (next_visit job_task insertion + ad_hoc dispatch_request) + refund path.

---

## Phase 5 — Nav shape + Visit Detail as page-of-the-day

### Problem

Bottom nav today is **Home | Schedule | Routine | Activity | More** (5 tabs). The v2 design replaces it with **4 tabs + center Snap FAB + avatar drawer**: Home | Services | [Snap] | Visits | Help. "Routine" merges into Services (since it's just a recurring services list); "Activity" merges into Visits (a visit *is* an activity); "More" becomes the avatar drawer in the top-right that holds Plan, Billing, Credits, Account, Referrals, Help, Sign out. Plan/billing should be ≤ 2 taps from anywhere — but never on a tab.

Visit Detail today is a flat receipt page. The v2 design treats it as **one page in three temporal modes**: preview (> 24h before), live (day-of), complete (after). Same URL, different state — the page becomes the day's source of truth.

### Goals

- Nav restructure with no dead links: legacy routes redirect.
- Avatar drawer that holds plan/billing/credits/account/referrals reachable in ≤ 2 taps.
- Visit Detail page that adapts to preview / live / complete modes from the same component.
- Issue flow rewritten as 4 fixed categories (Fix didn't hold / Damage / Task skipped / Feedback) with a visible "credits back" promise.

### Scope

- **Bottom nav** (`src/components/BottomTabBar.tsx:15-21`):
  - Replace 5 tabs with: Home (`/customer`) · Services (`/customer/services`) · [center Snap FAB → opens SnapSheet from Phase 4] · Visits (`/customer/visits`) · Help (`/customer/help`).
  - `TAB_CHILD_PATHS` updated for highlight logic.
- **Header + drawer** (`src/components/AppHeader.tsx:3-16` + new `src/components/AvatarDrawer.tsx`):
  - Replace `NotificationBell` with avatar button (initials).
  - Drawer sheet contains: top strip with notification badges, then list: Plan · Billing · Credits · Account · Referrals · Help & support · Sign out.
- **Route redirects** (`src/App.tsx`):
  - `/customer/more` → `/customer` (open drawer via query param `?drawer=true`).
  - `/customer/routine` → `/customer/services`.
  - `/customer/activity` → `/customer/visits`.
  - `/customer/subscription`, `/customer/plans`, `/customer/billing` reachable via drawer; existing routes preserved.
- **Services page** (`src/pages/customer/Services.tsx`, new file replacing or wrapping current Routine):
  - Top section: seasonal bundle spotlight (one bundle, contextual to season). Phase 6 fills this in.
  - Below: "Included in your plan" list with cadence (weekly lawn, monthly sprinkler check).
  - Below: "Available add-ons" grid.
- **Visits page** (`src/pages/customer/Visits.tsx`, new file replacing or wrapping current Activity):
  - Tabs: Upcoming · In progress · Past.
  - Each row links to `/customer/visits/:id` (the existing VisitDetail route).
- **VisitDetail rewrite** (`src/pages/customer/VisitDetail.tsx`):
  - Detect mode from `job.status` + `job.scheduled_for`:
    - **Preview** (status='scheduled' AND scheduled_for > now+24h): hero with date/pro/time-window, task list with type chips, reschedule + add-a-snap CTAs.
    - **Live** (status='in_progress' OR scheduled_for ≤ now+1h): same layout + live ETA + small SVG mini-map + progress checklist with current task highlighted + "notice something else?" Snap prompt (highest-intent upsell).
    - **Complete** (status='completed'): photo-receipt grid (existing PhotoGallery), itemized credit summary by line, inline rating widget (replaces modal), 4-category issue flow.
  - Type chips: `Included` (good-soft) / `Snap` (warm-soft) / `Bundle` (gold-soft) / `Credits` (gold-soft) — colors per design system.
- **Issue flow rewrite** — `src/components/customer/ReportIssueSheet.tsx`:
  - Replace 3-step (reason → details → confirm) with **4 fixed categories**: Fix didn't hold · Damage · Task skipped · Feedback.
  - Each category routes to a tailored micro-flow (damage requires photo; feedback is private text only).
  - "Our promise" footer block: "If we can't fix it, credits come back to your balance."

### Deliverables

- All 4 bottom tabs render correctly; FAB opens SnapSheet.
- Avatar drawer reachable from every customer page; Plan/Billing/Credits in drawer list.
- Legacy routes redirect; orphaned-link grep across `src/` returns zero hard-coded links to `/customer/more|routine|activity`.
- Visit Detail renders correctly for seeded preview / live / complete fixtures (visual screenshot regression).
- Issue flow shows 4 categories; submitting a "Fix didn't hold" issue creates the same support ticket shape as today, with `category` field populated.
- `npx tsc --noEmit` + `npm run build` clean.

### Review

Large — nav + new pages + VisitDetail rewrite + cross-cutting redirects. 5 agents.

### Batch estimate

5 batches:
- **Batch 5.1** — BottomTabBar restructure (4 tabs + FAB) + route redirects.
- **Batch 5.2** — AvatarDrawer + AppHeader integration.
- **Batch 5.3** — `/customer/services` + `/customer/visits` page shells (consume existing data).
- **Batch 5.4** — VisitDetail three-mode rewrite + type chips.
- **Batch 5.5** — ReportIssueSheet 4-category rewrite.

---

## Phase 6 — Seasonal bundles as the ARR loop

### Problem

Seasonal services exist today (`seasonal_templates`, `useSeasonalOrders`) but they're scheduled as standalone appointments. The v2 design reframes them as **bundles that attach to an existing visit day** — no new appointment window to coordinate, itemized credit savings per line, and one window-limited spotlight at a time on the Services page. This is the primary ARR expansion mechanism: a Basic-30 customer paying $189/mo becomes a ~$2,800/yr customer once they adopt two seasonal bundles.

### Goals

- One in-season bundle spotlighted on the Services page; next season's shown as "Notify me."
- Bundle detail page with itemized credits per included line (so "Save 120 credits" is verifiable math).
- "Choose visit day" picker that attaches the bundle to an existing routine day (not a new appointment).
- Admin tooling for bundle window dates + zone rollout + per-line credit pricing.

### Scope

- **Migration** — `supabase/migrations/<new>.sql`:
  - `bundles` table: `(id, slug, name, season, window_start_date, window_end_date, zone_ids uuid[], status, hero_image_path, description, total_credits, separate_credits)`. Separate_credits is the sum of line prices — the diff is the "savings" the card shows.
  - `bundle_items` table: `(id, bundle_id, sku_id, label, est_minutes, credits, sort_order)`.
  - RLS: customers read within their zone + window; admin writes.
- **Services page** (`src/pages/customer/Services.tsx` from Phase 5 gets populated):
  - Top: active seasonal bundle card (one, contextual to today's date + zone).
  - Middle: "Included in your plan" list.
  - Bottom: "Available add-ons" grid (reuses existing `AddonSuggestionsCard`).
- **Bundle detail** (`src/pages/customer/Bundles/[slug].tsx`, new):
  - Hero image + season tag.
  - Itemized `bundle_items` list with per-line credit values.
  - Bundle price box: "540 credits" vs. "660 separate" vs. "Save 120" pill.
  - "Choose visit day" CTA → picker showing customer's next 3 routine days with the bundle's ~2 hour addition noted.
  - Optional add-ons line ("Interior window wash +120 cr, same visit").
- **Booking** — extends `usePurchaseAddon`:
  - New function `useBookBundle(bundleId, targetJobId)` — holds credits via `spend_handles`, inserts `job_tasks` rows for each `bundle_item`, updates the job's estimated duration.
- **Admin** — `src/pages/admin/Bundles.tsx`, new:
  - CRUD for `bundles` + `bundle_items`.
  - Zone rollout toggle.
  - Window date picker with preview of when it'll show on the customer side.
- **Feature-list references** — extends #217–219 (seasonal templates) + #140–144 (add-ons).

### Deliverables

- E2E: view Services → see Fall Prep spotlight → open bundle detail → choose Nov 4 → credits held → `job_tasks` rows inserted → existing Tuesday Nov 4 job picks them up.
- Savings math matches: bundle line items sum to `separate_credits`; displayed save equals `separate_credits - total_credits`.
- Admin Bundles page creates a new bundle, rolls it to one zone, confirms it only renders for customers in that zone.
- `npx tsc --noEmit` + `npm run build` clean.

### Review

Medium — new page + admin + extends existing purchase flow. 3 parallel lanes + synthesis.

### Batch estimate

3 batches:
- **Batch 6.1** — Migration + `bundles` + `bundle_items` + seed data for Fall Prep.
- **Batch 6.2** — Bundle detail + booking flow + Services page spotlight.
- **Batch 6.3** — Admin Bundles page.

---

## Phase 7 — BYOC / BYOP / referral elevation

### Problem

BYOC wizard, BYOP recommendation form, and the Referrals milestones page all exist today — but they're buried in a menu. The v2 design surfaces them at the **peak-trust moments**: post-visit completion, dashboard rotation, and the final step of onboarding. Also: referrals cards currently display "$30 Earned" — needs to become "30 credits earned" (tail of the Phase 3 copy sweep).

### Goals

- Post-visit ReceiptSuggestions card rotates BYOC / BYOP / invite-a-neighbor CTAs based on the visit context and referral eligibility.
- Dashboard gains a contextual growth card (rotates, rate-limited to 1/week).
- Onboarding adds a final "who could you bring?" step after ServiceDay.
- Referrals page fully restyled to match credits UX.

### Scope

- **VisitDetail ReceiptSuggestions** (extends Phase 5 VisitDetail rewrite + `src/components/customer/ReceiptSuggestions.tsx`):
  - After a 4- or 5-star rating is submitted, show one of: "Love Tomás? Recommend him" (BYOP pre-fill with pro's name) · "Know a neighbor who'd love this?" (referral code share) · "Bring a pro you trust" (BYOC wizard).
  - Rotation logic: check existing referral/byoc/byop status via `useReferralRewards`, pick the most-likely-to-convert (not rotated randomly).
- **Dashboard growth card** (`src/pages/customer/Dashboard.tsx:153`):
  - New section below NextVisitCard.
  - Rate limit: 1 card/week, dismissible for 14 days.
  - Same rotation logic as post-visit.
- **Onboarding "who could you bring"** — new step after ServiceDayStep:
  - Single input + optional phone.
  - Skippable.
  - On submit → calls existing `useByopRecommendation` or BYOC link generation depending on relationship type chip.
- **Referrals page** (`src/pages/customer/Referrals.tsx:114-175`):
  - "$30 Earned" → "30 credits earned" (Phase 3 copy sweep applies here).
  - Milestone rewards framed in credits throughout.
  - Visual restyle to match Credits page aesthetic (ring for milestone progress).
- **BYOC entry-point context** (`src/pages/customer/ByocOnboardingWizard.tsx`):
  - Accept a URL param `?via=post_visit&pro_id=...` → pre-fills pro recommendation and skips the "how did you hear" step.

### Deliverables

- Post-visit rating = 5★ → ReceiptSuggestions shows a CTA card; tap → correct downstream page opens.
- Dashboard growth card appears once per week max; dismiss persists 14 days.
- Onboarding step submits a BYOP recommendation without error; skippable path works.
- Referrals page shows credits language throughout; zero "$" symbols on referral cards.
- `npx tsc --noEmit` + `npm run build` clean.

### Review

Medium — cross-surface integration, no new schema. 3 parallel lanes + synthesis.

### Batch estimate

3 batches:
- **Batch 7.1** — ReceiptSuggestions rotation + post-visit CTAs.
- **Batch 7.2** — Dashboard growth card + rate limiting.
- **Batch 7.3** — Onboarding "who could you bring" step + Referrals page restyle.

---

## Phase 8 — Docs sync + round cleanup

### Problem

After 7 phases of structural change, the north-star docs need to catch up or the next round will make decisions on bad information.

### Goals

- Every north-star doc reflects the shipped state.
- Feature list shows correct statuses.
- Working folder archived cleanly.

### Scope

- **masterplan.md** — pricing shift section, credits model, Snap-a-Fix as wedge, unit economics table update.
- **operating-model.md** — new variant margin bands, credit top-up revenue line, bundle unit economics, Snap routing cost assumptions.
- **feature-list.md** — new entries for: plan variants (size_tier + plan_family), credits top-up UX, Snap-a-Fix, seasonal bundles, 4-tab nav + avatar drawer, VisitDetail three-mode, 4-category issue flow. Flip statuses for features that matured.
- **screen-flows.md** — every new/changed screen (Credits page, Snap sheet, VisitDetail three modes, Services page, Bundle detail, AvatarDrawer).
- **app-flow-pages-and-roles.md** — 4-tab nav, new routes (`/customer/credits`, `/customer/snap`, `/customer/services`, `/customer/bundles/:slug`, admin `/admin/bundles`), legacy redirects.
- **design-guidelines.md** — type chip colors (Included / Snap / Bundle / Credits), CreditsRing spec, LowCreditsBanner pattern.
- **Round cleanup**:
  - Archive `docs/working/plan.md` + `docs/working/batch-specs/*` → `docs/archive/round-64-pricing-tiered-model-<YYYY-MM-DD>/`.
  - Delete `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` after archive (it stays in archive as record).
  - Update `docs/upcoming/TODO.md` with any human action items surfaced during the round (new Stripe products for credit packs, LOVABLE_API_KEY quota review, bundle seeding for other zones, etc.).

### Deliverables

- All doc updates committed in a single "docs: sync after Round 64" commit.
- Working folder empty.
- TODO.md has new items dated today with source tags.

### Review

Small — mechanical doc updates with fact-check emphasis. 2 agents (combined reviewer + synthesis; Lane 2 replaced with fact-checker per CLAUDE.md §5 rule).

### Batch estimate

2 batches:
- **Batch 8.1** — masterplan + operating-model + feature-list + TODO.md updates.
- **Batch 8.2** — screen-flows + app-flow-pages-and-roles + design-guidelines + archive + working folder cleanup.

---

## Verification (round-wide)

Run at phase boundaries and at round close:

- **Build + types**: `npx tsc --noEmit` and `npm run build` pass after each batch.
- **E2E (Playwright)** new suites:
  - Onboarding → home sizing → `pick_plan_variant` → subscribe → correct variant on subscription row.
  - Snap happy path, urgent routing: photo → submit → credit held → dispatch_request → refund on cancel.
  - Snap happy path, next-visit routing: photo → submit → attached to job → credits_actual written on completion.
  - Credit top-up: pick pack → Stripe Checkout → webhook → balance updated → autopay opt-in persists.
  - VisitDetail mode detection: fixture seeded for preview/live/complete renders correct UI.
  - Bundle booking: choose Fall Prep → pick Nov 4 → `job_tasks` rows appear on that job.
- **Admin simulator** (`/admin/simulator`): re-run with Basic-10 through Premier-40 populated. Confirm every variant lands above the margin threshold in `docs/operating-model.md`. Halt the round if any variant is below.
- **Visual regression** (Chromium screenshots per CLAUDE.md §5):
  - Zero dollar amounts visible on Home / Services / Snap / Visits / Help tabs or the tab bar.
  - Plan + billing reachable in ≤ 2 taps via avatar drawer.
  - CreditsRing renders correctly in empty / low / full / over-rollover states.
  - VisitDetail renders preview / live / complete correctly.
- **Copy sweep check**: `grep -r '\bhandle\|handles\b' src/pages/customer src/components/customer --include='*.tsx' --include='*.ts'` returns zero matches outside comments.
- **Orphaned-link scan**: `grep -r '/customer/more\|/customer/routine\|/customer/activity' src/` returns only entries in `App.tsx` route redirect definitions.
- **AI UX review harness** (existing feature #388–390): run against Dashboard, Credits, Snap, VisitDetail three-mode, Bundle detail, and Services page.
- **Feature-list sync check**: grep `docs/feature-list.md` for each new feature title; status must be DONE.

---

## Reusable code targets (what this round builds on)

**Schema + RPCs to reuse (do not rewrite):**
- `supabase/migrations/20260222044155_*.sql` — plans, entitlement_versions, SKU rules.
- `supabase/migrations/20260227013203_*.sql` — plan_handles, handle_transactions ledger, spend_handles / grant_cycle_handles / refund_handles / expire_stale_handles RPCs.
- `src/hooks/useHandles.ts:11-40` — `useHandleBalance`, `usePlanHandlesConfig`.
- `src/hooks/usePlans.ts:4-40` — `Plan`, `PlanEntitlementVersion` types.
- `src/hooks/useSkuLevels.ts:12-26` — size-based level selection pattern to model `pick_plan_variant` after.

**Edge-function patterns:**
- `supabase/functions/support-ai-classify/index.ts` — template for `snap-ai-classify`.
- `supabase/functions/create-checkout-session/*` — template for `purchase-credit-pack`.

**UI patterns:**
- `src/hooks/useJobActions.ts:uploadPhoto` — compression + upload pattern for Snap.
- `src/components/customer/AddonSuggestionsCard.tsx` + `useAddonSuggestions:usePurchaseAddon` — bundle booking pattern.
- `src/components/customer/PhotoGallery.tsx` — visit detail photo grid.

---

## Human TODO items (expected, seed in TODO.md)

- New Stripe products + prices: Starter 300 ($149), Homeowner 600 ($269), Year-round 1200 ($479). Add product IDs to `.env.local`.
- LOVABLE_API_KEY quota review — Snap AI classify will increase call volume.
- First bundle seed data: Fall Prep bundle line items + zone list for rollout.
- Admin review flag review — customer variant manual overrides in Phase 2 need an admin surface (consider adding to Round 65).
