# Batch 4: Household Invite Flow

## Phase
Phase 2 — Household Members

## Review: Quality

## Size: Medium

## What
Owner can invite members by email. An RPC auto-accepts pending invites when a user's email matches. Hook triggers acceptance on customer page load.

## Requirements

### RPC: accept_household_invites
1. Takes no params — uses auth.uid() + auth.email()
2. Finds pending household_members rows matching the user's email
3. Sets user_id, status='active' on matching rows
4. Returns count of accepted invites

### useHouseholdInvites hook
1. Called on customer page load (in PropertyGate or dashboard)
2. Calls accept_household_invites RPC once per session
3. If invites accepted, invalidates property queries

### Customer Settings: Invite form
1. Simple email input + "Invite" button in Settings page
2. Inserts pending household_members row with invite_email
3. Toast confirmation: "Invite sent to [email]"
4. Note: no actual email sent yet — just creates the DB row. When the invitee logs in, auto-accepted.

## Acceptance Criteria
- [ ] RPC auto-accepts pending invites for current user
- [ ] Hook calls RPC on customer page load
- [ ] Settings page has invite form
- [ ] Pending invite created on owner action
- [ ] Build passes

## Files Changed
- `supabase/migrations/20260402100000_accept_household_invites.sql` (new)
- `src/hooks/useHouseholdInvites.ts` (new)
- `src/pages/customer/Settings.tsx` (edit — add household section)
