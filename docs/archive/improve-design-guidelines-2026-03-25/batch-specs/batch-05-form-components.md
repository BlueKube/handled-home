# Batch 5: Form Components

## Phase
Phase 2: Component Conformance

## Why it matters
Form components are used across onboarding, settings, support tickets, and admin pages. Consistent sizing, focus treatment, and accessibility ensure a cohesive input experience.

## Scope

### Input (`input.tsx`) — VERIFIED, NO CHANGES NEEDED
Already conformant: h-12, rounded-xl, focus-visible:ring-2/ring-ring/bg-card, disabled:opacity-50.

### Textarea (`textarea.tsx`) — FIXES NEEDED
- Change `rounded-md` → `rounded-xl` (match Input)
- Change `text-sm` → `text-base` (match Input, 16px prevents iOS zoom)
- Change `px-3 py-2` → `px-4 py-3` (match Input)
- Add `focus-visible:bg-card` (match Input)
- Add `transition-all duration-150` (match Input)

### Select (`select.tsx`) — FIXES NEEDED
- SelectTrigger: `h-10` → `h-12` (spec: 48px)
- SelectTrigger: `rounded-md` → `rounded-xl`
- SelectTrigger: `text-sm` → `text-base`
- SelectTrigger: `px-3 py-2` → `px-4 py-3`
- SelectTrigger: `focus:` → `focus-visible:`
- SelectContent: `rounded-md` → `rounded-xl`

### Checkbox (`checkbox.tsx`) — FIXES NEEDED
- Size: `h-4 w-4` (16px) → `h-5 w-5` (20px, spec says 20×20px)
- Border radius: `rounded-sm` → `rounded-md`
- Border: `border-primary` → `border-input` (spec: unchecked uses border-input)

### Switch (`switch.tsx`) — VERIFIED, NO CHANGES NEEDED
Already conformant: h-6 w-11 (24×44px), rounded-full, h-5 w-5 thumb, focus-visible ring, disabled opacity-50.

### Radio (`radio-group.tsx`) — FIXES NEEDED
- Size: `h-4 w-4` (16px) → `h-5 w-5` (20px, spec says 20px circle)
- Border: `border` → `border-2` (spec: border-2)
- Border color: `border-primary` → `border-input` (spec: unchecked uses border-input)
- Dot: `h-2.5 w-2.5` → `h-2.5 w-2.5` (ok, ~10px)

### Label (`label.tsx`) — NO CHANGES NEEDED
Already `text-sm` (14px) and `font-medium` (500). Matches spec.

## File targets
| Action | File |
|--------|------|
| No change | `src/components/ui/input.tsx` |
| Modify | `src/components/ui/textarea.tsx` |
| Modify | `src/components/ui/select.tsx` |
| Modify | `src/components/ui/checkbox.tsx` |
| No change | `src/components/ui/switch.tsx` |
| Modify | `src/components/ui/radio-group.tsx` |
| No change | `src/components/ui/label.tsx` |

## Acceptance criteria
- [ ] Textarea uses rounded-xl, text-base, px-4 py-3, focus-visible:bg-card
- [ ] SelectTrigger uses h-12, rounded-xl, text-base, focus-visible:
- [ ] SelectContent uses rounded-xl
- [ ] Checkbox uses h-5 w-5, rounded-md, border-input
- [ ] RadioGroupItem uses h-5 w-5, border-2, border-input
- [ ] npm run build passes

## Regression risks
- Textarea/Select size increase could affect form layouts
- Checkbox/Radio size increase from 16px→20px may shift label alignment
- Select focus change from focus: to focus-visible: changes when ring appears

## Visual validation checklist
- [ ] Textarea renders correctly with new sizing
- [ ] Select dropdown opens correctly with new radius
- [ ] Checkbox/Radio visually correct at 20px
