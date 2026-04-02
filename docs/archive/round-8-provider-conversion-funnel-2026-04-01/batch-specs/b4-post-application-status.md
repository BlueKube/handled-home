# Batch 4: Post-Application Status Screen — Category Gaps + Referral Form

## Phase
Phase 2 — Post-Application Zone Messaging

## Review: Quality

## Size: Medium

## What
Update the post-application status screen for waitlisted/submitted providers to show category gaps and a "Know someone?" referral form. Replace dead-end waitlist messaging with action-oriented content.

## Requirements

### Status Screen Updates (Apply.tsx lines 169-218)
1. For waitlisted/submitted status: show category gap information
2. Replace "On the waitlist" messaging with "We're building your zone"
3. Add "Know someone?" referral card below status
4. Referral form: referred name, contact (phone/email), category dropdown, ZIP auto-filled
5. Form saves to `provider_referrals` table via Supabase insert

### Category Gap Display
1. Show which categories are needed in the provider's zone(s)
2. Message: "We need providers in these categories to launch faster:"
3. Display as badge list

### Messaging Changes
- waitlisted: "We're building your zone" / "Help us launch faster by referring providers you trust"
- submitted: Keep "We're reviewing your application" but add category gap info below

## Acceptance Criteria
- [ ] Waitlisted status shows encouraging "building your zone" messaging
- [ ] Category gaps displayed for waitlisted and submitted providers
- [ ] "Know someone?" referral form with name, contact, category, zip
- [ ] Form saves to provider_referrals on submit
- [ ] Error handling with toast
- [ ] Form fields reset after successful submission

## Files Changed
- `src/pages/provider/Apply.tsx` (edit — status screen section)
