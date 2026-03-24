# Batch 3: 2.5 Status Badges

## Phase
Phase 1 — UX Polish & Verification Gaps

## Why it matters
Consistent status visualization via StatusBadge builds trust and reduces cognitive load compared to ad-hoc Badge+icon combos.

## Scope
- Add "recommended" status to StatusBadge (primary/blue)
- Add StatusBadge to PlanCard for recommended plans
- Replace Badge+icon status indicators in ByocCenter InviteLinkCard with StatusBadge

## Non-goals
- No changes to the "Most Popular" ribbon in PlanCard (that stays as-is — it's a visual ribbon, not a status indicator)
- No changes to existing StatusBadge styling for other statuses

## File targets
| Action | File |
|--------|------|
| Modify | `src/components/StatusBadge.tsx` |
| Modify | `src/components/plans/PlanCard.tsx` |
| Modify | `src/pages/provider/ByocCenter.tsx` |

## Acceptance criteria
- [ ] StatusBadge supports "recommended" status with primary/blue styling
- [ ] PlanCard shows "Recommended" StatusBadge on recommended plan
- [ ] ByocCenter invite links use StatusBadge for active/inactive status
- [ ] No visual regression on existing 47 statuses

## Regression risks
- PlanCard layout could shift with additional badge
- ByocCenter status change could affect link card layout
