

# Module 03: Zones, Coverage & Capacity — Implementation Plan

## Overview
Build the admin Zones console: a single page at `/admin/zones` with 3 tabs (Regions, Zones, Insights), plus the supporting database schema additions and provider assignment system. No customer-facing UI changes -- coverage logic already works from Module 02.

---

## Current State
- `regions` table exists with `id`, `name`, `status`, `created_at`
- `zones` table exists with `id`, `region_id`, `name`, `zip_codes[]`, `default_service_day`, `max_stops_per_day`, `max_minutes_per_day`, `status`, `created_at`
- RLS: authenticated can read regions/zones, admins can manage
- `/admin/zones` and `/admin/capacity` are placeholder pages
- No provider assignment table exists
- StatusBadge component already handles `active`, `paused` statuses

---

## Step 1: Replace Documentation
Replace `docs/modules/03-zones-and-capacity.md` with the uploaded PRD.

## Step 2: Database Migration
Single migration adding columns and a new table:

### 2a. `regions` additions
- Add `state TEXT NOT NULL DEFAULT 'CA'`

### 2b. `zones` additions
- Add `buffer_percent INT NOT NULL DEFAULT 0`
- Add `default_service_window TEXT NULL` (values: `am`, `pm`, `any`, or null)
- Add `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Add trigger to auto-update `updated_at` on row change (reuse existing trigger function pattern from `properties`)

### 2c. New table: `zone_provider_assignments`
- `id` UUID PK default `gen_random_uuid()`
- `zone_id` UUID FK references `zones(id)` ON DELETE CASCADE
- `provider_user_id` UUID NOT NULL (no FK to auth.users)
- `assignment_type` TEXT NOT NULL (values: `primary`, `backup`)
- `created_at` TIMESTAMPTZ default `now()`
- UNIQUE constraint on `(zone_id, provider_user_id, assignment_type)`

### 2d. RLS for `zone_provider_assignments`
- Enable RLS
- Admin can manage all (FOR ALL)
- Providers can read own rows (FOR SELECT WHERE `provider_user_id = auth.uid()`)

## Step 3: Add Statuses to StatusBadge
Add `paused`, `expansion_planned`, `archived` to the StatusBadge config so they render with appropriate colors.

## Step 4: Create Data Hooks

### `src/hooks/useRegions.ts`
- `useRegions()`: fetch all regions (ordered by name), filtered by status optionally
- `useCreateRegion()`: insert mutation
- `useUpdateRegion()`: update mutation (including archive)

### `src/hooks/useZones.ts`
- `useZones(regionId?)`: fetch all zones with region name joined
- `useCreateZone()`: insert mutation
- `useUpdateZone()`: update mutation (including archive)
- `useZoneDetail(zoneId)`: fetch single zone with full data

### `src/hooks/useZoneProviders.ts`
- `useZoneProviders(zoneId)`: fetch assignments for a zone, joined with provider profiles
- `useToggleProviderAssignment()`: insert or delete assignment mutation
- `useProvidersList()`: fetch all users with `provider` role (from `user_roles` + `profiles`)

### `src/hooks/useZoneInsights.ts`
- `useNonServicedZipDemand()`: query properties grouped by zip, filter out zips covered by active zones, order by count desc
- `useZoneHealth(zoneId)`: compute homes in zone / capacity ratio

## Step 5: Build Admin Zones Page (`src/pages/admin/Zones.tsx`)

Single page with 3 tabs using Radix Tabs:

### Tab 1: Regions
- List of regions with name, state, status badge
- "New Region" button opens a sheet/dialog form (name, state, status)
- Tap row to edit (same form, prefilled)
- Archive action (sets status to `archived`, confirm dialog)
- Toggle to show/hide archived

### Tab 2: Zones
- Filter by region (dropdown, default "All")
- Zone list rows showing:
  - Zone name
  - Region name
  - Status pill
  - Default day + window (e.g., "Tue / AM")
  - Zip count (e.g., "14 zips")
  - Max homes/day
  - Provider summary (e.g., "2 primary / 1 backup") -- from assignment counts
- "New Zone" button opens a sheet with:
  - Zone name (required)
  - Region select (active regions only)
  - Zip codes textarea (comma-separated, auto-normalize to 5-digit)
  - Default service day (day_of_week enum select)
  - Default service window (am/pm/any select, optional)
  - Status select (active/paused/expansion_planned)
- Tap row opens a zone detail sheet with 3 sub-tabs:
  - **Details**: edit form (same as create, prefilled) + archive action
  - **Capacity**: max homes/day, max minutes/day, buffer % inputs + read-only utilization indicator (shows 0 for now with note "Scheduling starts in Module 06")
  - **Providers**: list all providers with primary/backup toggles

### Smart zip suggestions (lightweight)
- When editing zips, show suggestion chips for adjacent zips (same 3-digit prefix from other zones or from non-serviced demand list)
- Tap chip adds zip to input

### Tab 3: Insights
- "Non-serviced zip demand" list:
  - Zip code, property count, suggested action
  - Tap zip: "Create zone with this zip" (prefills zone create form)
- Zone health overview:
  - List of active zones with health dot (green/yellow/red based on homes/capacity ratio)

## Step 6: Remove `/admin/capacity` Route (Merge into Zones)
The PRD consolidates capacity into the zone detail. The separate `/admin/capacity` route becomes redundant. Options:
- Redirect `/admin/capacity` to `/admin/zones`
- Or keep placeholder with a note pointing to zones

We will redirect `/admin/capacity` to `/admin/zones` and remove it from the sidebar nav.

## Step 7: Update Sidebar Navigation
Remove "Capacity" from admin nav (it's now inside Zones detail). The sidebar entry for "Regions & Zones" already points to `/admin/zones`.

---

## Files Impact

### New files
- `src/hooks/useRegions.ts` -- Region CRUD hooks
- `src/hooks/useZones.ts` -- Zone CRUD hooks
- `src/hooks/useZoneProviders.ts` -- Provider assignment hooks
- `src/hooks/useZoneInsights.ts` -- Insights data hooks
- `src/components/admin/RegionsTab.tsx` -- Regions tab content
- `src/components/admin/ZonesTab.tsx` -- Zones tab content + detail sheet
- `src/components/admin/ZoneDetailSheet.tsx` -- Zone detail with sub-tabs
- `src/components/admin/InsightsTab.tsx` -- Insights tab content
- `src/components/admin/RegionFormDialog.tsx` -- Region create/edit dialog
- `src/components/admin/ZoneFormSheet.tsx` -- Zone create/edit sheet
- `src/components/admin/ZoneCapacityPanel.tsx` -- Capacity inputs panel
- `src/components/admin/ZoneProvidersPanel.tsx` -- Provider assignment panel
- `src/components/admin/ZipSuggestions.tsx` -- Smart zip suggestion chips

### Modified files
- `docs/modules/03-zones-and-capacity.md` -- Replace with new PRD
- `src/pages/admin/Zones.tsx` -- Full implementation replacing placeholder
- `src/pages/admin/Capacity.tsx` -- Redirect to `/admin/zones`
- `src/components/StatusBadge.tsx` -- Add `paused`, `expansion_planned`, `archived` statuses
- `src/components/AppSidebar.tsx` -- Remove "Capacity" from admin nav
- `src/App.tsx` -- No route changes needed (both routes already exist)

### Database changes
- Migration: add columns to `regions` and `zones`, create `zone_provider_assignments` table with RLS

---

## Technical Notes

### Zip normalization
```typescript
function normalizeZips(input: string): string[] {
  return input
    .split(/[,\s]+/)
    .map(s => s.replace(/\D/g, ''))
    .filter(z => z.length === 5)
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe
}
```

### Zone health calculation
```typescript
// homes = count of properties where zip_code is in zone.zip_codes
// capacity = zone.max_stops_per_day
// ratio = homes / capacity
// green: 0.60-0.95, yellow: <0.60, red: >0.95
```

### Non-serviced zip demand query
```typescript
// 1. Get all active zone zip_codes (flatten)
// 2. Get properties grouped by zip_code
// 3. Filter where zip NOT in covered set
// 4. Order by count desc
```

### Provider list for assignments
```typescript
// Join user_roles (role='provider') with profiles to get names
// Then join with zone_provider_assignments for current zone
```

### Adjacent zip suggestion
```typescript
// For a zone's current zips, find zips sharing first 3 digits
// that exist in: (a) other zones, or (b) non-serviced demand list
// but are NOT already in this zone's zip list
```

