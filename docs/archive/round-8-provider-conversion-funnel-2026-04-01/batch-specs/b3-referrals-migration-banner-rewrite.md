# Batch 3: provider_referrals Migration + Rewrite CLOSED Banner

## Phase
Phase 2 — Post-Application Zone Messaging

## Review: Quality

## Size: Small

## What
Create the `provider_referrals` table for provider-to-provider referrals. Rewrite the CLOSED and WAITLIST OpportunityBanner variants to never show negative/discouraging language.

## Requirements

### Table: provider_referrals
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| referrer_email | text | NOT NULL |
| referred_name | text | NOT NULL |
| referred_contact | text | NOT NULL |
| referred_category | text | NOT NULL |
| zip_code | text | NOT NULL |
| notes | text | |
| status | text | NOT NULL DEFAULT 'new', CHECK IN ('new', 'contacted', 'applied', 'declined') |
| created_at | timestamptz | DEFAULT now() |

### RLS
- Anon/authenticated insert
- Admin read/write

### OpportunityBanner Changes
1. Rename CLOSED variant to HELP_LAUNCH — icon: Megaphone, headline: "Help us launch in your area"
2. Body: "We're building our provider network in [zone]. Apply now and refer other providers you trust to help us launch faster."
3. Bullets: recruitment-focused
4. CTA: "Apply & help us launch"
5. Update WAITLIST to be more encouraging — "We're building momentum" instead of "not fully open"

## Acceptance Criteria
- [ ] Migration creates provider_referrals with all columns
- [ ] RLS policies match pattern from B1
- [ ] CLOSED variant replaced with HELP_LAUNCH — no negative language
- [ ] WAITLIST variant updated to be more positive
- [ ] BannerVariant type updated
- [ ] mapStateToBannerVariant updated to use HELP_LAUNCH instead of CLOSED

## Files Changed
- `supabase/migrations/20260401200000_provider_referrals.sql` (new)
- `src/components/provider/OpportunityBanner.tsx` (edit)
