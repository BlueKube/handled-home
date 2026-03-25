# Batch 3: Schedule Tappable Visit Cards + ThisCycleSummary Rollover Line

## Phase
Phase 1: Critical Bugs & Blocking UX (HIGH priority, customer-facing)

## Why it matters
Visit cards on the Schedule page are not tappable — users cannot navigate to visit details by tapping a card. This is the #1 reason customers open the app ("When is my next service?") and they expect to tap through. The ThisCycleSummary also lacks the rollover handles line, which reinforces the value proposition.

Note: F13 Billing (Stripe stub + set-as-default) is deferred to human action per docs/working/deferred-items-for-human.md.

## Scope
1. **F11 Schedule visit cards tappable** — Make entire visit Card clickable, navigating to `/customer/visits/:jobId`
2. **F11 ThisCycleSummary rollover line** — Add "+X rolled over from last cycle" caption when rollover handles exist

## Non-goals
- Changing visit card layout or content
- Adding appointment booking flows
- F13 Billing changes (deferred)

## File targets
| Action | File |
|--------|------|
| Modify | src/pages/customer/Schedule.tsx |
| Modify | src/components/customer/ThisCycleSummary.tsx |

## Acceptance criteria
- [ ] Visit cards have onClick that navigates to `/customer/visits/${visit.id}` (where visit has a job_id)
- [ ] Card has cursor-pointer and hover state for discoverability
- [ ] Nested buttons (Book Appointment, Reschedule) use stopPropagation to prevent double navigation
- [ ] ThisCycleSummary shows "+X rolled over from last cycle" in accent color (12px) below handles bar when rollover > 0
- [ ] ThisCycleSummary accepts optional `rollover` prop
- [ ] `npm run build` passes

## Regression risks
- Visit cards with only "pending" tasks might not have a valid job_id — need to guard navigation
- stopPropagation on nested buttons already exists (confirmed in code)

## Visual validation checklist
- [ ] Tapping visit card navigates to visit detail
- [ ] Card shows hover/active state
- [ ] Nested buttons still work independently
- [ ] Rollover line shows accent text below handles bar
