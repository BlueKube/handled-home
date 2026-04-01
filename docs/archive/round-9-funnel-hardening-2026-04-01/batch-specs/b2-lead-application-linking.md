# Batch 2: Lead-to-Application Linking Trigger

## Phase
Phase 1 — Data Integrity & Lead-Application Linking

## Review: Quality

## Size: Small

## What
When a provider submits an application, auto-link it to their lead record (if one exists) and update the lead status to "applied".

## Requirements

### Migration
1. Add `provider_lead_id` column (uuid, nullable FK) to `provider_applications`
2. Create a database function `link_application_to_lead()` that:
   - Gets the applicant's email from auth.users via user_id
   - Matches against provider_leads.email
   - If found: updates lead status to 'applied', sets provider_applications.provider_lead_id
3. Create a trigger on provider_applications INSERT that calls this function

### Why a trigger (not application-level code)
- The hook `useProviderApplication` doesn't know about leads
- A trigger ensures the link happens regardless of how the application is created
- Keeps the linking logic in one place

## Acceptance Criteria
- [ ] Migration adds provider_lead_id FK column
- [ ] Trigger fires on provider_applications insert
- [ ] Trigger matches applicant email to provider_leads
- [ ] Lead status updated to 'applied' on match
- [ ] provider_lead_id set on the application row
- [ ] No crash if no matching lead exists

## Files Changed
- `supabase/migrations/20260401400000_link_application_to_lead.sql` (new)
