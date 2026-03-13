# PRD Completeness Review — docs/prds/ vs Codebase

**Reviewer:** Claude (independent code review)
**Date:** 2026-02-28
**Scope:** All PRDs in `docs/prds/` + 2G spec (`docs/2G/`) cross-referenced against current codebase

---

## Executive Summary

The codebase has **substantial implementation** across all PRD areas. Round 2E (provider experience) and Round 2G (admin controls) are both built out with working UI, hooks, database schema, and RPCs.

**Overall completion: ~85%**

| PRD | Completion | Biggest Gap |
|-----|-----------|-------------|
| 2E-00 North Star | N/A (anchor doc) | Guides all 2E work |
| 2E-01 Founding Partner (BYOC) | **~95%** | Automated lifecycle hooks + QR generation |
| 2E-02 Day Command Center | **~80%** | Map view entirely missing |
| 2E-03 Earnings Trust | **~85%** | Payout schedule visibility + summary cache |
| 2E-04 Availability & Coverage | **~85%** | Admin coverage gap dashboard |
| Expanded 2E: Quality & Tiers | **~70%** | Score computation RPC + enforcement logic |
| 2G Admin Controls | **~90%** | Incentive caps, algorithm params, policy guardrails pages |

---

## PRD-by-PRD Analysis

---

### 2E-00: Provider Experience North Star

This is the anchor document — not directly implementable, but provides principles. **Assessment: principles are followed throughout.**

- "Demand provided" — jobs fed via auto-assign ✓
- "Optimized day" — route plan + lock + reorder ✓
- "Merit-based" — quality score → tier → assignment priority ✓
- "Admin offload" — earnings, payouts, hold management all automated ✓
- "BYOC" — founding partner program fully built ✓

---

### 2E-01: Founding Partner Program (BYOC) — ~95% Complete

**What's built:**

| Requirement | Status |
|-------------|--------|
| `byoc_attributions` table | ✓ Full schema, RLS, indexes |
| `provider_incentive_config` table | ✓ Scoped (GLOBAL/REGION/ZONE), seeded $10/90d |
| `byoc_bonus_ledger` table | ✓ Dedup, status tracking |
| Provider invite link generation | ✓ `useReferralCodes` hook |
| Invite landing page (`/invite/:code`) | ✓ Benefits + CTA |
| "Customers I Brought" dashboard | ✓ Active/pending counts, bonus window, earned total |
| Provider Growth Hub (`/provider/referrals`) | ✓ Full feature: badge, stats, scripts, milestones |
| Admin: Grant/revoke founding partner | ✓ Toggle in Incentives page Partners tab |
| Admin: Manage programs + scripts | ✓ Full CRUD |
| `compute_byoc_bonuses` RPC | ✓ Weekly computation with visit/subscription checks |
| `activate_byoc_attribution` RPC | ✓ Sets bonus window (90 days from first visit) |
| `admin_revoke_byoc_attribution` RPC | ✓ Revoke with reason |
| Anti-fraud: dedup, eligibility checks | ✓ Unique constraint, status validation |
| SMS invite scripts | ✓ Provider-facing with copy-to-clipboard |

**Gaps:**

| Gap | Severity | Suggestion |
|-----|----------|------------|
| QR code generation | LOW | Placeholder exists in InviteCustomers.tsx. Add a QR library (e.g., `qrcode.react`) to generate from invite URL. |
| Automated lifecycle hooks | MEDIUM | No automation for: `installed_at` on signup, `subscribed_at` on subscription, `activate_byoc_attribution()` on first visit, `ACTIVE → ENDED` on window expiry. These need Supabase triggers or edge function cron jobs. |
| Scheduled `compute_byoc_bonuses` caller | MEDIUM | RPC exists but nothing calls it weekly. Need a Supabase pg_cron job: `SELECT compute_byoc_bonuses(date_trunc('week', now())::date)`. |
| Invite landing trust statement | LOW | PRD §5.1 says "You can request a different provider at any time." — landing page implies this but could be more explicit. |

---

### 2E-02: Provider Day Command Center — ~80% Complete

**What's built:**

