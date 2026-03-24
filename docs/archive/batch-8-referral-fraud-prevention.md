# Batch 8: P2-4 — Referral Fraud Prevention

## Phase
Phase 2: Backend Rules & Edge Cases

## Why it matters
Without velocity caps and typed fraud categories, referral abuse can drain credits with no automated guardrails. This batch adds client-side rate limiting and structured admin fraud tooling.

## Scope
1. **useReferralCodes.ts** — Add velocity cap check before allowing share/code generation. Expose `isRateLimited` and `rateLimitMessage`.
2. **useReferralAdmin.ts** — Add `FRAUD_FLAG_CATEGORIES` typed constant and `FraudFlagCategory` type. Update `reviewFlag` to use typed categories.
3. **Referrals.tsx** — Show rate limit banner and disable share button when `isRateLimited` is true.

## Non-goals
- No DB-level changes (self-referral block, duplicate detection, hold period remain as-is)
- No IP/device fingerprinting or geographic velocity checks
- No admin UI for flag creation dropdown (admin Growth page is out of scope for this batch)

## File targets
| Action | File |
|--------|------|
| Modify | `src/hooks/useReferralCodes.ts` |
| Modify | `src/hooks/useReferralAdmin.ts` |
| Modify | `src/pages/customer/Referrals.tsx` |

## Acceptance criteria
- [ ] `useReferralCodes` checks velocity cap before allowing share
- [ ] Hook exposes `isRateLimited: boolean` and `rateLimitMessage: string | null`
- [ ] Referrals page shows rate limit banner and disables share button when limit reached
- [ ] Rate limit message: "You've reached your weekly referral limit. Try again next week."
- [ ] `useReferralAdmin.ts` exports `FRAUD_FLAG_CATEGORIES` and `FraudFlagCategory` type
- [ ] Categories: velocity_cap, suspicious_ip, same_household, self_referral, rapid_redemption
- [ ] Flag creation/review functions use `FraudFlagCategory` type instead of freetext
- [ ] No changes to DB-level fraud prevention
