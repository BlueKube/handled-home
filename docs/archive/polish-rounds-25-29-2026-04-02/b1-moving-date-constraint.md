# Batch 1: Moving Date Validation + Customer Leads Constraint + STATUS_COLORS

## Phase
Round 16: Moving Wizard & Customer Leads

## Review: Quality

## Scope
3 files:
- `src/pages/customer/Moving.tsx` — add min date to prevent past move dates
- `supabase/migrations/` — NEW migration to add 'notified' to customer_leads CHECK
- `src/components/admin/leads/types.ts` — add 'subscribed' to STATUS_COLORS

## Changes
1. Add `min` attribute on date input set to today's date
2. Migration: ALTER TABLE customer_leads DROP old CHECK, ADD new CHECK including 'notified'
3. Add 'subscribed' status color to STATUS_COLORS

## Acceptance Criteria
- [ ] Date input prevents selection of past dates
- [ ] Migration adds 'notified' to customer_leads status CHECK
- [ ] STATUS_COLORS includes color for 'subscribed' status