| Requirement | Status |
|-------------|--------|
| Today/Home screen (`/provider/dashboard`) | ✓ Job count, stats, route lock, quick queue |
| `provider_route_plans` table | ✓ Date, stops, drive/work minutes, projected earnings, locked_at |
| Start Route (lock route) | ✓ `lock_provider_route` RPC |
| Route optimization | ✓ `optimize-routes` edge function (nearest-neighbor) |
| Manual route reorder | ✓ Up/down arrows in Jobs page, `reorder_provider_route` RPC |
| Job detail status flow | ✓ NOT_STARTED → IN_PROGRESS → COMPLETED, with Arrived/Departed |
| Arrival/Departure timestamps | ✓ `arrived_at`, `departed_at` with source (manual/auto) |
| `job_events` table | ✓ Full event logging (ARRIVED, DEPARTED, CHECKLIST, PHOTO) |
| SKU task checklist | ✓ `JobChecklist.tsx` with Done/Skip per item |
| Proof photo capture | ✓ Camera integration, compression, required photo enforcement |
| Issue reporting | ✓ `ReportIssueSheet` with type + severity |
| Job completion gate | ✓ Can't complete without checklist + required photos |
| Customer state updates (2C notifications) | ✓ Notification templates for "on the way", "completed" |

**Gaps:**

| Gap | Severity | Suggestion |
|-----|----------|------------|
| **Map view** | HIGH | PRD §3.2 requires map with pins, numbered order, tap-to-preview, Navigate button. **No mapping library exists in the project.** Add Mapbox GL JS or Google Maps, show today's jobs as numbered pins, add "Navigate" deep-link (`geo:` / `maps:` URL scheme) on each job. This is the single biggest feature gap across all PRDs. |
| EN_ROUTE explicit status | LOW | PRD §3.3 lists EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED. Current flow uses NOT_STARTED → IN_PROGRESS. "Start Job" could set an EN_ROUTE status before ARRIVED, but current flow is functionally equivalent. |
| GPS timestamp capture | LOW | `gps_arrived_at` / `gps_departed_at` columns exist in jobs table but are never populated. Add optional geolocation capture at arrival/departure using browser Geolocation API. |
| Alerts integration on Today screen | LOW | NotificationBanners component exists but isn't prominently integrated into the Dashboard. Consider adding a "Today's Alerts" section for reassigned jobs, schedule changes. |

---

### 2E-03: Earnings Trust & Analytics — ~85% Complete

**What's built:**

| Requirement | Status |
|-------------|--------|
| Earnings dashboard (`/provider/earnings`) | ✓ Today/Week/Month tabs |
| Per-job breakdown | ✓ Expandable cards: base + modifier + total |
| `provider_earnings` table | ✓ Full ledger: base_amount, modifier, total, status, hold |
| Holds with reasons | ✓ `hold_reason` + `hold_until` fields, admin release via RPC |
| Hold release countdown | ✓ `formatDistanceToNow(hold_until)` |
| "At current pace" projection | ✓ MTD actual + (remaining jobs × 30d avg/job) |
| Payout account setup (Stripe Connect) | ✓ Onboarding flow with `create-connect-account` edge function |
| Payout history (`/provider/payouts/history`) | ✓ Past payouts with status badges |
| `provider_holds` + `provider_hold_context` tables | ✓ Type, severity, reason, evidence notes |
| Admin hold management (`ProviderLedger.tsx`) | ✓ View + release holds |

**Gaps:**

| Gap | Severity | Suggestion |
|-----|----------|------------|
| Payout schedule visibility | MEDIUM | Providers see past payouts but NOT upcoming payout dates. Add a "Next payout: Friday, Mar 6" card based on the weekly payout cadence. Simple calculation from current date to next Friday. |
| `provider_earnings_summary` cache table | LOW | PRD §4 recommends cached aggregates. App computes on-the-fly in React hook. This works at current scale but will become slow with thousands of earnings rows. Consider a materialized view or Supabase pg_cron to pre-aggregate daily/weekly/monthly totals. |
| Modifier type breakdown | LOW | Single `modifier_cents` column — doesn't distinguish quality bonus vs rush vs adjustment. Add `modifier_type` column or `modifier_details jsonb` to capture breakdown. UI could then show "Quality bonus: +$5, Rush: +$10" instead of generic "Bonus / Rush: +$15". |

