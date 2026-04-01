# Full Implementation Plan: Round 10 — Phone Identity, Household Members & Moving Wizard

> **Created:** 2026-04-01
> **Purpose:** Three interconnected improvements that strengthen user identity, enable multi-person households, and turn the churn moment (moving) into a retention and referral opportunity.

---

## Context

The app is mobile-first, but identity is email-only. Providers may use different emails for personal/business, making lead matching unreliable. Customers can't share access with family members. And when a customer moves, they simply cancel — losing both the customer and the property.

### What exists today
- `profiles` table has a `phone` column (exists but unused in matching)
- `properties` table is 1:1 with `user_id` (no shared access)
- `subscriptions` have `cancel_at_period_end` for graceful cancellation
- `provider_orgs` + `provider_org_members` model works well for provider teams
- `provider_leads` and `provider_referrals` match on email only
- Account deletion anonymizes profile and cancels subscriptions

### Strategy
1. **Phase 1** activates phone as a matching/dedup identifier across the provider funnel
2. **Phase 2** builds household membership so multiple people can manage one home
3. **Phase 3** builds the "I'm moving" wizard that converts churn into retention + referral
4. **Phase 4** doc sync

---

## Phase 1: Phone as Provider Identity Bridge

**Problem:** Provider leads, referrals, and applications match on email only. A provider might be referred by phone number but sign up with email — the attribution is lost. The `profiles.phone` column exists but isn't used for matching.

**Goals:**
1. Add phone collection to the provider browse lead capture form and application flow
2. Use phone as a secondary matching key in lead-to-application linking and referral attribution triggers
3. Add phone display to the admin Provider Leads page

**Scope:**
- Add `phone` column to `provider_leads` table
- Update ProviderBrowse.tsx lead capture form to include optional phone field
- Update Apply.tsx application flow step 2 (Location) to collect phone number and save to profile
- Update `link_application_to_lead` trigger to match on phone OR email
- Update `attribute_referral_on_application` trigger to match `referred_contact` against phone OR email
- Add phone column to admin ProviderLeads table

**Estimated batches:** 2 (S)

---

## Phase 2: Household Members

**Problem:** Only one person per household can see the service schedule, approve changes, or contact support. Spouses and household members are locked out unless they share credentials.

**Goals:**
1. Create a `household_members` table linking multiple auth users to one property
2. Build an invite flow: property owner sends invite → household member signs up or links existing account
3. Household members can view services, schedule, and service history
4. Only the owner can manage billing and cancel

**Scope:**
- Migration: `household_members` table (property_id, user_id, role: owner/member, invited_by, status, created_at)
- RLS: members can read their own household, owner can insert/delete members
- Property access gate: extend PropertyGate to allow household members (not just property owner)
- Invite flow: owner enters email/phone → generates invite → recipient accepts → linked to property
- Customer dashboard: "Household" section in settings showing members + invite button
- Adjust subscription queries to check household membership (member can view but not modify billing)

**Estimated batches:** 4 (S-M)

---

## Phase 3: "I'm Moving" Wizard

**Problem:** When a customer moves, they cancel their subscription and Handled Home loses both the customer and the property permanently. There's no mechanism to retain the customer at their new address or capture the new homeowner.

**Goals:**
1. "I'm moving" trigger in settings with move date and new address capture
2. If new ZIP is covered: offer seamless plan transfer to new address
3. If new ZIP is not covered: save as a customer lead, notify on zone launch
4. Prompt: "Know who's buying your home?" — capture new homeowner contact for warm handoff
5. Auto-pause/cancel old property services on move date

**Scope:**
- Migration: `property_transitions` table (property_id, old_owner_user_id, new_owner_contact_name, new_owner_contact_email, new_owner_contact_phone, move_date, new_address, new_zip, new_zip_covered, status, notify_on_launch, created_at)
- Migration: `customer_leads` table (email, phone, zip_code, source, status, notify_on_launch, created_at) — mirrors provider_leads pattern for customer-side
- New page: `/customer/moving` — 4-step wizard:
  - Step 1: Move date + "Keep services until then?" toggle
  - Step 2: New address + ZIP → zone coverage check
  - Step 3: Coverage result → transfer plan OR save as lead
  - Step 4: "Know who's buying?" → new homeowner referral form
- Settings page: add "I'm moving" button
- Cancel flow intercept: "Are you moving?" before confirming cancellation
- Edge function or trigger: on move_date, auto-pause old property subscription
- When new zone launches: notify customer leads (reuse provider notification pattern)

**Estimated batches:** 5 (S-M)

---

## Phase 4: Doc Sync

**Estimated batches:** 1 (Micro)

---

## Execution Order

1. **Phase 1** — Phone identity (foundation — improves all matching)
2. **Phase 2** — Household members (enables shared access)
3. **Phase 3** — Moving wizard (retention + referral)
4. **Phase 4** — Doc sync

**Estimated total:** 12 batches across 4 phases

---

## Success Criteria

1. Provider leads and referrals can be matched by phone OR email
2. Multiple household members can view services for one property
3. Property owner can invite household members via email or phone
4. "I'm moving" wizard captures move date, new address, and new homeowner contact
5. Customers in covered zones get seamless plan transfer
6. Customers in uncovered zones are saved as leads and notified on zone launch
7. New homeowner referral creates a warm handoff opportunity
