# Batch 2 — Cross-Module Consistency Fixes

> **Review:** Quality (Lane A: Senior Editor + Lane B: Fact Checker + Lane C: Synthesis)
> **Size:** Medium
> **Files:** `provider-lifecycle.ts`, `provider-payouts.ts`, `control-room.ts`, `ops-cockpit.ts`, `sops-playbooks.ts`, `exception-management.ts`

---

## R2.1 — Stripe assignment blocking is manual discipline

**Problem:** `provider-lifecycle.ts` says "Don't assign jobs until Stripe is ACTIVE" and `provider-payouts.ts` says earnings "accumulate but don't transfer." Neither states whether the system blocks assignment or if this is manual operator discipline.

**Fix:** Add a clarifying sentence to `provider-lifecycle.ts` (the onboarding walkthrough) explicitly stating: the system does not prevent job assignment for providers without active payout accounts — this is a manual discipline. The operator must check payout status before assigning.

---

## R2.2 — Customer price vs provider payout distinction

**Problem:** `ops-cockpit.ts` cites "$49–$203 per lawn mowing visit" (customer-facing price) and `control-room.ts` cites "$45–$65/job range" (provider payout). These appear in different modules without the customer-price vs provider-payout framing, and a reader moving between modules could conflate them.

**Fix:** Add a parenthetical clarification in each module:
- `ops-cockpit.ts`: "(customer-facing price range)" after the $49–$203 figure
- `control-room.ts`: "(provider payout range — not the customer price)" after the $45–$65 figure

---

## R2.3 — Probation trigger mechanism

**Problem:** `provider-lifecycle.ts` uses count-based rules (2+ no-shows in 30 days). The actual Playbooks page (`Playbooks.tsx`) uses a points-based system with score thresholds. These are described as if they're the same system.

**Fix:** Check the actual `Playbooks.tsx` to determine which system is real. Update the training content in both modules to describe the actual system accurately. If the Playbooks page uses points and the provider-lifecycle module uses counts, reconcile by describing one as the scoring mechanism and the other as the practical shorthand.

---

## R2.4 — Exception Analytics navigation path

**Problem:** `exception-management.ts` references "the Exception Analytics page (accessed from Ops Cockpit or Execution menu)" but `ops-cockpit.ts` never mentions exception analytics as an accessible drill-down.

**Fix:** Check if Exception Analytics exists as a real page. If it does, add a brief mention in `ops-cockpit.ts` telling operators where to find it. If it doesn't exist as a standalone page, correct the reference in `exception-management.ts`.

---

## Acceptance Criteria

- Each fix verified against the actual codebase (not assumed)
- Cross-module references are now bidirectional and consistent
- No new type errors or build failures
