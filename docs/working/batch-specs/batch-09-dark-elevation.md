# Batch 9: Dark Elevation & Card Borders

## Phase
Phase 3: Dark Mode Polish

## Scope
1. Add dark mode shadow utilities to index.css that reduce shadow opacity to ~40% of light values
2. Verify card borders are visible in dark mode — card.tsx already has `border` in base
3. Verify bg-card vs bg-background dark mode distinction (12% vs 8% lightness — 4% gap exists)

## Implementation
- Add `.dark` shadow overrides in index.css for common shadow values
- Card already has border via `border-border` base class — verify `--border` dark token is visible

## Acceptance criteria
- [ ] Dark shadow utility classes or overrides exist
- [ ] Card border is visible against dark background
- [ ] npm run build passes
