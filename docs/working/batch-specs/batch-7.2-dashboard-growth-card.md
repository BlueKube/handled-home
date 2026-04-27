# Batch 7.2 — Dashboard growth card with rate limiting

> **Round:** 64 · **Phase:** 7 of 8 · **Batch:** 7.2 of 7.x
> **Branch:** `feat/round-64-batch-7.2-dashboard-growth-card`
> **Size:** Medium · **Tier:** Quality
> **PRD:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` §"Phase 7"

## Review: Quality

3 parallel lanes + Lane 4 synthesis (sub-agent). 7.1 already established Lane-1/Lane-3 history on the related rotation hook, so Lane 3 IS in play this batch.

## Why

Dashboard is the most-visited customer surface. After Batch 7.1 surfaces growth CTAs at the post-visit moment, this batch puts the same rotation logic in the always-on dashboard context — but rate-limited so the customer isn't nagged on every load. Spec calls out 1 card/week max with a 14-day dismiss persistence.

## Scope

### In

1. **New pure module `src/lib/growthRateLimit.ts`** — ISO-string-based rate-limit helpers, framework-free:
   - `shouldShowGrowthCard({ now, lastShownAt, dismissedUntil })` → `boolean`
   - `nextDismissUntil(now: Date)` → ISO string `now + 14d`
   - Pure functions with no localStorage / Date.now coupling — fully unit-testable.

2. **New hook `src/hooks/useDashboardGrowth.ts`** — wraps the existing `pickPostVisitGrowthVariant` from Batch 7.1 + the new rate-limit module:
   - Reads `useByopRecommendations` + `useReferralRewards` for the rotation signal.
   - Reads `localStorage` for `lastShownAt` and `dismissedUntil`.
   - Exposes: `{ variant, isLoading, recordShown(), dismiss() }`.
   - Variant returns `null` when (a) data loading, (b) rotation has no variant, (c) rate-limit / dismiss window active.
   - Localstorage keys are namespaced: `growth-card:dashboard:last-shown`, `growth-card:dashboard:dismissed-until`.

3. **New component `src/components/customer/DashboardGrowthCard.tsx`** — visually consistent with `PostVisitGrowthCard`:
   - Mounts only when hook returns a non-null variant.
   - Calls `recordShown()` once on mount via `useEffect` so subsequent loads in the next 7 days won't show another card.
   - Dismiss button calls `dismiss()` (writes 14-day lockout) AND hides locally.
   - Two variants: `recommend_provider` (BYOP) and `share_referral` (referrals page).

4. **Wire into `src/pages/customer/Dashboard.tsx`** — render `<DashboardGrowthCard />` directly below the `<NextVisitCard />` in the "Next Up" section. Conditional on `serviceDayConfirmed && subscription` so it only fires for fully-onboarded subscribers (avoids competing with `HomeSetupCard` / `Subscription Bridge CTA`).

5. **Unit tests `src/lib/__tests__/growthRateLimit.test.ts`** — cover:
   - First-ever render (no lastShown, no dismissed) → show.
   - Within 7d of lastShown → hide.
   - 8d after lastShown, no dismiss → show.
   - Within 14d of dismiss → hide.
   - 15d after dismiss → show (assuming lastShown also expired).
   - Bad/corrupt localStorage values → safely treated as null.

### Out (deferred)

- **Server-side rate limit** — localStorage is per-device. A customer using two devices would see the card twice in a week. Acceptable for v1; server-side would need a new table + RLS, out of scope.
- **Variant-specific rate limit** — both BYOP and referral share the same window. Spec says "1 card/week" not "1 of each variant per week."
- **Analytics events** — no `growth_events` insert on shown/dismissed/click yet (existing `useGrowthEvents` hook covers BYOC/referral funnels but adding dashboard-card events is a Round 65 instrumentation pass).

## Files touched

```
src/lib/growthRateLimit.ts                              NEW (~50 lines)
src/lib/__tests__/growthRateLimit.test.ts               NEW (~80 lines)
src/hooks/useDashboardGrowth.ts                         NEW (~70 lines)
src/components/customer/DashboardGrowthCard.tsx         NEW (~80 lines)
src/pages/customer/Dashboard.tsx                        MODIFIED (1 import + 1 render block)
```

5 files, 4 new + 1 modified. All under decomposition thresholds.

## Acceptance criteria

- [ ] Dashboard renders one CTA card below NextVisitCard for fully-onboarded subscribers when no rate-limit window is active.
- [ ] Card respects the 7-day "1/week" rate limit — once shown (recordShown writes lastShownAt), the card stays hidden for 7 days.
- [ ] Card respects the 14-day dismiss persistence — clicking X writes dismissedUntil, hiding the card for 14 days even if rotation/data would otherwise show it.
- [ ] Variant rotation matches Batch 7.1 (BYOP first if 0 submissions, else referral if 0 rewards, else null).
- [ ] Card is hidden for unsubscribed users / users still in onboarding (no competition with HomeSetupCard).
- [ ] `localStorage` corrupt values (e.g., non-ISO strings) don't crash — treated as null.
- [ ] `npx tsc --noEmit`, `npm run build`, `npm test` all clean.
- [ ] `localStorage` keys namespaced as `growth-card:dashboard:*` so future surfaces (Visits, Services) don't collide.

## Testing tier

| T1 | T2 | T3 | T4 | T5 |
|----|----|----|----|----|
| ✅ | ✅ (rate-limit lib) | ✅ (smoke: render w/ subscription mock; verify hide on rapid reload) | — | optional |

## Blast radius

Low. New files only + 1 dashboard wiring change. Reuses existing `pickPostVisitGrowthVariant` so the rotation logic stays single-sourced.

## Branching

- Branch: `feat/round-64-batch-7.2-dashboard-growth-card` (off `main` after PR #50 closeout merged).
- Single PR against `main`; self-merge per CLAUDE.md §11.
