# Batch 2: 2.1 Empty States

## Phase
Phase 1 — UX Polish & Verification Gaps

## Why it matters
Users seeing blank sections or inline text fragments instead of proper empty states creates a feeling of broken or unfinished product.

## Scope
- Add EmptyState to Billing.tsx when no subscription exists
- Add EmptyState to admin/Dashboard.tsx when no data exists

## Non-goals
- No changes to BillingHistory.tsx or BillingMethods.tsx (already use EmptyState)
- No changes to EmptyState component itself

## File targets
| Action | File |
|--------|------|
| Modify | `src/pages/customer/Billing.tsx` |
| Modify | `src/pages/admin/Dashboard.tsx` |

## Acceptance criteria
- [ ] Billing.tsx shows EmptyState with CreditCard icon when no subscription exists
- [ ] EmptyState copy: "No billing activity yet" / "Your first invoice will appear here once your membership begins."
- [ ] CTA on Billing empty state navigates to plans page
- [ ] admin/Dashboard.tsx shows EmptyState with BarChart3 icon when no data exists
- [ ] EmptyState copy: "No data yet" / "Metrics will populate as customers and providers onboard."
- [ ] Both use shared EmptyState from @/components/ui/empty-state

## Regression risks
- Billing page conditional rendering could hide valid data if condition is wrong
- Admin dashboard could flash empty state before data loads (need to check isLoading)

## Visual validation checklist
- [ ] EmptyState centered on page
- [ ] Dark mode works
- [ ] CTA button tappable (44px+)
