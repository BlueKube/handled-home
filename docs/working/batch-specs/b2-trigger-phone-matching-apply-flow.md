# Batch 2: Update Triggers for Phone Matching + Apply Flow Phone Collection

## Phase
Phase 1 — Phone as Provider Identity Bridge

## Review: Quality

## Size: Small

## What
Update the lead-linking and referral attribution triggers to match on phone OR email. Add phone collection to the application flow and save to the user's profile.

## Requirements

### Migration: Update link_application_to_lead
1. Get applicant's phone from profiles table (in addition to email from auth.users)
2. Match provider_leads by email OR phone
3. Priority: email match first, then phone match

### Migration: Update attribute_referral_on_application
1. Get applicant's phone from profiles
2. Match referred_contact against email OR phone

### Apply.tsx
1. Add phone input to Step 2 (Location & Coverage) — between home base ZIP and service ZIPs
2. On step 2 completion, save phone to profiles table if provided

## Acceptance Criteria
- [ ] link_application_to_lead matches on email OR phone
- [ ] attribute_referral_on_application matches on email OR phone
- [ ] Apply.tsx step 2 has phone input
- [ ] Phone saved to profiles on step completion
- [ ] Build passes

## Files Changed
- `supabase/migrations/20260401900000_triggers_phone_matching.sql` (new)
- `src/pages/provider/Apply.tsx` (edit)
