# Batch 3: Add CRON_SECRET to 19 Unauthed Scheduled Functions

## Phase
Phase 1 — Edge Function Security Hardening

## Review: Quality

## Why it matters
19 Edge Functions have verify_jwt=false and no internal auth check. Any external caller who discovers the URL can trigger billing automation, dunning sequences, job assignments, email sending, and quality score computation. This is the highest-severity auth gap in the platform.

## Scope
Add `requireCronSecret` import and call at the top of each function's handler for:
1. run-dunning
2. run-billing-automation (replace anon-key passthrough with requireAdminOrCron)
3. run-nightly-planner
4. run-scheduled-jobs
5. assign-jobs
6. assign-visits
7. check-no-shows
8. compute-quality-scores
9. snapshot-rollup
10. evaluate-zone-expansion
11. check-weather
12. compute-zone-state-recommendations
13. evaluate-provider-sla
14. send-reminders
15. cleanup-expired-offers (standardize existing pattern — remove anon key acceptance)
16. process-notification-events
17. validate-photo-quality
18. optimize-routes
19. route-sequence

## Non-goals
- Changing any business logic in these functions
- Modifying functions that already have proper auth (create-checkout-session, process-payout, etc.)

## File targets
| Action | File |
|--------|------|
| Modify | 19 Edge Function index.ts files (listed above) |

## Acceptance criteria
- [ ] All 19 functions import and call requireCronSecret (or requireAdminOrCron for billing automation) before processing
- [ ] cleanup-expired-offers no longer accepts anon key
- [ ] run-billing-automation uses requireAdminOrCron (accepts admin JWT OR cron secret, but NOT anon key)
- [ ] Unauthorized requests return 401

## Regression risks
- CRON_SECRET must be set as Supabase Edge Function secret. Document in TODO.md.
- pg_cron must be configured to send service role key in Authorization header. Document in DEPLOYMENT.md.
