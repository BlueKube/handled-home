# Batch 2: Fix Stripe Webhook Signature Bypass

## Phase
Phase 1 — Edge Function Security Hardening

## Review: Quality

## Why it matters
The Stripe webhook silently accepts any POST body as a legitimate Stripe event if STRIPE_WEBHOOK_SECRET is not configured. This allows forged checkout.session.completed events that create real subscriptions without payment.

## Scope
- Remove the `else { event = JSON.parse(body) }` fallback — fail closed
- Throw if STRIPE_WEBHOOK_SECRET is not set
- Return 401 on signature failure
- Remove CORS headers (server-to-server only — use noCorsHeaders)
- Import noCorsHeaders from _shared/cors.ts

## Non-goals
- Changing webhook business logic
- Modifying other Edge Functions

## File targets
| Action | File |
|--------|------|
| Modify | supabase/functions/stripe-webhook/index.ts |

## Acceptance criteria
- [ ] Function throws if STRIPE_WEBHOOK_SECRET is not set
- [ ] No JSON.parse fallback for unsigned events
- [ ] Returns 401 on signature validation failure
- [ ] No CORS headers on responses (uses noCorsHeaders)
- [ ] No OPTIONS handler (webhooks don't need preflight)

## Regression risks
- If STRIPE_WEBHOOK_SECRET is not set in the environment, ALL webhook events will be rejected. This is the intended behavior (fail closed). Must be documented in DEPLOYMENT.md.
