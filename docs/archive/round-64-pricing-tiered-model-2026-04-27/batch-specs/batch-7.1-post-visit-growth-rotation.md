# Batch 7.1 — Post-visit growth rotation card

> **Round:** 64 · **Phase:** 7 of 8 · **Batch:** 7.1 of 7.x
> **Branch:** `feat/round-64-batch-7.1-receipt-suggestions-rotation`
> **Size:** Medium · **Tier:** Quality
> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` §"Phase 7 — BYOC / BYOP / referral elevation"

## Review: Quality

3 parallel lanes + Lane 4 synthesis (sub-agent). First batch in Phase 7 → **skip Lane 3** per CLAUDE.md §5 skip rule. So: 2 lanes (Spec + Bug) + Lane 4 synthesis = 3 agents.

## Why this batch

Phase 7 surfaces growth CTAs at peak-trust moments. The post-visit screen — right after a 4★ or 5★ private review is submitted — is the highest-trust window in the customer journey. Today the only post-rating CTA is the always-on `VisitDetailReferralCard`. A new rate-limited growth card lets us rotate between BYOP-recommend and referral-share based on what the customer hasn't yet engaged with.

## Scope

### In

1. **New component `src/components/customer/PostVisitGrowthCard.tsx`** — single CTA card with three possible variants:
   - `recommend_provider` — "Loved your service? Recommend a pro." → routes to `/customer/recommend-provider?from=post_visit`
   - `share_referral` — "Know a neighbor who'd love this?" → routes to `/customer/referrals`
   - `null` — render nothing
   - Local-state dismissible (X button), session-only (no persistence; rate limiting is Batch 7.2's responsibility for the Dashboard surface)

2. **New hook `src/hooks/usePostVisitGrowth.ts`** — returns `{ variant: GrowthCtaVariant }`. Rotation logic:
   ```
   if user has 0 BYOP submissions          → "recommend_provider"
   else if user has 0 referral_rewards     → "share_referral"
   else                                    → null
   ```
   Reads via `useByopRecommendations()` and `useReferralRewards()`. Returns `null` while either query is loading (avoids flash).

3. **Wire into `src/pages/customer/VisitDetailComplete.tsx`** — render `<PostVisitGrowthCard />` after `<PrivateReviewCard />`, gated on:
   - `job.status === "COMPLETED"`
   - `review?.rating != null && review.rating >= 4`
   - hook returns non-null variant
   - card not dismissed in local state

4. **Update `src/pages/customer/RecommendProvider.tsx`** — read `?from=post_visit` query param via `useSearchParams`, store in a `referrer` state value, and include in the `useByopRecommendations.submit` payload's `note` field as a prefix (e.g., `[from: post_visit]\n<user note>`). Lets admin track which growth surface drove the recommendation.

5. **Unit test `src/hooks/__tests__/usePostVisitGrowth.test.ts`** — verify all four rotation outcomes (0/0 → recommend, 0/N → recommend, N/0 → share, N/N → null) with mocked hook returns.

### Out (deferred to TODO)

- **Provider-name interpolation** ("Love Tomás? Recommend him") — already in TODO under "Provider-name interpolation on customer trust copy (Round 65)". Visit detail doesn't carry `provider_orgs.name` today.
- **BYOC variant** — there is no customer-initiated BYOC creation flow today (`/customer/onboarding/byoc/:token` requires a pre-existing invite token from the provider). The PRD's `?via=post_visit&pro_id=...` hint applies to a flow that doesn't exist customer-side yet. Adding a customer "create BYOC invite" flow is its own batch; deferring to a Round 65 entry.
- **Category pre-fill** on the BYOP form — visit detail has `sku_id`, not category. Lookup is one extra `useSkus()` call per render; ship without it now and add as polish if conversion data warrants.
- **Persisted dismiss state / rate limiting** — Batch 7.2 introduces the rate-limit infrastructure for the Dashboard growth card; the post-visit card is a per-visit surface (low cardinality) so session-only dismiss is acceptable.

## Files touched

```
src/components/customer/PostVisitGrowthCard.tsx          NEW
src/hooks/usePostVisitGrowth.ts                          NEW
src/hooks/__tests__/usePostVisitGrowth.test.ts           NEW
src/pages/customer/VisitDetailComplete.tsx               MODIFIED (1 import + 1 render block)
src/pages/customer/RecommendProvider.tsx                 MODIFIED (useSearchParams + note prefix)
```

5 files; 1 new component (~80 lines), 1 new hook (~40 lines), 1 new test (~80 lines), 2 small mods. Well under decomposition thresholds.

## Acceptance criteria

- [ ] 5★ private review submitted on a COMPLETED visit → `PostVisitGrowthCard` appears below `PrivateReviewCard`.
- [ ] 4★ → card appears.
- [ ] 1★/2★/3★ → no card.
- [ ] First-ever rating (no prior BYOP, no prior referral redemption) → card shows `recommend_provider` variant.
- [ ] After a BYOP submission (any status) → next 4★+ visit shows `share_referral` variant.
- [ ] After both engaged (≥1 BYOP submission AND ≥1 referral reward row) → no card renders.
- [ ] CTA tap on `recommend_provider` → navigates to `/customer/recommend-provider?from=post_visit`.
- [ ] On the BYOP form, submitting with `?from=post_visit` sets the recommendation's `note` to `[from: post_visit]\n<user note or empty>`.
- [ ] CTA tap on `share_referral` → navigates to `/customer/referrals`.
- [ ] Dismiss (X) → card hides for the rest of the session; reappears on hard reload (acceptable per session-only dismiss decision).
- [ ] Existing `VisitDetailReferralCard` continues to render unchanged on COMPLETED visits.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run build` clean.
- [ ] `npm run test -- usePostVisitGrowth` passes.

## Testing tier

| T1 | T2 | T3 | T4 | T5 |
|----|----|----|----|----|
| ✅ | ✅ (rotation hook) | ✅ (smoke: render with rating=5 mock) | — | optional after merge |

T4 deferred — this rides on the existing VisitDetail Tier-4 spec from Batch 5.4 if needed in Phase 8 verification. T5 (Sarah persona) requires a milestone capture that's already on the TODO list as a UX.1 follow-up; not a 7.1 dependency.

## Blast radius

Low. New files only + 2 minimal edits. No schema, no migrations, no auth changes. The `?from=post_visit` query param on the BYOP form is metadata — the recommendation still routes through the same RPC.

## Branching + rollout

- Branch: `feat/round-64-batch-7.1-receipt-suggestions-rotation` (off `main` at `75b0794`).
- Single PR against `main`; self-merge per CLAUDE.md §11.
- After merge: `/closeout` updates plan.md Session Handoff and flips 7.1 to ✅.
