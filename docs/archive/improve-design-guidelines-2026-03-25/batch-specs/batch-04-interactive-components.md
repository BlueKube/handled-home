# Batch 4: Interactive Components — Button, Card, Badge, Tabs

## Phase
Phase 2: Component Conformance

## Why it matters
These four components are the most heavily used across all pages. Consistency with the design guidelines ensures a cohesive visual language and proper accessibility.

## Scope

### Button (`button.tsx`) — VERIFIED, NO CHANGES NEEDED
All 9 variants, 5 sizes, active:scale-[0.97], focus-visible ring, loading spinner, disabled state already match spec.

### Card (`card.tsx`) — MINOR FIX
- Add `focus-visible:ring-2 focus-visible:ring-ring` to interactive variant for keyboard accessibility

### Badge (`badge.tsx`) — MINOR FIXES
- Change `px-2.5` → `px-3` (spec says px-3)
- Change `text-xs` (12px) → `text-[13px]` (spec says 13px)
- Add `min-h-[24px]` (spec says min-h 24px)
- Change `focus:` → `focus-visible:` for ring (consistency with other components)

### Tabs (`tabs.tsx`) — MODERATE FIXES
- TabsList: Change `h-10` → `h-11` (spec: 44px)
- TabsList: Change `rounded-md` → `rounded-xl` (spec: rounded-xl)
- TabsTrigger: Change `rounded-sm` → `rounded-lg` (spec: active bg-card rounded-lg)
- TabsTrigger: Change `data-[state=active]:bg-background` → `data-[state=active]:bg-card` (spec: active bg-card)

## Non-goals
- Changing button variants or adding new ones
- Dark mode overrides (Phase 3)
- Page-level usage changes

## File targets
| Action | File |
|--------|------|
| No change | `src/components/ui/button.tsx` |
| Modify | `src/components/ui/card.tsx` |
| Modify | `src/components/ui/badge.tsx` |
| Modify | `src/components/ui/tabs.tsx` |

## Acceptance criteria
- [ ] Card interactive variant has `focus-visible:ring-2 focus-visible:ring-ring`
- [ ] Badge uses `px-3`, `text-[13px]`, `min-h-[24px]`
- [ ] Badge uses `focus-visible:` instead of `focus:`
- [ ] TabsList height is `h-11` (44px) with `rounded-xl`
- [ ] TabsTrigger active state uses `bg-card` and `rounded-lg`
- [ ] `npm run build` passes

## Regression risks
- Tab height increase from 40px→44px could affect layouts with tight vertical space
- Badge text size change from 12px→13px could cause minor layout shifts
- Card focus ring could overlap adjacent elements

## Visual validation checklist
- [ ] Tabs visually correct — active tab highlighted, correct radius
- [ ] Badges readable at new text size
- [ ] Card interactive variant shows focus ring on keyboard tab
