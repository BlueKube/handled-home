# Batch 1: BYOP Flow 2B — Recommend a Provider

## Why It Matters

BYOP (Bring Your Own Provider) is a viral growth loop that reduces switching friction for incumbent-loyal households. Customers recommend trusted providers for network inclusion, earning $30 credits on acceptance. This batch delivers the full 3-screen customer flow + navigation entry point.

## Scope

- **Screen 2B.1**: Recommendation form (`/customer/recommend-provider`)
- **Screen 2B.2**: Confirmation (inline state, not separate route)
- **Screen 2B.3**: Recommendation tracker (`/customer/recommend-provider/status`)
- **Hook**: `useByopRecommendation.ts` for CRUD on recommendations
- **Routing**: Add 2 new routes to `App.tsx`
- **Navigation**: Add "Recommend a Provider" to MoreMenu Community section

## Non-Goals

- Supabase `byop_recommendations` table creation (mock with local state / optimistic patterns)
- Admin Growth Console BYOP section (Batch 5)
- BYOP provider decline handling (P2-2)
- Backend RPC validation

## File Targets

| Action | File |
|--------|------|
| **Create** | `src/pages/customer/RecommendProvider.tsx` |
| **Create** | `src/pages/customer/RecommendProviderStatus.tsx` |
| **Create** | `src/hooks/useByopRecommendation.ts` |
| **Modify** | `src/App.tsx` — add routes + import |
| **Modify** | `src/components/MoreMenu.tsx` — add menu item |

## Acceptance Criteria

1. Customer navigates More → Community → "Recommend a Provider"
2. Form shows: provider name (required), category select (required), phone (optional), email (optional), note (optional, max 200 chars)
3. "Why Recommend" card with accent styling (bg-accent/5, border-accent/20)
4. BYOP Credit Notice card with Gift icon + "$30 credit" info
5. Trust language caption about not sharing contact info
6. Submit shows confirmation inline with provider name, timeline steps, and CTAs
7. "Back to Dashboard" and "Recommend Another Provider" CTAs on confirmation
8. Tracker page (`/status`) shows recommendation list with status chips (Received → Under Review → Accepted / Not a Fit)
9. BYOP Credits card on tracker with earned amount
10. Empty states render correctly on both form and tracker
11. Loading skeletons on category fetch and recommendation list
12. Validation: provider name + category required
13. Fine print about eligibility review
14. All pages use `animate-fade-in`, `p-4 pb-24`, semantic colors, 44px touch targets

## Regression Risks

- MoreMenu must not break for provider/admin roles
- App.tsx route order must not shadow existing routes
- No max-w-lg constraints (mobile-only app)

## Visual Validation Checklist

- [ ] Form renders with all sections visible
- [ ] Category dropdown populates from serviceCategories
- [ ] Confirmation shows provider name and timeline
- [ ] Tracker shows status chips with correct colors
- [ ] Empty state on tracker renders correctly
- [ ] Dark mode: all sections readable
- [ ] Bottom tab bar clearance (pb-24)
