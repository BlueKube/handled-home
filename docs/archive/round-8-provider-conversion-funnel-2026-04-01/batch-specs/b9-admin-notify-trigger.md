# Batch 9: Admin Notify Trigger Button

## Phase
Phase 4 — Zone Launch Notification Pipeline

## Review: Quality

## Size: Small

## What
Add a "Notify Zone Leads" button on the admin ProviderLeads page that calls the notify-zone-leads edge function for a selected zone.

## Requirements
1. Zone selector on the By ZIP tab (dropdown of zones)
2. "Notify Leads in Zone" button that calls notify-zone-leads edge function
3. Show result: how many leads were notified
4. Refresh leads list after notification

## Acceptance Criteria
- [ ] Zone selector dropdown populated from zones table
- [ ] Notify button calls edge function with zone_id
- [ ] Success toast shows count of notified leads
- [ ] Leads list refreshes after notification
- [ ] Loading state while notifying

## Files Changed
- `src/pages/admin/ProviderLeads.tsx` (edit — ZipAggregationTab)
