# Batch 4: Services Catalog Plan Context (PRD-021)

## Phase
Phase 4 — Code Fixes from Audit

## Review: Quality (Medium — 4 agents)

## Why it matters
The Services catalog page shows all services generically with no indication of what's included in the customer's plan. This forces customers to navigate away to understand their entitlements. The audit flagged this as a critical UX gap.

## Scope
- Add optional `entitlementStatus` prop to `ServiceCard` component
- Display `EntitlementBadge` when status is provided
- Update `Services.tsx` to fetch customer subscription + entitlements
- Pass entitlement status to each `ServiceCard`
- Unauthenticated users see no badges (graceful degradation)

## Non-goals
- Does NOT change the SkuDetailView (separate enhancement)
- Does NOT reorder/group services by entitlement status (catalog stays category-grouped)
- Does NOT add plan upgrade CTAs

## File targets
| Action | File |
|--------|------|
| Modify | src/components/customer/ServiceCard.tsx |
| Modify | src/pages/customer/Services.tsx |

## Acceptance criteria
- [ ] ServiceCard accepts optional `entitlementStatus` prop
- [ ] When provided, EntitlementBadge renders in the card
- [ ] Services.tsx fetches subscription via useCustomerSubscription
- [ ] Services.tsx calls useEntitlements with plan_id and zone_id
- [ ] Entitlement status is passed to each ServiceCard via sku_id lookup
- [ ] Unauthenticated users see cards without badges (no errors)
- [ ] Build passes (npx tsc --noEmit && npm run build)

## Regression risks
- ServiceCard is used in multiple places — new prop must be optional
- useEntitlements requires planId — must handle null subscription gracefully