---

### 2E-04: Availability & Coverage — ~85% Complete

**What's built:**

| Requirement | Status |
|-------------|--------|
| `provider_availability_blocks` table | ✓ DAY_OFF, VACATION, LIMITED_CAPACITY with validation |
| Provider calendar/list UI (`/provider/coverage`) | ✓ Create, view, cancel blocks with date pickers |
| Lead-time warning (48h) | ✓ Computed in hook, displayed as banner |
| Overlap prevention | ✓ `EXCLUDE USING gist` constraint |
| Assignment engine respects blocks | ✓ `auto_assign_job` checks both PRIMARY and BACKUP |
| Backup coverage automatic | ✓ Falls back to backup providers when primary blocked |
| Overflow handling + admin alerts | ✓ Notification to all admins when no provider available |
| Decision traces for assignment | ✓ Full audit trail logged |
| Reassignment logging | ✓ `job_assignment_log` with explain_admin/provider/customer |

**Gaps:**

| Gap | Severity | Suggestion |
|-----|----------|------------|
| Admin availability visibility | MEDIUM | No way for admins to see a provider's upcoming blocks in ProviderDetail page. Add a "Scheduled Time Off" tab showing active blocks, similar to the provider Coverage page. |
| Proactive coverage gap dashboard | LOW | Currently only reactive (overflow notifications when assignment fails). Consider a scheduled job that scans upcoming 7 days for zones where primary is blocked and backup pool is thin, then surfaces warnings in Ops Cockpit. |
| `coverage_exceptions` table | LOW | PRD mentions "Optional coverage_exceptions queue for admin." Not built. The overflow notification serves a similar purpose for now. |
| Full calendar view | LOW | Provider sees a list of blocks, not a calendar grid. Reviewed and accepted in sprint E03 review as adequate for MVP. Future improvement: add a month calendar view with block overlays. |

---

### Expanded 2E: Quality Score & Tiers — ~70% Complete

**What's built:**

| Requirement | Status |
|-------------|--------|
| `provider_quality_score_snapshots` table | ✓ Composite score, band (GREEN/YELLOW/ORANGE/RED), components |
| `provider_quality_score_events` table | ✓ Audit trail for score changes |
| `provider_feedback_rollups` table | ✓ Weekly aggregates with themes |
| Provider Quality UI (`/provider/quality-score`) | ✓ Score display, band badge, 4 component metrics |
| Quality bands: GREEN/YELLOW/ORANGE/RED | ✓ With thresholds 80/60/55 |
| Tier system: Gold/Silver/Standard | ✓ `provider_tier_history` + `useProviderTier` hook |
| Tier affects assignment priority | ✓ `auto_assign_job` orders backups by `tier_mod DESC` |
| Training gates per SKU | ✓ `provider_training_gates` table + deny-by-default in assignment |
| Weekly coaching rollup display | ✓ "What's working" + "Improve next week" in Quality UI |
| `visit_feedback_quick` table | ✓ Immediate satisfaction checks (GOOD/ISSUE) |
| `visit_ratings_private` table | ✓ Delayed anonymous reviews (1-5, tags, comments) |

**Gaps:**

| Gap | Severity | Suggestion |
|-----|----------|------------|
| **Score computation RPC** | HIGH | **No backend logic exists** to compute `provider_quality_score_snapshots` from feedback data. The 35/25/20/20 weights are hardcoded in the UI but no RPC aggregates visit data into scores. Need a `compute_provider_quality_scores()` function that runs daily via pg_cron. |
| **Weekly rollup generation** | HIGH | **No scheduler** to generate `provider_feedback_rollups`. Need an edge function or pg_cron job to: aggregate ratings, extract themes, generate summaries, publish if review_count ≥ 5. |
| `evaluate_training_gates()` RPC bug | MEDIUM | References `composite_score` and `snapshot_at` columns that don't exist. Actual columns are `score` and `computed_at`. This RPC is broken and will crash. |
| SLA enforcement tied to quality | MEDIUM | Quality score bands don't trigger any enforcement actions. No auto-restriction when ORANGE/RED, no suspension on RED, no mandatory training refresh on downgrade. Need to wire band transitions to assignment restrictions. |
| Admin quality dashboard | MEDIUM | No admin UI to monitor provider quality scores, trends, or take action. Templates exist for `admin_provider_risk_alert` but no logic to emit them. |
| "How to improve" checklist | LOW | PRD §4.4 specifies explicit improvement targets. Current UI shows summary text only. Could generate specific targets like "Improve on-time rate from 82% to 90%." |

