# Batch 1: process_move_date_transitions Function

## Phase
Phase 1 — Subscription Pause on Move Date

## Review: Quality

## Size: Small

## What
Database function that auto-cancels subscriptions when a customer's move date arrives. Designed to be called daily by pg_cron or an edge function.

## Requirements

### Function: process_move_date_transitions
1. Find property_transitions where: move_date <= CURRENT_DATE, status = 'planned', keep_services_until_move = true
2. For each transition: find the subscription for that property, set cancel_at_period_end = true + status = 'canceling'
3. Update transition status to 'completed'
4. Return count of processed transitions

### Edge function wrapper
- `process-move-transitions` edge function with requireCronSecret auth
- Calls the database function
- Returns JSON with count

## Acceptance Criteria
- [ ] Database function processes due transitions
- [ ] Subscriptions set to cancel_at_period_end
- [ ] Transition status updated to 'completed'
- [ ] Edge function callable by cron

## Files Changed
- `supabase/migrations/20260402300000_process_move_transitions.sql` (new)
- `supabase/functions/process-move-transitions/index.ts` (new)
