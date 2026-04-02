# Round 13: Phone Identity & Account Management Polish

> **Round:** 13 of 61
> **Branch:** `claude/polish-round-12-auth-nlfDe` (continuing on same branch per task instructions)
> **Phase:** Single phase — Phone Identity & Account Management (Features 436–441 + account deletion + password reset)
> **Execution mode:** Quality

---

## Features in Scope

436. Phone column on provider_leads
437. Browse page phone field
438. Admin phone display
439. Lead-to-application phone matching trigger
440. Referral attribution phone matching
441. Application flow phone collection
+ Account deletion flow
+ Password reset flow

---

## Audit Findings

### Issues Found

| # | Issue | Severity | File | Feature |
|---|-------|----------|------|---------|
| 1 | No phone validation on Browse page lead capture | SHOULD-FIX | ProviderBrowse.tsx:307-310 | F437 |
| 2 | No phone validation on Apply page | SHOULD-FIX | Apply.tsx:339-344 | F441 |
| 3 | Profile phone update has no error handling | SHOULD-FIX | Apply.tsx:392-399 | F441 |
| 4 | Inconsistent phone regex across codebase (3 patterns) | SHOULD-FIX | ProfileForm, Organization, none on Browse/Apply | All |
| 5 | ProviderLeads.tsx is 604 lines — over 300 threshold | SHOULD-FIX | ProviderLeads.tsx | F438 |
| 6 | DeleteAccountDialog says "within 30 days" but RPC executes immediately | SHOULD-FIX | DeleteAccountDialog.tsx:51 | Deletion |
| 7 | Forgot password button has no loading state | MINOR | AuthPage.tsx:162-169 | Reset |

### Already Solid (No Changes Needed)

- Phone column migration on provider_leads ✓
- Phone properly optional on lead capture with null fallback ✓ 
- Admin phone display with "—" for null ✓
- Lead-to-application trigger matches email first, then phone ✓
- Referral attribution trigger handles null/empty phone ✓
- Delete account RPC properly anonymizes all fields ✓
- Delete confirmation requires "DELETE" typed ✓
- Password reset uses Supabase native flow ✓
- Dark mode colors on all admin tables ✓

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Phone validation utility + Browse/Apply fixes | S | 3 files | ⬜ | |
| B2 | ProviderLeads decomposition (604→<300 per file) | M | 4 files | ⬜ | |
| B3 | DeleteAccountDialog + AuthPage password reset polish | S | 2 files | ⬜ | |

---

## Session Handoff
- **Branch:** `claude/polish-round-12-auth-nlfDe`
- **Last completed:** Round 12 complete. Starting Round 13.
- **Next up:** B1 — Phone validation utility
- **Context at exit:** N/A
- **Blockers:** None
- **Round progress:** Phase 1 of 1 in progress
