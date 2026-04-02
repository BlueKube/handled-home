# Batch 8: Moving Wizard Page

## Phase
Phase 3 — "I'm Moving" Wizard

## Review: Quality

## Size: Medium

## What
Create the 4-step moving wizard at /customer/moving.

## Requirements

### Page: /customer/moving
Step 1: Move date + "Keep services until then?" toggle
Step 2: New address + ZIP → check zone coverage
Step 3: Coverage result → "Plan transfers!" OR "We'll notify you when we launch"
Step 4: "Know who's buying?" → new homeowner referral form

### Route
- /customer/moving in App.tsx

### Data flow
- Save property_transition on completion
- If new ZIP not covered: save customer_lead with source='moving'
- If new homeowner info provided: save to property_transition

## Acceptance Criteria
- [ ] 4-step wizard works end to end
- [ ] Zone coverage check on new ZIP
- [ ] property_transition saved on completion
- [ ] customer_lead saved if uncovered ZIP
- [ ] Route registered
- [ ] Build passes

## Files Changed
- `src/pages/customer/Moving.tsx` (new)
- `src/App.tsx` (edit — add route)
