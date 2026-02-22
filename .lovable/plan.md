

# Module 03 Cleanup: Address Review Gaps

## Summary
Two quick fixes from Claude Code's review. No database changes needed.

---

## Fix 1: Region status check in coverage lookup

**File**: `src/hooks/useZoneLookup.ts`

Currently the zone lookup only checks `zones.status = 'active'` but not whether the parent region is also active. A zone under an archived region could still match.

**Change**: Update the query to join with `regions` and filter by active region status:
```typescript
const { data, error } = await supabase
  .from("zones")
  .select("name, regions!inner(status)")
  .contains("zip_codes", [debouncedZip])
  .eq("status", "active")
  .eq("regions.status", "active")
  .limit(1)
  .maybeSingle();
```

The `!inner` join ensures only zones with an active parent region are returned.

---

## Fix 2: Remove `as any` casts in useZones.ts

**File**: `src/hooks/useZones.ts`

The `as any` casts on insert/update were needed before the additive migration types were generated. Now that `buffer_percent`, `default_service_window`, and `updated_at` are in the types, the casts can be removed.

Also clean up the `ZoneWithRegion` interface — `buffer_percent`, `default_service_window`, and `updated_at` are already part of `ZoneRow`, so re-declaring them in the extended interface is redundant.

**Changes**:
- Remove `buffer_percent`, `default_service_window`, `updated_at` from `ZoneWithRegion` (they're already in `ZoneRow`)
- Remove `as any` from `useCreateZone` insert call
- Remove `as any` from `useUpdateZone` update call
- Remove `as unknown` casts where possible (use proper Supabase select types)

---

## Deferred items (no action now)
- **Scalability of property aggregation** (issues 2-3): Fine at current scale; optimize with an RPC when property count grows
- **DB-level `get_active_zone_for_zip` function** (issue 4): Client-side approach works; add RPC when future modules need server-side zone resolution
- **Provider Coverage page** (issue 5): Out of scope for Module 03

## Files modified
- `src/hooks/useZoneLookup.ts` — Add region status check to query
- `src/hooks/useZones.ts` — Remove `as any` casts and redundant interface fields
