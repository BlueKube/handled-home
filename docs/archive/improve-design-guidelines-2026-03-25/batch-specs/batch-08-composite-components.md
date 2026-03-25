# Batch 8: Composite Components

## Phase
Phase 2: Component Conformance

## Scope

### EmptyState (`empty-state.tsx`) — FIXES NEEDED
- Title: `text-sm font-semibold` → `text-h3` (spec: .text-h3 title)
- Body: `text-xs text-muted-foreground` → `text-body text-muted-foreground` (spec: .text-body)

### StatCard (`StatCard.tsx`) — MINOR FIX
- Icon container: `rounded-xl` → `rounded-full` (spec: bg-accent/10 rounded-full)

### PageSkeleton — NO CHANGES NEEDED
Already uses animate-shimmer, correct structure.

### Sonner/Toast (`sonner.tsx`) — FIXES NEEDED
- Toast class: add `group-[.toaster]:rounded-2xl` (spec: rounded-2xl)
- Position: add `position="top-center"` (spec: top-center positioning)
- Background: `group-[.toaster]:bg-background` → `group-[.toaster]:bg-card` (spec: bg-card)

## Acceptance criteria
- [ ] EmptyState title uses text-h3
- [ ] EmptyState body uses text-body
- [ ] StatCard icon container uses rounded-full
- [ ] Toast has rounded-2xl, position top-center, bg-card
- [ ] npm run build passes
