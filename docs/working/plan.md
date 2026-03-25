# Plan: Screen-Flows Implementation Gap Closure

## Session Handoff

**Last updated:** 2026-03-25
**Status:** Plan created, awaiting human approval
**Next action:** Get approval, then begin Phase 1 Batch 1
**Context:** Full audit of screen-flows.md vs codebase found 116 gaps (23 HIGH, ~50 MED, ~25 LOW). This plan closes them in 6 phases across 18 batches.

## Execution Mode
**Speed mode** — 4-agent review (Lanes 1+2, Sonnet only). Max 2 fix passes.

---

## Phase 1: Critical Bugs & Blocking UX (HIGH priority, customer-facing)

Fixes that unblock user flows or repair broken functionality on customer pages.

| Batch | Scope | Size | Review | Combinable |
|-------|-------|------|--------|------------|
| 1 | F4 Share Landing hero photo + F5 Onboarding error swallowing + skip options | Medium | light | No |
| 2 | F7 Dashboard rollover badge + F8 Plan Detail fixed CTA + F9 Routine Review cost breakdown | Medium | light | No |
| 3 | F11 Schedule tappable visit cards + F11 rollover line + F13 Billing stub/default fixes | Medium | light | No |

---

## Phase 2: Critical Bugs & Blocking UX (HIGH priority, provider-facing)

Fixes that unblock provider flows or repair broken functionality.

| Batch | Scope | Size | Review | Combinable |
|-------|-------|------|--------|------------|
| 4 | F17 Onboarding visual progress bar (all 6 steps) | Medium | light | No |
| 5 | F17 Coverage zone map (onboarding) + F23 Coverage zone map (settings) — shared MapboxZoneSelector component | Large | full | No |
| 6 | F19 Job List "Start Next Job" CTA + F19 Job Complete earnings breakdown + F19 notes limit 500 | Medium | light | No |
| 7 | F21 Earnings "Set Up Payout Account" button + F24 Support ticket creation + F24 Support Detail duplicate card bug | Medium | light | No |

---

## Phase 3: Critical Bugs & Blocking UX (HIGH priority, admin-facing)

| Batch | Scope | Size | Review | Combinable |
|-------|-------|------|--------|------------|
| 8 | F26 Provider Detail earnings section + F29 billing route + F29 payout schedule | Medium | light | No |
| 9 | F30 Support assignment/bulk actions + F30 Ticket Detail attachments + F31 Bundle Savings CTA/dismiss/states | Medium | light | No |

---

## Phase 4: Missing Error & Empty States (MED priority, sweeps)

Mechanical pattern: add spec-compliant error/empty states across all flows. These batches are combinable since they follow the same pattern.

| Batch | Scope | Size | Review | Combinable |
|-------|-------|------|--------|------------|
| 10 | Error/empty states for F1-F6 (Auth, BYOC, Referral, Onboarding flows) | Medium | light | Yes (10-11) |
| 11 | Error/empty states for F7-F11 (Dashboard, Plans, Routine, Schedule, Activity) | Medium | light | Yes (10-11) |
| 12 | Error/empty states for F12-F16 (Property, Billing, Support, Referrals, Settings) | Medium | light | Yes (12-13) |
| 13 | Error/empty states for F17-F24 (all provider flows) | Medium | light | Yes (12-13) |
| 14 | Error/empty states for F25-F37 (admin flows + feature components) | Medium | light | No |

---

## Phase 5: Copy Mismatches & UI Alignment (MED + LOW priority, sweeps)

Mechanical pattern: align copy, icons, button variants, and minor UI elements to match spec exactly.

| Batch | Scope | Size | Review | Combinable |
|-------|-------|------|--------|------------|
| 15 | Copy fixes for customer flows (F1-F16): titles, empty state text, toast messages, explainer text | Medium | light | Yes (15-16) |
| 16 | Copy fixes for provider flows (F17-F24): titles, captions, toast messages, back button labels | Medium | light | Yes (15-16) |
| 17 | Copy fixes for admin flows (F25-F37) + icon/variant fixes across all flows | Medium | light | No |

---

## Phase 6: Documentation Sync

| Batch | Scope | Size | Review | Combinable |
|-------|-------|------|--------|------------|
| 18 | Sync six north star docs + verify screen-flows.md matches updated codebase | Small | verify | No |

---

## Risk Areas

1. **F17/F23 Mapbox zone map (Batch 5)** — Largest single batch. Requires creating a reusable `MapboxZoneSelector` component. If Mapbox GL is not configured or API key is missing, this batch may need to be deferred.
2. **F13 Stripe Elements (Batch 3)** — The Stripe card collection stub may require backend `create-setup-intent` edge function changes. If backend is not ready, we'll add a clear "Coming soon" state instead of a toast.
3. **F9 Routine Review cost breakdown (Batch 2)** — Requires pricing data access. May need to query plan/SKU pricing to show line items.

## Deferred Items

- F5 Onboarding back button icon (ArrowLeft→ChevronLeft) — LOW, cosmetic, will fix in Phase 5 if touching file
- F22 Performance/Quality screen merge — spec describes one screen but code has two pages. This is a design decision beyond copy fixes. Flag for human review.
- F30 K-factor summary — requires analytics pipeline work beyond frontend

---

## Progress Table

| Batch | Phase | Description | Status |
|-------|-------|-------------|--------|
| 1 | P1 | Share Landing hero + Onboarding error/skip fixes | ⬜ |
| 2 | P1 | Dashboard rollover + Plan Detail CTA + Routine cost breakdown | ⬜ |
| 3 | P1 | Schedule tappable cards + Billing stub/default | ⬜ |
| 4 | P2 | Provider Onboarding progress bar | ⬜ |
| 5 | P2 | Coverage zone Mapbox map (onboarding + settings) | ⬜ |
| 6 | P2 | Job List CTA + Job Complete earnings breakdown | ⬜ |
| 7 | P2 | Earnings payout button + Provider support ticket creation + duplicate card bug | ⬜ |
| 8 | P3 | Admin Provider Detail earnings + Billing route + Payout schedule | ⬜ |
| 9 | P3 | Admin Support assignment + Attachments + Bundle Savings | ⬜ |
| 10 | P4 | Error/empty states: F1-F6 | ⬜ |
| 11 | P4 | Error/empty states: F7-F11 | ⬜ |
| 12 | P4 | Error/empty states: F12-F16 | ⬜ |
| 13 | P4 | Error/empty states: F17-F24 | ⬜ |
| 14 | P4 | Error/empty states: F25-F37 | ⬜ |
| 15 | P5 | Copy fixes: customer flows | ⬜ |
| 16 | P5 | Copy fixes: provider flows | ⬜ |
| 17 | P5 | Copy fixes: admin flows + icon/variant sweep | ⬜ |
| 18 | P6 | Documentation sync | ⬜ |
