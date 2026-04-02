# Batch 3: New Homeowner Handoff Edge Function

## Phase
Phase 3 — New Homeowner Warm Handoff

## Review: Quality

## Size: Small

## What
Edge function that processes property transitions with new homeowner info. Creates a customer lead for the new homeowner with context about the property's service history.

## Requirements

### Edge Function: process-new-homeowner-handoff
1. Auth: requireAdminOrCron
2. Input: { transition_id } OR process all unhandled transitions
3. For each transition with new_owner_email or new_owner_phone:
   - Query the property's subscription for service categories
   - Insert customer_lead with source='referral'
   - Update transition with a flag indicating handoff was processed
4. Return count of processed handoffs

### Migration
- Add `handoff_processed` boolean column to property_transitions

## Acceptance Criteria
- [ ] Edge function processes transitions with new homeowner info
- [ ] Customer lead created for new homeowner
- [ ] handoff_processed flag set after processing
- [ ] Returns count

## Files Changed
- `supabase/migrations/20260402500000_handoff_processed_flag.sql` (new)
- `supabase/functions/process-new-homeowner-handoff/index.ts` (new)
