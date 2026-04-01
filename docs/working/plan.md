# Round 10 — Phone Identity, Household Members & Moving Wizard

## Current Phase: Phase 1 — Phone as Provider Identity Bridge

### Phase Summary
Activate the phone number as a matching/dedup identifier across the provider funnel. Add phone collection to leads and application flow, update triggers to match on phone OR email.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | phone column on provider_leads + browse form + admin display | S | ✅ | 26% |
| B2 | Update triggers to match on phone OR email + apply flow phone collection | S | ✅ | 27% |

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

---

## Current Phase: Phase 2 — Household Members

### Phase Summary
Enable multiple auth users per property with owner/member roles, invite flow, and shared access to services.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B3 | household_members table + RLS | S | ⬜ | |
| B4 | Invite flow: owner invites member by email | M | ⬜ | |
| B5 | Extend PropertyGate for household members | S | ⬜ | |
| B6 | Settings page Household section + member list | S | ⬜ | |

### Batch Details

**B3: household_members table + RLS**
- Migration: household_members table (property_id, user_id, role, invited_by, invite_email, status, created_at)
- RLS: household members read own household, owner manages membership
- Auto-insert owner row when property is created (trigger)

**B4: Invite flow**
- Accept invite page/logic: invited user signs up or logs in → linked to property
- Owner enters email → creates pending household_members row
- Invite acceptance: match by email on signup/login

**B5: Extend PropertyGate for household members**
- Current PropertyGate checks: does user own a property?
- New check: is user an owner OR member of any property?
- Subscription queries also need household-aware access

**B6: Settings page Household section**
- Customer Settings: "Household" card showing members + invite button
- Inline invite form (email input + "Invite" button)
- Member list with role badges and remove option (owner only)

---

## Session Handoff
- **Branch:** claude/provider-conversion-funnel-N3IE5
- **Last completed:** B2 (Phase 1 complete)
- **Next up:** B3 — household_members table + RLS
- **Context at exit:** 27%
- **Blockers:** None
- **Round progress:** Phase 1 of 4 complete, starting Phase 2
