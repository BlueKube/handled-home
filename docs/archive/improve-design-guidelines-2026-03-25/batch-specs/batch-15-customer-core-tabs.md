# Batch 15: Customer Dashboard & Core Tabs

## Phase
Phase 5: Page-Level Conformance

## Scope
Fix all 4 core customer pages to follow mobile page template:
1. Remove `max-w-lg mx-auto` from all containers (mobile-only app)
2. Change `px-4 py-6 pb-24` → `p-4 pb-24`
3. Add `animate-fade-in` to loading/error state containers

## Acceptance criteria
- [ ] No `max-w-lg` or `mx-auto` in any customer page container
- [ ] All containers use `p-4 pb-24` (not px-4 py-6 pb-24)
- [ ] All states (loading, error, main) have animate-fade-in
- [ ] npm run build passes
