# Batch 5: 2.3 Back Buttons

## Phase
Phase 1 — UX Polish & Verification Gaps

## Why it matters
Pages accessed from the More menu have no way to navigate back, trapping users on sub-pages.

## Scope
Add ChevronLeft + "More" back button at top of 8 section-level pages accessed from More menu.

## Non-goals
- No changes to sub-page back buttons (PlanDetail, BillingHistory, etc.)
- No changes to AppHeader.tsx

## File targets
| Action | File | Back target |
|--------|------|-------------|
| Modify | `src/pages/customer/Plans.tsx` | `/customer/more` |
| Modify | `src/pages/customer/Billing.tsx` | `/customer/more` |
| Modify | `src/pages/customer/Referrals.tsx` | `/customer/more` |
| Modify | `src/pages/customer/Property.tsx` | `/customer/more` |
| Modify | `src/pages/customer/Support.tsx` | `/customer/more` |
| Modify | `src/pages/customer/Settings.tsx` | `/customer/more` |
| Modify | `src/pages/provider/ByocCenter.tsx` | `/provider/more` |
| Modify | `src/pages/provider/Earnings.tsx` | `/provider/more` |

## Acceptance criteria
- [ ] All 8 pages have ChevronLeft + label back button at top
- [ ] Back button navigates to correct parent route
- [ ] Consistent styling: text-muted-foreground, text-sm, h-4 w-4 icon
- [ ] Back button appears above page title
- [ ] Existing sub-page back buttons NOT changed
