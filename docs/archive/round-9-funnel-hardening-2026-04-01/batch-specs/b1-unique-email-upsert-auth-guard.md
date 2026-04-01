# Batch 1: Unique Email Constraint + Upsert + Auth Guard

## Phase
Phase 1 — Data Integrity & Lead-Application Linking

## Review: Quality

## Size: Small

## What
Prevent duplicate leads by adding a unique constraint on email and switching to upsert. Guard the referral form against missing auth context.

## Requirements

### Migration
1. Add unique index on `provider_leads.email`
2. Must handle existing duplicates: keep the most recent row per email before adding constraint

### ProviderBrowse.tsx
1. Change insert to upsert: `ON CONFLICT (email) DO UPDATE SET categories, zip_code, updated_at`
2. This means a returning lead who resubmits updates their categories/ZIP instead of creating a duplicate

### Apply.tsx ProviderReferralForm
1. Guard `user?.email` — if no auth context, use empty string and show the referral form anyway
2. The form should still work for unauthenticated edge cases (graceful degradation)

## Acceptance Criteria
- [ ] Migration adds unique index on provider_leads.email
- [ ] ProviderBrowse.tsx uses upsert instead of insert
- [ ] Re-submitting with same email updates existing row
- [ ] ProviderReferralForm doesn't crash when useAuth returns null
- [ ] TypeScript compiles, build passes

## Files Changed
- `supabase/migrations/20260401300000_provider_leads_unique_email.sql` (new)
- `src/pages/ProviderBrowse.tsx` (edit)
- `src/pages/provider/Apply.tsx` (edit)
