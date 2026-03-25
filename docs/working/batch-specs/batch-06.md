# Batch 6 — F19 Job List CTA + Job Complete Earnings Breakdown + Notes Limit

## Scope
Three fixes on provider job flow pages per screen-flows.md F19.

## Requirements

### 1. "Start Next Job" CTA on Job List (F19 Screen 19.1)
- Full-width accent lg button at bottom of Today tab: "Start Next Job"
- Navigates to first incomplete job (status ≠ COMPLETED/CANCELED)
- Hidden when all today's jobs are complete or no jobs exist

### 2. Earnings Breakdown on Job Complete (F19 Screen 19.5)
- Currently shows only `total_cents` as a single line
- Spec requires: "base pay + modifier breakdown with formatCents"
- DB has `base_amount_cents` and `modifier_cents` on `provider_earnings`
- Show itemized: Base: $X, Modifiers: +$Y, Total: $Z

### 3. Notes Character Limit (F19 Screen 19.5)
- Currently 240 chars — spec requires 500
- Label should be "Notes (optional)" not "Summary (optional)"

## Files to Modify
- `src/pages/provider/Jobs.tsx` — Add "Start Next Job" CTA to Today tab
- `src/pages/provider/JobComplete.tsx` — Earnings breakdown + notes limit + label

## Acceptance Criteria
- [ ] "Start Next Job" accent button on Today tab, navigates to first incomplete job
- [ ] Button hidden when no incomplete jobs
- [ ] Earnings shows base + modifier breakdown (not just total)
- [ ] Notes textarea accepts 500 chars with correct counter
- [ ] Label reads "Notes (optional)"
- [ ] Build passes
