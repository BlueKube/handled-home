# Batch 5: Fix BYOC Invite Enumeration + Auth Bootstrap + Seed Data

## Phase
Phase 1 — Edge Function Security Hardening

## Review: Quality

## Why it matters
BYOC invite links are enumerable by anonymous users (all active tokens exposed via RLS). The auth bootstrap allows client-side provider role self-assignment. Test users with known passwords are embedded in production migrations.

## Scope
1. **BYOC invite link RLS** — Drop the overly permissive anon SELECT policy. Add a restrictive policy that requires token match (via RPC parameter or session variable). Verify activate-byoc-invite still works.
2. **Auth bootstrap** — Remove `intended_role` from client-side AuthContext.tsx. Always pass `"customer"` to `bootstrap_new_user`. Provider role assignment flows through admin approval only.
3. **Seed data** — Extract test user inserts from migration `20260322000000_fix_test_users_and_seed_metro.sql` into `supabase/seed.sql`. Add a comment documenting that seed.sql is for dev/staging only.

## Non-goals
- Changing the BYOC activation Edge Function logic
- Changing the provider application/approval flow
- Modifying the bootstrap_new_user SQL function

## File targets
| Action | File |
|--------|------|
| Create | supabase/migrations/20260329000000_restrict_byoc_invite_rls.sql |
| Modify | src/contexts/AuthContext.tsx |
| Create | supabase/seed.sql |
| Modify | supabase/migrations/20260322000000_fix_test_users_and_seed_metro.sql |
| Modify | docs/upcoming/TODO.md |

## Acceptance criteria
- [ ] Anonymous users cannot enumerate BYOC invite links via direct table SELECT
- [ ] activate-byoc-invite function still works (uses get_byoc_invite_public RPC)
- [ ] AuthContext.tsx always passes "customer" to bootstrap_new_user
- [ ] No intended_role from user_metadata used in role assignment
- [ ] Test user inserts are in supabase/seed.sql, not in a production migration
- [ ] TODO.md updated with CRON_SECRET setup requirement

## Regression risks
- BYOC activation flow must be tested after RLS change
- Existing provider signups that relied on intended_role will now default to customer (correct behavior — providers should go through approval)
