# Batch 7: Referral Attribution Trigger

## Phase
Phase 4 — Referral Attribution & Incentive Messaging

## Review: Quality

## Size: Small

## What
Auto-match referred providers when they submit an application. Update referral status to 'applied'. Add referral count + incentive messaging to the post-application screen.

## Requirements

### Migration
1. Database function: on provider_application insert, query provider_referrals by matching referred_contact against user email
2. Update matching referral status to 'applied'

### Apply.tsx
1. Add referral count query: count of provider_referrals where referrer_email matches current user
2. Show count on post-application status screen: "You've referred X providers"
3. Add incentive messaging: "Refer 3+ providers to get priority review"

## Acceptance Criteria
- [ ] Trigger matches new applications to existing referrals
- [ ] Referral status auto-updates to 'applied' on match
- [ ] Post-application screen shows referral count
- [ ] Incentive messaging visible

## Files Changed
- `supabase/migrations/20260401700000_referral_attribution.sql` (new)
- `src/pages/provider/Apply.tsx` (edit)
