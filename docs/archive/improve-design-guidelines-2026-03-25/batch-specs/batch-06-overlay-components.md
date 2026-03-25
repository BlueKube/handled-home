# Batch 6: Overlay Components

## Phase
Phase 2: Component Conformance

## Why it matters
Overlays (dialogs, sheets, drawers, popovers, tooltips) are critical interaction patterns. Consistent radius, overlay opacity, and focus patterns ensure a cohesive feel across all modal interactions.

## Scope

### Dialog (`dialog.tsx`)
- Overlay: `bg-black/80` → `bg-black/50` (spec: bg-black/50)
- Content: `bg-background` → `bg-card`; `max-w-lg` → `max-w-sm`; `sm:rounded-lg` → `rounded-2xl`
- Close button: `focus:ring-2 focus:ring-ring` → `focus-visible:ring-2 focus-visible:ring-ring`

### Sheet (`sheet.tsx`)
- Overlay: `bg-black/80` → `bg-black/50`
- Bottom variant: add `rounded-t-2xl`
- Close button: `focus:ring-2 focus:ring-ring` → `focus-visible:ring-2 focus-visible:ring-ring`

### Drawer (`drawer.tsx`)
- Overlay: `bg-black/80` → `bg-black/50`
- Content: `rounded-t-[10px]` → `rounded-t-2xl`

### Popover (`popover.tsx`)
- Content: `rounded-md` → `rounded-xl`

### Tooltip (`tooltip.tsx`)
- Content: `rounded-md` → `rounded-lg`; `text-sm` → `text-[13px]`

## Non-goals
- Dark mode overlay increase (bg-black/70) — that's Phase 3
- Focus trap verification (Radix handles this by default) — Phase 4
- Adding aria-live — Phase 4

## File targets
| Action | File |
|--------|------|
| Modify | `src/components/ui/dialog.tsx` |
| Modify | `src/components/ui/sheet.tsx` |
| Modify | `src/components/ui/drawer.tsx` |
| Modify | `src/components/ui/popover.tsx` |
| Modify | `src/components/ui/tooltip.tsx` |

## Acceptance criteria
- [ ] Dialog overlay uses bg-black/50
- [ ] Dialog content uses bg-card, max-w-sm, rounded-2xl
- [ ] Dialog close button uses focus-visible: not focus:
- [ ] Sheet overlay uses bg-black/50
- [ ] Sheet bottom variant has rounded-t-2xl
- [ ] Sheet close button uses focus-visible:
- [ ] Drawer overlay uses bg-black/50
- [ ] Drawer content uses rounded-t-2xl
- [ ] Popover content uses rounded-xl
- [ ] Tooltip content uses rounded-lg and text-[13px]
- [ ] npm run build passes

## Regression risks
- Overlay opacity change (80→50%) makes overlays more transparent — underlying content more visible
- Dialog max-w-sm is narrower than max-w-lg — could truncate content in some dialogs
- Border radius changes could clip content at corners

## Visual validation checklist
- [ ] Dialogs show correct overlay darkness
- [ ] Sheet slides up with correct rounded corners
- [ ] Popover has correct radius
- [ ] Tooltip text is readable at 13px
