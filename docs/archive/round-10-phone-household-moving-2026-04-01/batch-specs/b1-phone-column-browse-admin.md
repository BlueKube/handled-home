# Batch 1: Phone Column on provider_leads + Browse Form + Admin Display

## Phase
Phase 1 — Phone as Provider Identity Bridge

## Review: Quality

## Size: Small

## What
Add phone number as an optional field to the provider lead capture pipeline — database, browse page form, admin display, and localStorage for returning visitors.

## Requirements

### Migration
1. Add `phone` column (text, nullable) to `provider_leads`

### ProviderBrowse.tsx
1. Add optional phone input field between email and ZIP in the lead capture form
2. Include phone in the upsert payload
3. Include phone in localStorage data for returning visitor display

### ProviderLeads.tsx (Admin)
1. Add `phone` to the Lead type
2. Add phone column to the leads table (between email and ZIP)

## Acceptance Criteria
- [ ] Migration adds phone column to provider_leads
- [ ] Browse page lead form has optional phone field
- [ ] Phone included in upsert to provider_leads
- [ ] Phone stored in localStorage for returning visitors
- [ ] Admin leads table shows phone column
- [ ] TypeScript compiles, build passes

## Files Changed
- `supabase/migrations/20260401800000_provider_leads_phone.sql` (new)
- `src/pages/ProviderBrowse.tsx` (edit)
- `src/pages/admin/ProviderLeads.tsx` (edit)
