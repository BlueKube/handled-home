# Batch 8: notify-zone-leads Edge Function

## Phase
Phase 4 — Zone Launch Notification Pipeline

## Review: Quality

## Size: Small

## What
Create an edge function that notifies matching provider leads when a zone launches. Marks leads as "notified" and returns the count.

## Requirements

### Edge Function: notify-zone-leads
1. Auth: requireAdminOrCron
2. Input: { zone_id: string } in request body
3. Logic:
   - Fetch zone's zip_codes from zones table
   - Query provider_leads where zip_code IN zone's zip_codes AND status = 'new'
   - Update matching leads' status to 'notified'
   - Return { notified_count, lead_emails }
4. Note: Actual email sending is deferred (TODO item) — this function just marks leads as notified

### CORS
- Standard CORS headers from _shared pattern

## Acceptance Criteria
- [ ] Edge function exists at supabase/functions/notify-zone-leads/index.ts
- [ ] Uses requireAdminOrCron auth
- [ ] Fetches zone ZIP codes and matches against provider_leads
- [ ] Updates matching leads to 'notified' status
- [ ] Returns count and list of notified emails
- [ ] Handles edge cases: no zone found, no matching leads

## Files Changed
- `supabase/functions/notify-zone-leads/index.ts` (new)