---

### 2G Admin Controls — ~90% Complete

This round was reviewed in detail during sprints 2G-A through 2G-E. Here's the summary:

**What's built:**

| Requirement | Status |
|-------------|--------|
| `admin_memberships` table + RLS | ✓ superuser/ops/dispatcher/growth_manager |
| `is_admin_member()`, `is_superuser()` helpers | ✓ Used in all RPCs |
| AdminShell (desktop sidebar + responsive) | ✓ `AdminShell.tsx` with grouped navigation |
| Universal search (command bar) | ✓ `AdminSearchDialog.tsx` + `useAdminSearch.ts` |
| Ops Cockpit tiles | ✓ `/admin/ops` with drilldown |
| Dispatcher queues (6 views) | ✓ At Risk, Missing Proof, Unassigned, Coverage, Customer Issues, Provider Incidents |
| Dispatcher keyboard shortcuts | ✓ J/K/Enter/A/R/←→ |
| Dispatcher saved views | ✓ localStorage tab persistence |
| `admin_audit_log` + `log_admin_action` | ✓ 7-arg signature with actor_admin_role auto-resolve |
| `decision_traces` table + DecisionTraceCard | ✓ (Card shown on Job detail only — C-F5 flagged) |
| Control Room: Pricing & Margin | ✓ `ControlPricing.tsx` with zone overlays, bulk multiplier, rollback |
| Control Room: Payout Engine | ✓ `ControlPayouts.tsx` with 3 tabs |
| Control Room: Change Requests | ✓ `ControlChangeRequests.tsx` with submit/review |
| Control Room: Change Log | ✓ `ControlChangeLog.tsx` with diffs + rollback |
| Playbooks/SOPs | ✓ 6 of 10 playbooks built, role-filtered |
| Dense table styling | ✓ Compact rows, sticky headers, hover actions |
| All pricing/payout writes via server-side RPCs | ✓ Audit logged, versioned, reason-required |

**Gaps (from 2G spec + prior reviews):**

| Gap | Severity | Suggestion |
|-----|----------|------------|
| Incentive caps & rules page | MEDIUM | Spec §3.1 lists "Incentive caps & rules" as a Control Room page. `Incentives.tsx` exists for managing referral programs but doesn't include configurable caps/ceilings for BYOC bonuses or launch incentives that superusers can set. |
| Algorithm & Assignment params page | MEDIUM | Spec §3.1 lists this. No admin UI to tune assignment algorithm parameters (daily capacity caps, tier weights, backup selection logic). These are currently hardcoded in `auto_assign_job`. |
| Policy guardrails page | MEDIUM | Spec §3.1 lists this. No admin UI for configuring max change per week, emergency override TTL, or other guardrails. Currently hardcoded. |
| "Market signal" panel | LOW | Spec §8.2 describes a read-only analytics panel showing acceptance rate, churn signals, redo rate, avg duration by zone. Not built — would require aggregation queries. |
| DecisionTraceCard on all entity details | LOW | Spec §7.3 / finding C-F5: only shown on Job detail. Should also appear on Service Day, Provider Org, Payout, Exception details. |
| 4 missing playbooks | LOW | growth_manager has 0 playbooks (zone launch, BYOC close checklist). Also missing: coverage exception approvals (ops), payout/hold escalation (superuser). |
| Keyboard shortcuts E (escalate) and N (note) | LOW | Spec §4.4 lists these, only A (action) implemented. |

---

## Cross-Cutting Concerns & Optimization Suggestions

