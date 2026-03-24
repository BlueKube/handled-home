# Implementation Plan: Remaining Implementation Gaps

**PRD**: `docs/working/prd.md` (PRD-implementation-gaps.md)
**Branch**: `claude/document-prd-workflow-Mhw6W`
**Date**: 2026-03-24

---

## Summary

This plan closes 5 MISSING and 9 PARTIAL items from the post-PR #40 audit. All changes are frontend-only — no Supabase migrations or edge functions. Mock data is used for metrics that would require new backend queries.

**Total scope**: 14 items across 3 phases, ~27 files modified, 3 files created.

---

## Phase 1: UX Polish & Verification Gaps (Batch A)

**Theme**: Quick wins — small, isolated changes with no cross-dependencies. Improves customer/admin UX consistency.

| Batch | Item | Size | Files Modified | Files Created | Dependencies |
|-------|------|------|----------------|---------------|--------------|
| 1 | P3-3: Sign Out Confirmation | S | 1 (`MoreMenu.tsx`) | 0 | None |
| 2 | 2.1: Empty States | S | 2 (`Billing.tsx`, `admin/Dashboard.tsx`) | 0 | None |
| 3 | 2.5: Status Badges | S | 3 (`StatusBadge.tsx`, `Plans.tsx`, `ByocCenter.tsx`) | 0 | None |
| 4 | 2.6: Validation | M | 2 (`SupportNew.tsx`, `ProfileForm.tsx`) | 0 | None |
| 5 | 2.3: Back Buttons | M | 8 (customer + provider pages) | 0 | None |
| 6 | P3-2: Skip Options | S | 2 (`OnboardingOrg.tsx`, `OnboardingCompliance.tsx`) | 0 | None |
| 7 | P3-1: Help Tooltips | M | 18 (customer + admin pages) | 0 | None |

**Risk areas**: Batch 7 (Help Tooltips) touches 18 files — high surface area but each change is mechanical (add import + single JSX element). Risk is layout overflow from tooltip placement.

---

## Phase 2: Backend Rules & Edge Cases (Batch B)

**Theme**: P2 correctness items — billing logic, fraud prevention, BYOP provider decline handling. These affect business rule correctness.

| Batch | Item | Size | Files Modified | Files Created | Dependencies |
|-------|------|------|----------------|---------------|--------------|
| 8 | P2-4: Referral Fraud Prevention | M | 3 (`useReferralCodes.ts`, `useReferralAdmin.ts`, `Referrals.tsx`) | 0 | None |
| 9 | P2-2: BYOP Provider Decline | M | 4 (`useGrowthEvents.ts`, `Growth.tsx`, `useByopRecommendation.ts`, `RecommendProviderStatus.tsx`) | 1 (`ByopDeclineNotification.tsx`) | None |
| 10 | P2-1: Operational Exception Handling | L | 3 (`PausePanel.tsx`, `useDunningEvents.ts`, `FixPaymentPanel.tsx`) | 0 | None |

**Risk areas**: Batch 10 (Pause/Dunning/Payment) is the largest single batch — modifies billing-adjacent components with timeline visualizations and dunning logic. Careful review needed.

---

## Phase 3: Admin Metrics & Monitoring (Batch C)

**Theme**: Admin dashboards — adding monitoring gauges, cohort filtering, and loss leader reporting. All use mock data initially.

| Batch | Item | Size | Files Modified | Files Created | Dependencies |
|-------|------|------|----------------|---------------|--------------|
| 11 | P2-6: Payout Review Cadence | S | 1 (`OpsCockpit.tsx`) | 0 | None |
| 12 | 4.3: Bundle Flywheel Cohort Filtering | M | 3 (`useBusinessHealth.ts`, `BusinessHealthCard.tsx`, `RiskAlertsCard.tsx`) | 0 | None |
| 13 | 4.4: Success Metrics Gauges | M | 1 (`OpsCockpit.tsx`) | 1 (`useOperationalMetrics.ts`) | Batch 11 (same file) |
| 14 | P2-5: Loss Leader Review | M | 1 (`Reports.tsx`) | 1 (`useLossLeaderMetrics.ts`) | None |

**Risk areas**: Batches 11 and 13 both modify `OpsCockpit.tsx` — batch 13 depends on batch 11 completing first. Batch 12 modifies the business health calculation which feeds into risk alerts — regression risk on existing alert thresholds.

---

## Deferred Items

- Backend queries for mock data (all marked with `// TODO: Replace with Supabase query`)
- IP/device fingerprinting for referral fraud
- `ChangePasswordForm.tsx` validation improvements (explicitly out of scope per PRD)
- React Hook Form / Zod migration (PRD specifies manual validation pattern)

---

## Execution Order

```
Phase 1 (Batches 1–7)  →  Doc Sync  →  Phase 2 (Batches 8–10)  →  Doc Sync  →  Phase 3 (Batches 11–14)  →  Doc Sync  →  Archive
```

Each batch follows the workflow checklist:
1. Re-anchor to plan
2. Write batch spec in `docs/working/batch-specs/`
3. Implement spec
4. Commit
5. 10-agent code review
6. Fix loop (max 3 passes)
7. Validate build (`tsc --noEmit` + `npm run build`)
8. Validate visually (screenshots where applicable)
9. Push

---

## Status Tracker

| Phase | Batch | Item | Status |
|-------|-------|------|--------|
| 1 | 1 | P3-3: Sign Out Confirmation | ✅ Complete |
| 1 | 2 | 2.1: Empty States | ✅ Complete |
| 1 | 3 | 2.5: Status Badges | ✅ Complete |
| 1 | 4 | 2.6: Validation | ✅ Complete |
| 1 | 5 | 2.3: Back Buttons | ✅ Complete |
| 1 | 6 | P3-2: Skip Options | ✅ Complete |
| 1 | 7 | P3-1: Help Tooltips | ✅ Complete |
| 2 | 8 | P2-4: Referral Fraud Prevention | ✅ Complete |
| 2 | 9 | P2-2: BYOP Provider Decline | ⬜ Not Started |
| 2 | 10 | P2-1: Operational Exception Handling | ⬜ Not Started |
| 3 | 11 | P2-6: Payout Review Cadence | ⬜ Not Started |
| 3 | 12 | 4.3: Bundle Flywheel Cohort Filtering | ⬜ Not Started |
| 3 | 13 | 4.4: Success Metrics Gauges | ⬜ Not Started |
| 3 | 14 | P2-5: Loss Leader Review | ⬜ Not Started |
