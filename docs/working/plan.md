# Rounds 51–60: Simulator, Platform, Design & UX Polish

> **Last updated:** 2026-04-02
> **Branch:** `claude/polish-planned-features-l9XIY`
> **Round scope:** Features 348b–348e (Market Simulator), 148 (Policy Simulator), 241–243b (Edge Functions/Cron), 250–260 (Platform Infra), 340–391 (Design/UX)

---

## Progress Table

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Simulator retention metric + PolicySimulator error state | S | ✅ | — |
| B2 | PolicySimulator retry button (review fix) | Micro | ✅ | — |
| B3 | Platform: lazy-load MoreMenu, deep links, iOS config, CronHealth | S | ✅ | — |
| B4 | Deep link helper extraction (review fix) | Micro | ✅ | — |
| B5 | Dark-mode: text-amber-600/text-green-600 → 400 variants | S | ✅ | — |
| B6 | Customer error states: HomeTimeline, History, Subscription, Services | S | ✅ | — |
| B7 | UX: BundleSavingsCard parser, dead HomeTimeline, tab bar dot | S | ✅ | — |
| B8 | Browse: real ZIP check, SKU error state, SPA footer links | S | ✅ | — |
| B9 | Billing error states: BillingHistory, BillingMethods, Subscribe | S | ✅ | — |
| B10 | Error states: ServiceDay, PlanDetail, Earnings, Payouts, Reschedule | S | ✅ | — |

**Total: 10 batches, 26 code fixes across 28 files**

---

## Fixes Applied

### Round 51 — Market Simulator & Calibration
- `simulate.ts`: Fixed `retention_60d_pct` — was dividing month 2 active by month 1 active (included new acquisitions), now computes true cohort survival probability from churn rates
- `PolicySimulator.tsx`: Added `isError` handling with retry button
- `useSupportPolicies.ts`: Exposed `isError` from policiesQuery

### Round 52 — Edge Functions & Cron
- `CronHealth.tsx`: Added `isError` handling with refetch retry, removed unused `addHours`/`addDays` imports
- Logged 3 edge function security issues in TODO.md (offer-appointment-windows no auth, zone functions missing admin role check, CORS duplication)

### Round 53 — Platform Infrastructure
- `App.tsx`: Lazy-loaded `MoreMenuPage` (was only eagerly imported page component)
- `useDeepLinks.ts`: Added cold-start `App.getLaunchUrl()` handling, preserved query params on generic deep links, extracted `navigateToDeepLink` helper
- `capacitor.config.ts`: Added `ios.scheme`, `contentInset`, `backgroundColor`, `SplashScreen.launchAutoHide`

### Round 54 — Testing
- Deleted dead test stub `example.test.ts`

### Round 55 — App Store & Legal
- (No actionable code fixes — legal pages already at 9/10)

### Round 56-57 — UX Value Proposition
- `BundleSavingsCard.tsx`: Fixed price parsing that turned "$149/4 weeks" into $1494
- `BottomTabBar.tsx`: Added `relative` positioning for active tab dot indicator

### Round 58 — Design System Conformance
- Fixed dark-mode violations: `text-amber-600`/`text-green-600` → `text-amber-400`/`text-green-400` in QualityScore, Referrals, ProbationBanner, Incentives

### Round 59 — Screen-Flows Gap Closure
- Added `isError` handling to 4 customer pages: HomeTimeline (deleted — dead code), History, Subscription, Services
- Deleted dead `HomeTimeline.tsx` (no route registered, Activity page covers same functionality)

### Round 55 — App Store & Legal (Browse Page)
- `Browse.tsx`: ZIP coverage check now queries `zone_zips` table instead of always showing "expanding" message — in-market users see correct coverage status
- `Browse.tsx`: Added SKU catalog error state with AlertTriangle icon
- `Browse.tsx`: Footer links converted from `<a>` to React Router `<Link>` to prevent full page reloads

### Round 60 — Cross-Cutting Polish
- No console.log/debug statements found in production code (all console.warn calls are intentional error logging in catch blocks)
- No unused imports found beyond those already fixed

---

## Session Handoff
- **Branch:** `claude/polish-planned-features-l9XIY`
- **Last completed:** B10 (Error states — ServiceDay, PlanDetail, Earnings, Payouts, Reschedule)
- **Next up:** Round 61 — Final Verification & Doc Sync, or additional polish on remaining 8/10 features
- **Context at exit:** —
- **Blockers:** None
- **Round progress:** Rounds 51–60 complete (10 rounds in one session)
