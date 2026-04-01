# Round 10 — Phone Identity, Household Members & Moving Wizard

## Current Phase: Phase 1 — Phone as Provider Identity Bridge

### Phase Summary
Activate the phone number as a matching/dedup identifier across the provider funnel. Add phone collection to leads and application flow, update triggers to match on phone OR email.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | phone column on provider_leads + browse form + admin display | S | ⬜ | |
| B2 | Update triggers to match on phone OR email + apply flow phone collection | S | ⬜ | |

### Batch Details

**B1: phone column + browse form + admin display**
- Migration: add `phone` column (text, nullable) to `provider_leads`
- ProviderBrowse.tsx: add optional phone input to lead capture form, include in upsert
- ProviderLeads.tsx (admin): add phone column to leads table + Lead type
- localStorage lead data: include phone for returning visitor display

**B2: Trigger updates + apply flow phone collection**
- Update `link_application_to_lead` trigger: match on profiles.phone OR auth.users.email
- Update `attribute_referral_on_application` trigger: match referred_contact against phone OR email
- Apply.tsx step 2 (Location): add phone input, save to profiles.phone on submit
- Size: Small (2 migrations + 1 page edit)

### Dependencies
- B2 depends on B1 (phone column must exist for trigger matching)

---

## Session Handoff
- **Branch:** claude/provider-conversion-funnel-N3IE5
- **Last completed:** Round 9 complete, cleanup done
- **Next up:** B1 — phone column + browse form + admin display
- **Context at exit:** 26%
- **Blockers:** None
- **Round progress:** Phase 1 of 4, batch 0 of 2 complete
