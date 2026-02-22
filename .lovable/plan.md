

# Documentation Alignment Update

The codebase has built through Module 11, but most docs still say "Current Focus: Module 06." This update brings everything current and incorporates the strategic framing from your ChatGPT analysis.

---

## 1. Update `docs/implementation-plan.md`

Move Modules 06-11 into the "Completed" table. Update "Current Focus" to Module 12 (Support and Disputes). Add notes reflecting what was actually built in each module:

| Module | Name | Notes |
|--------|------|-------|
| 06 | Service Day System | Zone-based assignment, offer/accept/reject, TTL cleanup, capacity checks |
| 07 | Bundle Builder | SKU stacking per service week, cadence picker, 4-week preview, seasonal boosts |
| 08 | Provider Onboarding | Org creation, invite flow, zone coverage, capability matching, compliance |
| 09 | Job Execution | Checklist enforcement, photo capture, server-validated completion, exception handling |
| 10 | Customer Dashboard and Proof | Visit timeline, photo gallery, structured issue reporting, 4-week preview |
| 11 | Billing and Payouts | Ledger-first billing, Stripe Connect payouts, webhook processing, admin exception queue |

Remaining MVP becomes empty (all 01-09 done). Post-MVP updates 10-11 to completed.

---

## 2. Update `docs/masterplan.md` Roadmap section

Replace the Roadmap section to reflect actual progress:

- **Completed:** Modules 01-11
- **Current focus:** Module 12 (Support and Disputes)
- **Remaining:** Modules 13-14 (Referrals, Reporting)

Add a new "Launch Scoreboard" section (from ChatGPT's strategic analysis) under the Roadmap, capturing the weekly metrics that prove the flywheel:

- Service Day offer acceptance rate
- Offer expiry rate (target: near zero)
- Photo compliance % (target: 95%+)
- On-time completion % (target: 90%+)
- Redo rate baseline
- Support minutes per job (target: under 3 min)
- Zone density: stops/day + minutes/stop

These already align with the existing Launch Readiness Criteria in `implementation-plan.md` but frame them as ongoing operational metrics rather than one-time gates.

---

## 3. Update `docs/app-flow-pages-and-roles.md`

This file is significantly outdated. Update to reflect all pages that now exist:

**Customer pages** -- add:
- Billing Overview, Payment Methods, Billing History, Receipt Detail
- Service Day (assignment/offer flow)
- Routine Builder, Routine Review, Routine Confirm
- Visit Detail

**Provider pages** -- replace "Earnings" with:
- Payouts Overview, Payout History
- Onboarding (org, coverage, capabilities, compliance, review)
- Job Checklist, Job Photos, Job Complete
- SKUs (authorized services)

**Admin pages** -- add:
- Service Days, Capacity
- Billing, Payouts, Exceptions
- Customer Ledger, Provider Ledger
- Subscriptions, Bundles, Scheduling
- Provider Detail, Job Detail

**Primary Journeys** -- add:
- Customer billing fix flow (failed payment CTA)
- Provider payout onboarding (Stripe Connect)
- Admin exception triage (billing exceptions queue)

---

## 4. Update `docs/global-system-architecture.md`

### Section 5: Add billing/payout state machines

- **Invoice status:** UPCOMING -> DUE -> PAID / FAILED / VOID
- **Payment status:** INITIATED -> SUCCEEDED / FAILED
- **Earning status:** EARNED -> ELIGIBLE -> IN_PAYOUT -> PAID (with HELD / HELD_UNTIL_READY branches)
- **Payout status:** INITIATED -> PAID / FAILED
- **Hold status:** ACTIVE -> RELEASED / EXPIRED

### Section 6: Update Financial schema spine

Replace the minimal 4-table list with the actual Module 11 tables:
- customer_payment_methods, customer_invoices, customer_invoice_line_items, customer_payments, customer_ledger_events, customer_credits
- provider_payout_accounts, provider_earnings, provider_payouts, provider_payout_line_items, provider_holds, provider_hold_context, provider_ledger_events
- payment_webhook_events, billing_runs, payout_runs, admin_adjustments, billing_exceptions

### Section 7: Add billing rules to rules engine

- Invoice generation (cycle-based, idempotent)
- Dunning retry schedule
- Earning hold/release logic
- Payout threshold + eligibility transition
- Credit application (capped to invoice total)

---

## 5. Remove duplicate Module 10 spec

`docs/modules/10-visit-tracking-photos.md` was already replaced with a redirect note (previous fix). Confirm it still just contains the redirect. No action needed if so.

---

## 6. Add strategic notes to masterplan

Under "What We Optimize For," add the three strategic bets as explicit decisions (from the ChatGPT analysis):

1. **Launch SKU count:** 3-5 per zone until density + proof compliance is stable
2. **Default routine is primary path:** Recommended routine and auto-fit are the main flow, not a side feature
3. **Seasonal complexity boundary:** Window preference (early/mid/late month) only, no date-level scheduling

These are already implied by the specs but making them explicit prevents drift.

---

## Summary of file changes

| File | Change |
|------|--------|
| `docs/implementation-plan.md` | Move modules 06-11 to completed, update current focus to 12 |
| `docs/masterplan.md` | Update roadmap progress, add Launch Scoreboard section, add 3 strategic bets |
| `docs/app-flow-pages-and-roles.md` | Full rewrite reflecting all implemented pages and journeys |
| `docs/global-system-architecture.md` | Add billing state machines, update financial schema spine, expand rules engine |
| `docs/modules/10-visit-tracking-photos.md` | Verify redirect note is in place (no change expected) |

No code changes. Documentation only.