### 1. Scheduled Jobs / Cron Infrastructure (CRITICAL)

Multiple features rely on scheduled background processes that **don't have runners yet:**

| Scheduled Job | Status | Impact |
|---------------|--------|--------|
| `compute_byoc_bonuses(week_start)` | RPC exists, no caller | BYOC bonuses never computed |
| Quality score computation | No RPC exists | Quality scores never updated |
| Weekly feedback rollup generation | No RPC exists | Weekly coaching never published |
| `evaluate_training_gates()` | RPC exists (broken) | Training gates never auto-completed |
| BYOC attribution lifecycle | No automation | installed_at/subscribed_at never updated |
| BYOC bonus window expiry | No automation | ACTIVE → ENDED never triggers |

**Recommendation:** Set up Supabase pg_cron extension with jobs for each. This is the single highest-leverage infrastructure investment — it unblocks ~15% of remaining feature completeness across all PRDs.

### 2. Map View (HIGH — Major Feature Gap)

The Provider Day Command Center PRD calls for a map view with job pins, numbered order, tap-to-preview, and a Navigate button. **No mapping library exists in the project.**

**Recommendation:** Add Mapbox GL JS (free tier: 50k loads/month). Implementation:
- `ProviderMapView.tsx` component showing today's jobs as numbered pins
- Tap pin → job preview card
- "Navigate" button that opens `maps://` or `geo:` deep link
- Toggle between list and map on Dashboard and Jobs pages

### 3. Quality Score Computation Pipeline (HIGH)

The entire quality score system has UI and schema but **no computation backend**. This is a significant gap because:
- Provider quality scores are always empty/stale
- Tier evaluations never run
- Assignment priority modifiers are never populated
- Training gates never auto-complete

**Recommendation:** Create a daily `compute_all_provider_scores()` edge function or pg_cron job that:
1. Queries `visit_feedback_quick` + `visit_ratings_private` for rolling 28 days
2. Computes weighted score (rating 35%, issues 25%, photos 20%, on-time 20%)
3. Inserts into `provider_quality_score_snapshots`
4. Calls `evaluate_provider_tier()` for each provider
5. Emits `admin_provider_risk_alert` for downgrade events

### 4. Admin-Configurable Parameters (MEDIUM)

Several values are hardcoded that the spec says should be admin-configurable:

| Parameter | Current | Spec |
|-----------|---------|------|
| Daily capacity cap per provider | Hardcoded in auto_assign | Admin-tunable per zone |
| Tier score thresholds (80/60) | Hardcoded in useProviderTier | Admin-tunable |
| Assignment algorithm weights | Hardcoded in auto_assign_job | Admin-tunable |
| Max pricing change per week | Not enforced | Configurable guardrail |
| Emergency override TTL (72h) | Not enforced | Configurable |
| Quality score weights (35/25/20/20) | Hardcoded in UI | Admin-tunable |

**Recommendation:** Create an `admin_system_config` table with key-value pairs (or typed rows). Build a simple "Algorithm & Parameters" page in the Control Room. Start with read-only display, then add superuser-editable fields.

### 5. Performance Optimization (LOW — Future)

| Area | Current | Suggestion |
|------|---------|------------|
| Earnings aggregation | Computed on-the-fly in React hook | Add `provider_earnings_summary` materialized view or pg_cron cache |
| Ops Cockpit queries | Multiple parallel queries | Consider a single `get_cockpit_summary()` RPC that returns all stats in one call |
| Quality score lookup in auto_assign | Joined per-candidate | Pre-compute a `v_provider_status` view with score + tier + availability |

### 6. Missing E (escalate) and N (note) Shortcuts

These are specified in the dispatcher keyboard shortcuts but not implemented. The `DispatcherActionsDialog` already supports notes and escalation — just wire `E` → open dialog on escalate tab, `N` → open dialog on notes tab.

---

## Priority Recommendations (Ordered)

### P0 — Must Fix Before Production

1. **Set up pg_cron for scheduled jobs** — BYOC bonuses, quality scores, rollup generation. Without these, three major features are schema-only.
2. **Fix `evaluate_training_gates()` column references** — broken RPC (`composite_score` → `score`, `snapshot_at` → `computed_at`).
3. **Create quality score computation RPC** — compute from visit feedback data using 35/25/20/20 weights.

