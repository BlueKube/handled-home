

## Phase 5 Review Fixes — Plan

### P0 Fixes (Runtime Bugs)

**P0 #1 + #2: Column name mismatches in ByocCreateLink.tsx**
- Line 36: `c.category_key` → `c.capability_key`
- Line 50: `c.category_key` → `c.capability_key`
- Line 51: `c.sku_name || c.sku_id` → `c.service_skus?.name || c.sku_id`

**P2 #6: Zone names showing UUIDs**
- Line 42: `name: c.zone_id` → `name: c.zones?.name || c.zone_id`

All three fixes are in `ByocCreateLink.tsx`.

### P1 #1: Missing UPDATE RLS on byoc_invite_links

New migration adding:
```sql
CREATE POLICY "provider_update_own_invite_links"
  ON public.byoc_invite_links FOR UPDATE TO authenticated
  USING (org_id IN (SELECT provider_org_id FROM provider_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT provider_org_id FROM provider_members WHERE user_id = auth.uid()));
```

### P2 #1: Missing "ONCE" cadence

Add `{ value: "once", label: "Once" }` to the CADENCES array in ByocCreateLink.tsx.

### P2 #2 + #3: Compliance reminder + "How BYOC works" section

Add two sections to ByocCenter.tsx:
1. A short "How BYOC works" explainer card (3 numbered steps)
2. A compliance reminder alert: "Do not promise permanent pricing. Transition credits may apply."

### P3 #1: Render recent events list

Add a collapsible events feed section below the stats cards in ByocCenter.tsx showing the 10 most recent events with timestamps and event types.

### P3 #3: text-success → text-green-500

Fix the potentially undefined CSS class in ByocCenter.tsx.

### Deferred (not in this fix batch)

- **P1 #2** (token collision retry) — low risk at current scale, noted for future
- **P1 #3** (N+1 events query) — functional, optimize later
- **P2 #4** (incentive summary) — requires wiring useByocAttributions, deferred to polish pass
- **P2 #5** (template interpolation) — requires script seeding + variable system, deferred
- **P3 #2** (as any casts) — systematic cleanup, not blocking

### tasks.md Updates

Add Phase 5 Review Fixes section tracking all resolved items.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/provider/ByocCreateLink.tsx` | Fix column names, add ONCE cadence |
| `src/pages/provider/ByocCenter.tsx` | Add How BYOC Works, compliance reminder, events feed, fix text-success |
| Migration SQL | UPDATE RLS policy on byoc_invite_links |
| `docs/tasks.md` | Track Phase 5 review fixes |

