# Batch 11: Dark Component Overrides Sweep

## Phase
Phase 3: Dark Mode Polish

## Scope
1. **Badge:** Add dark mode opacity reduction to prevent oversaturation
2. **BottomTabBar:** Verified — bg-card/90 backdrop-blur-lg works in dark mode
3. **Admin sidebar:** Verified — sidebar-background (214 65% 6%) is darker than background (214 65% 8%)
4. **Input:** Verified — bg-background token correctly shifts in dark mode

## Changes needed
- Badge: Add `dark:bg-opacity-90` to colored badge variants
- BottomTabBar: No change needed (already correct)
- Sidebar: No change needed (tokens already correct)

## Acceptance criteria
- [ ] Badge variants have reduced opacity in dark mode
- [ ] npm run build passes
