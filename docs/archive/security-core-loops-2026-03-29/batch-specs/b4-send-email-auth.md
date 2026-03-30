# Batch 4: Restrict send-email + Fix Remaining Auth Issues

## Phase
Phase 1 — Edge Function Security Hardening

## Review: Quality

## Why it matters
send-email is an unauthenticated email relay — any external caller can send arbitrary HTML email from Handled Home's domain. predict-services and support-ai-classify should require auth. auto-resolve-dispute should require admin or cron auth.

## Scope
- send-email: Add requireServiceRole check (only service-role callers can send)
- predict-services: Add requireUserJwt check (AI predictions require auth)
- support-ai-classify: Add requireServiceRole check (internal classifier)
- auto-resolve-dispute: Add requireAdminOrCron check

## Non-goals
- Changing email sending logic
- Changing AI prediction logic
- Modifying dispute resolution business logic

## File targets
| Action | File |
|--------|------|
| Modify | supabase/functions/send-email/index.ts |
| Modify | supabase/functions/predict-services/index.ts |
| Modify | supabase/functions/support-ai-classify/index.ts |
| Modify | supabase/functions/auto-resolve-dispute/index.ts |

## Acceptance criteria
- [ ] send-email requires service-role key
- [ ] predict-services requires user JWT
- [ ] support-ai-classify requires service-role key
- [ ] auto-resolve-dispute requires admin JWT or cron secret
- [ ] All return 401 on unauthorized access

## Regression risks
- send-email is called internally by process-notification-events — that function must pass the service role key. Since process-notification-events already uses the service role key for its Supabase client, it should already be sending it in the Authorization header when invoking send-email via supabase.functions.invoke(). Verify.
- predict-services is called from the frontend — the user's JWT is already sent via the Supabase client. Should work without frontend changes.

## Review Finding — F1 (Retroactive Review, Score 90)
predict-services, support-ai-classify, and auto-resolve-dispute were listed in the spec
but NOT migrated to _shared/auth.ts. Retroactive review Lane 1 flagged as MUST-FIX.

Investigation: All three already have inline auth checks that validate JWT/service-role
before processing. They are NOT open to unauthenticated callers. The spec was overly
broad — migrating them to _shared/auth.ts is a refactor, not a security fix.

[OVERRIDE: did not migrate predict-services, support-ai-classify, auto-resolve-dispute
to _shared/auth.ts — all three already have working inline auth guards. Refactoring
them is optional cleanup that changes nothing about security posture.]
