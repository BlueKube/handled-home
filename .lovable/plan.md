

# Round 2B Sprint 0 — Cleanup Pass (4 Items from Claude Review)

Claude's review identified 4 concrete fixes needed before Sprint 1. All are small and surgical.

## Fix 1: Tighten notifications INSERT policy

The current policy allows ANY authenticated user to insert notifications directly:
```sql
public.has_role(auth.uid(), 'admin') OR auth.uid() IS NOT NULL
```
The `OR auth.uid() IS NOT NULL` makes the admin check pointless. Since `emit_notification()` is SECURITY DEFINER (bypasses RLS), we only need admin-only for direct inserts.

**Change:** New migration dropping and replacing the policy with admin-only `WITH CHECK`.

## Fix 2: Remove `as any` cast in useZoneProviders insert

Line 106 of `src/hooks/useZoneProviders.ts` uses `as any` on the insert object. The Supabase types already define `zone_category_providers.Insert` with matching fields (`zone_id`, `category`, `provider_org_id`, `role`, `priority_rank`). The cast is unnecessary and can be removed.

**Change:** Remove `as any` from the insert call in `useAssignZoneCategoryProvider`.

## Fix 3: Check off 2B-00c in tasks.md

Line 50 shows `[ ] **2B-00c**` but the code is fully implemented.

**Change:** `[ ]` → `[x]` on line 50.

## Fix 4: Add backup priority rank editing

The `priority_rank` column exists but the UI always inserts with default `1`. Sprint 1's assignment engine will select backups by `priority_rank`, so this needs to be editable now.

**Change:** In `ZoneProvidersPanel.tsx`, add a small numeric input or up/down buttons on backup provider cards to set/adjust `priority_rank`. Add an `useUpdateZoneCategoryProvider` mutation to the hook for updating rank.

## Files Modified

- `supabase/migrations/` — new migration for notifications INSERT policy fix
- `src/hooks/useZoneProviders.ts` — remove `as any`, add update mutation
- `src/components/admin/ZoneProvidersPanel.tsx` — add backup priority editing
- `docs/tasks.md` — check off 2B-00c

## Technical Details

- No new dependencies
- No new tables
- Single migration: `DROP POLICY` + `CREATE POLICY` for notifications INSERT
- The update mutation uses `.update({ priority_rank }).eq("id", id)` on `zone_category_providers`

