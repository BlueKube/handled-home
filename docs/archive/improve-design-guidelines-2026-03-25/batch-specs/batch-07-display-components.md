# Batch 7: Display Components

## Phase
Phase 2: Component Conformance

## Scope

### Avatar (`avatar.tsx`) — NO CHANGES NEEDED
Default 40px, fallback bg-muted. Size variants via className (correct pattern). Focus ring not on Avatar root (consumers add it when needed).

### Progress (`progress.tsx`) — FIXES NEEDED
- Track: `h-4` (16px) → `h-2` (8px, spec says 8px rounded-full)
- Track bg: `bg-secondary` → `bg-muted` (spec: bg-muted track)
- Fill: `bg-primary` ✓ correct
- Add `rounded-full` to indicator for pill shape

### Skeleton (`skeleton.tsx`) — NO CHANGES NEEDED
Already has rounded-xl, animate-shimmer, gradient. Correct.

### Alert (`alert.tsx`) — FIXES NEEDED
- Add `border-l-4` to base (spec: border-l-4 accent bar)
- Add warning variant: `border-warning/50 text-warning [&>svg]:text-warning`
- Add success variant: `border-success/50 text-success [&>svg]:text-success`

### Accordion (`accordion.tsx`) — MINOR FIX
- Trigger: remove `hover:underline` (not in spec, doesn't match design system)

### Separator (`separator.tsx`) — NO CHANGES NEEDED
Already correct: bg-border, 1px, vertical variant.

### ScrollArea (`scroll-area.tsx`) — FIXES NEEDED
- Scrollbar width: `w-2.5` (10px) → `w-1` (4px, spec says 4px)
- Horizontal scrollbar: `h-2.5` → `h-1`
- Thumb: `bg-border` → `bg-muted-foreground/30` (spec)

## File targets
| Action | File |
|--------|------|
| No change | `src/components/ui/avatar.tsx` |
| Modify | `src/components/ui/progress.tsx` |
| No change | `src/components/ui/skeleton.tsx` |
| Modify | `src/components/ui/alert.tsx` |
| Modify | `src/components/ui/accordion.tsx` |
| No change | `src/components/ui/separator.tsx` |
| Modify | `src/components/ui/scroll-area.tsx` |

## Acceptance criteria
- [ ] Progress track is h-2, bg-muted, indicator has rounded-full
- [ ] Alert has border-l-4 base, warning + success variants
- [ ] Accordion trigger has no hover:underline
- [ ] ScrollArea scrollbar is w-1/h-1 (4px), thumb bg-muted-foreground/30
- [ ] npm run build passes
