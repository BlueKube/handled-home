# Batch 9: P2-2 — BYOP Provider Decline

## Phase
Phase 2: Backend Rules & Edge Cases

## Why it matters
When a BYOP-recommended provider declines or becomes unavailable, customers need clear communication and the admin funnel needs visibility into this outcome.

## Scope
1. **useGrowthEvents.ts** — Add `providerUnavailable` count to `useByopFunnelStats` return
2. **Growth.tsx** — Add "Provider Declined" stat in BYOP funnel, add admin action to mark recommendations as provider_unavailable
3. **useByopRecommendation.ts** — Add `declineRecommendation(id)` mutation
4. **ByopDeclineNotification.tsx** — Create notification component for declined BYOP recommendations
5. **RecommendProviderStatus.tsx** — Integrate ByopDeclineNotification for provider_unavailable status

## Non-goals
- No notifications system integration (status page update only)
- No backend/DB schema changes

## File targets
| Action | File |
|--------|------|
| Modify | `src/hooks/useGrowthEvents.ts` |
| Modify | `src/pages/admin/Growth.tsx` |
| Modify | `src/hooks/useByopRecommendation.ts` |
| Create | `src/components/customer/ByopDeclineNotification.tsx` |
| Modify | `src/pages/customer/RecommendProviderStatus.tsx` |

## Acceptance criteria
- [ ] useByopFunnelStats returns providerUnavailable count
- [ ] Admin Growth page displays "Provider Declined" count in BYOP funnel
- [ ] Admin can mark a BYOP recommendation as "provider declined" from the Growth page
- [ ] declineRecommendation mutation exists in useByopRecommendation.ts
- [ ] Customer sees decline notification on Status tracker when recommendation is provider_unavailable
- [ ] Notification includes provider name, explanation, and "View My Routine" CTA
- [ ] provider_unavailable tracked separately from not_a_fit in all funnels
