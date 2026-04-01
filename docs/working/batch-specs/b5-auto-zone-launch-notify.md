# Batch 5: Automated Zone Launch Notification Trigger

## Phase
Phase 3 — Automated Zone Launch Notifications

## Review: Quality

## Size: Small

## What
When a zone's status changes to 'active' (soft_launch or live), automatically mark matching provider leads as notified. Add notified_at timestamp for tracking.

## Requirements

### Migration
1. Add `notified_at` column (timestamptz) to `provider_leads`
2. Create function `auto_notify_zone_leads()`:
   - Fires on zones UPDATE when status changes to 'active' or status column changes
   - Gets the zone's zip_codes
   - Matches provider_leads where zip_code is in those ZIPs and status = 'new'
   - Updates matching leads: status → 'notified', notified_at → now()
3. Create trigger on `zones` table for status changes

### Why a direct SQL trigger (not edge function call)
- No network hop needed — runs in the same transaction
- The edge function is still available for manual admin triggering
- Simpler and more reliable than pg_cron polling

## Acceptance Criteria
- [ ] notified_at column added to provider_leads
- [ ] Trigger fires on zones.status update
- [ ] Only fires when status changes (not on every update)
- [ ] Matches leads by ZIP and updates status + notified_at
- [ ] No error if no matching leads

## Files Changed
- `supabase/migrations/20260401600000_auto_notify_zone_leads.sql` (new)
