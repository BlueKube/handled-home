# Batch 5 — F17/F23 Coverage Zone Map (Shared MapboxZoneSelector)

## Scope
Build a shared `MapboxZoneSelector` component for interactive zone selection. Since Mapbox API key is unavailable, build placeholder UI with zone list fallback.

## Requirements (from screen-flows.md)
- F17 Screen 17.3: "Zone Map: interactive map with selectable hex zones"
- F23 Screen 23.2: Zone selection in provider settings

## Deferred
- Actual Mapbox map rendering requires API key (deferred to human)
- Component will detect missing `VITE_MAPBOX_ACCESS_TOKEN` and show fallback

## Implementation

### 1. Create `MapboxZoneSelector` component
**File:** `src/components/provider/MapboxZoneSelector.tsx`
- Props: `zones`, `selectedZoneIds`, `onToggleZone`, `disabled?`, `loading?`
- When Mapbox token available: render interactive map (future)
- When token missing: render styled zone card list with map placeholder message
- Placeholder: "Map view requires configuration" with MapPin icon
- Zone list: checkbox cards showing zone name, ZIP codes, selection state

### 2. Update `OnboardingCoverage.tsx`
- Replace inline zone card list with `<MapboxZoneSelector>`
- Preserve all existing data fetching logic

### 3. Update `Coverage.tsx` (provider settings)
- Add editable zone selection using `<MapboxZoneSelector>`
- Currently read-only — make zones toggleable

## Acceptance Criteria
- [ ] `MapboxZoneSelector` component created with placeholder + fallback
- [ ] OnboardingCoverage uses shared component
- [ ] Provider Coverage settings uses shared component
- [ ] Existing zone selection functionality preserved
- [ ] Build passes
