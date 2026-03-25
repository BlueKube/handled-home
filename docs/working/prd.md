# PRD: Screen-Flows Implementation Gap Closure

## Execution Mode
**Speed mode** — Reduced 4-agent review (Lanes 1 + 2 only, Sonnet tier only, no synthesis). These are conformance fixes aligning existing code with existing specs. Max 2 fix passes then move on.

## Problem Statement

A full audit of `docs/screen-flows.md` against the codebase revealed **116 gaps** where the implemented UI diverges from the documented spec. These range from critical missing features (hero photos not rendered, Stripe integration stubbed, interactive maps absent) to medium-severity issues (missing error/empty states, copy mismatches) and low-severity cosmetic gaps (icon choices, button variants).

Leaving these gaps open means the screen-flows doc — the single source of truth for design — cannot be trusted. Every new feature built on top of inaccurate assumptions compounds drift.

## Goals

1. Close all HIGH-severity gaps (23 items) — these represent broken or missing functionality
2. Close all MED-severity gaps (~50 items) — these represent missing states and copy mismatches that degrade UX quality
3. Close LOW-severity gaps opportunistically when touching the same file
4. After completion, screen-flows.md and the codebase should be in sync

## Non-Goals

- Redesigning screens beyond what the spec defines
- Adding new features not in screen-flows.md
- Changing the screen-flows.md spec itself (the spec is the source of truth)
- Backend/API changes — only frontend UI alignment

## Success Criteria

- All HIGH gaps resolved
- All MED gaps resolved
- `npm run build` passes after every batch
- No regressions in existing functionality

## Gap Inventory

### HIGH Priority (23 items)

| # | Flow | Gap |
|---|------|-----|
| 1 | F4 Share Landing | Hero photo never rendered — placeholder icon only |
| 2 | F5 Onboarding Step 3 | `catch {}` silently swallows errors |
| 3 | F5 Onboarding Steps 4-5 | No skip option — blocks users who want to defer |
| 4 | F7 Dashboard | Rollover handles badge missing from HandleBalanceBar |
| 5 | F8 Plan Detail | Fixed bottom CTA bar missing — uses inline non-fixed buttons |
| 6 | F9 Routine Review | Cost Breakdown section entirely missing |
| 7 | F11 Schedule | Visit cards not tappable — no onClick/navigation to detail |
| 8 | F13 Billing | Stripe Elements card collection is a stub |
| 9 | F13 Billing | "Set as default" payment method not implemented |
| 10 | F17 Onboarding | All 6 steps missing visual progress bar with accent fill |
| 11 | F17 Onboarding | Coverage zones: no interactive map (list-only) |
| 12 | F19 Job List | "Start Next Job" primary CTA absent |
| 13 | F19 Job Complete | Earnings: only total shown, no base + modifier breakdown |
| 14 | F21 Earnings | No "Set Up Payout Account" button when account not ready |
| 15 | F23 Coverage | No zone map — list-only, same as onboarding |
| 16 | F24 Support | Providers cannot create support tickets |
| 17 | F24 Support Detail | Duplicate resolution_summary card rendered twice (bug) |
| 18 | F26 Provider Detail | No earnings/payout section or link to Provider Ledger |
| 19 | F29 Billing | `/admin/billing/customers` route linked but not registered |
| 20 | F29 Payouts | No payout schedule view; no nav to Provider Ledgers |
| 21 | F30 Support | No ticket assignment UI; no bulk actions |
| 22 | F30 Ticket Detail | Attachments fetched but never rendered |
| 23 | F31 Bundle Savings | Missing CTA button, dismiss, all 4 states |

### MED Priority (~50 items)

Grouped by theme:

**Missing error/empty states (~25 items):** Nearly every flow is missing spec-compliant error and empty states. Affected flows: F2, F2B, F5, F7, F8, F9, F10, F11, F14, F15, F17, F18, F19, F20, F21, F22, F23, F24, F25-F30, F32-F34, F37.

**Copy mismatches (~15 items):** Text diverges from spec across: F2 BYOC caption, F8 subscription title/empty, F11 schedule error, F13 billing empty states, F14 support empty states, F15 referral empty states, F16 notifications empty state, F17 onboarding toasts, F19 job list empty/tabs, F22 quality/insights titles, F23 coverage/SKU empty states, F24 support/referral empty states.

**Missing UI elements (~10 items):** F5 progress bar label suppression, F6 plan pre-selection from invite, F11 rollover line in ThisCycleSummary, F12 property error state, F15 explainer text, F16 notifications max-w constraint, F19 job photos before/after slots, F19 notes char limit, F30 K-factor summary, F37 milestones CTA/dismiss.

### LOW Priority (~25 items)

Icon mismatches, button variant differences, minor copy casing, ArrowLeft vs ChevronLeft, extra content beyond spec. These will be fixed opportunistically when touching the same files.

## Constraints

- Mobile-first: all customer/provider changes must work at 390×844
- No `max-w-*` on customer/provider pages
- All changes must use semantic color tokens
- Dark mode must work
- 44px minimum touch targets
- `pb-24` for bottom tab bar clearance on customer/provider pages
