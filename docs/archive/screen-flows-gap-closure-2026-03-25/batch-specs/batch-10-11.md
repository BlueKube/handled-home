# Batches 10-11 (Combined) — Error/Empty States: Customer Flows F1-F11

## Scope
Add spec-compliant error/empty states to critical customer pages.

## Pattern
- isError → `<QueryErrorCard message="..." onRetry={refetch} />`
- empty data → `<EmptyState icon={...} title="..." body="..." />`

## Priority Pages (Critical Path)
1. Dashboard — show error card on property/subscription failure
2. Plans — error state for plan query
3. Routine — error state for routine data
4. Schedule — error/empty for visits
5. Activity — error/empty for activity
6. VisitDetail — error state
7. Support/SupportTickets — error/empty
8. Property — error state
9. Billing — error/empty
10. Settings — error state

## Acceptance Criteria
- [ ] QueryErrorCard on all critical customer pages with failed queries
- [ ] EmptyState on data list pages (Activity, Schedule, Support)
- [ ] Build passes
