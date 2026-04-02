# Batch 2: Customer Lead Zone Launch Notifications

## Phase
Phase 2 — Customer Lead Zone Launch Notifications

## Review: Quality

## Size: Small

## What
Mirror the provider lead auto-notify pattern for customer leads. When a zone launches, notify matching customer leads.

## Requirements

### Migration
1. Add `notified_at` (timestamptz) column to `customer_leads`
2. Create `auto_notify_customer_leads()` function — same pattern as `auto_notify_zone_leads()`
3. Trigger on `market_zone_category_state` AFTER UPDATE OF status
4. Match customer_leads by zip_code, status='new', update to 'notified' with notified_at

## Acceptance Criteria
- [ ] notified_at column added to customer_leads
- [ ] Trigger fires on zone status change to SOFT_LAUNCH/OPEN
- [ ] Matching customer leads updated to 'notified'
- [ ] No error if no matching leads

## Files Changed
- `supabase/migrations/20260402400000_customer_lead_zone_notify.sql` (new)
