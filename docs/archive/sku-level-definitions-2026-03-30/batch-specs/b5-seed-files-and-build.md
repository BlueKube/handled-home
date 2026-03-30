# Batch Spec: B5 — Update Seed Files + Verify Build

> **PRD:** PRD-046 (SKU Level Definitions)
> **Size:** M
> **Scope:** Mirror all sku_levels data in seed-rich-metro.sql, verify npm run build and npx tsc --noEmit pass

---

## Tasks

1. Add all 54 sku_levels rows to `supabase/seed-rich-metro.sql` (mirroring migration data)
2. Run `npm run build` — must pass
3. Run `npx tsc --noEmit` — must pass

## Level Count Summary

| Batch | SKUs | Levels |
|-------|------|--------|
| B1 | Mow, Edge, Leaf, Hedge | 12 |
| B2 | Weed, Fert, Mulch, Spring, Fall | 15 |
| B3 | Window, Power Wash, Pool, Pest, Poop | 14 |
| B4 | Gutter, Trash, Grill, Dryer Vent + 5 HA | 13 |
| **Total** | **18 SKUs** | **54 levels** |

## Acceptance Criteria

- [ ] seed-rich-metro.sql contains all 54 sku_levels rows
- [ ] All ON CONFLICT clauses present
- [ ] npm run build passes
- [ ] npx tsc --noEmit passes