### P1 — High-Value Improvements

4. **Add map view for provider day** — single biggest UX gap. Mapbox GL JS + numbered pins + Navigate deep-link.
5. **Add payout schedule visibility** — simple "Next payout: Friday" card.
6. **Wire BYOC attribution lifecycle** — triggers for installed_at, subscribed_at, first visit activation, bonus expiry.
7. **Admin coverage gap dashboard** — proactive warnings for zones with upcoming primary blocks and thin backup pool.
8. **Admin quality monitoring page** — show all providers with scores, bands, trends, and action buttons.

### P2 — Nice to Have

9. **Algorithm & Parameters admin page** — make hardcoded values configurable.
10. **Incentive caps & guardrails admin page** — max change per week, emergency override TTL.
11. **Remaining 4 playbooks** — growth_manager zone launch, BYOC close, coverage exceptions, payout escalation.
12. **DecisionTraceCard on all entity details** — service day, provider org, payout, exception.
13. **QR code generation** — add `qrcode.react` library.
14. **GPS capture at arrival/departure** — browser Geolocation API, write to existing columns.
15. **Modifier type breakdown** — add `modifier_type` or `modifier_details` column.

---

## Files Referenced

### Provider Pages (29 pages)
- `src/pages/provider/Dashboard.tsx` — Today/Home screen
- `src/pages/provider/Jobs.tsx` — Job list with route reorder
- `src/pages/provider/JobDetail.tsx` — Status flow + proof + issues
- `src/pages/provider/JobChecklist.tsx` — SKU task checklist
- `src/pages/provider/JobPhotos.tsx` — Photo capture + upload
- `src/pages/provider/JobComplete.tsx` — Completion gate
- `src/pages/provider/Earnings.tsx` — Earnings dashboard
- `src/pages/provider/Payouts.tsx` — Payout account + balance
- `src/pages/provider/PayoutHistory.tsx` — Past payouts
- `src/pages/provider/Coverage.tsx` — Zone coverage + availability blocks
- `src/pages/provider/QualityScore.tsx` — Quality score + tier + training gates
- `src/pages/provider/Performance.tsx` — Performance metrics
- `src/pages/provider/InviteCustomers.tsx` — BYOC Founding Partner toolkit
- `src/pages/provider/Referrals.tsx` — Growth hub

### Admin Pages
- `src/pages/admin/ControlPricing.tsx` — Zone pricing
- `src/pages/admin/ControlPayouts.tsx` — Payout engine
- `src/pages/admin/ControlChangeRequests.tsx` — Change requests
- `src/pages/admin/ControlChangeLog.tsx` — Audit trail + rollback
- `src/pages/admin/DispatcherQueues.tsx` — Dispatcher workstation
- `src/pages/admin/Playbooks.tsx` — SOPs
- `src/pages/admin/Incentives.tsx` — Referral programs + partners

### Key Hooks
- `src/hooks/useProviderRoutePlan.ts` — Route plan + lock
- `src/hooks/useProviderEarnings.ts` — Earnings + projection
- `src/hooks/useProviderAvailability.ts` — Availability blocks
- `src/hooks/useProviderQualityScore.ts` — Quality score data
- `src/hooks/useProviderTier.ts` — Tier system
- `src/hooks/useByocAttributions.ts` — BYOC attributions
- `src/hooks/useZonePricing.ts` — Admin pricing mutations
- `src/hooks/useProviderPayoutAdmin.ts` — Admin payout mutations

### Key Migrations
- `20260227085129` — Availability blocks + auto_assign_job
- `20260227090024` — BYOC tables + bonus computation
- `20260227090952` — Quality score + tiers + training gates
- `20260227231252` — Assignment engine rewrite + training gate checks
- `20260227234815` — Latest auto_assign_job with full tier/availability/training integration
- `20260228000336` — Pricing/payout engine (6 tables)
- `20260228001439` — Audit logging + server-side RPCs
- `20260228005237` — Payout RPCs + change requests
