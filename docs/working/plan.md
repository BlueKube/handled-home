# Plan: PRD-045 — SKU Catalog Foundation

> **Branch:** claude/add-feature-maturity-ratings-tMeen
> **Mode:** Quality
> **Review:** 2-lane (Small batch: 1 combined reviewer + 1 synthesis)

---

## Phase 1: SKU Catalog Foundation (6 batches)

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Fix lawn/mowing SKU metadata (IDs 001-004) | S | ⬜ | |
| B2 | Fix treatment/cleanup SKU metadata (IDs 005-008) | S | ⬜ | |
| B3 | Fix specialty SKU metadata (IDs 009-00d) | S | ⬜ | |
| B4 | Add 5 new SKUs (gutter, fall prep, trash can, grill, dryer vent) | S | ⬜ | |
| B5 | Update seed-rich-metro.sql with all SKU changes | M | ⬜ | |
| B6 | Verify build + type-check + seed SQL validity | S | ⬜ | |

---

## Batch Details

### B1: Fix lawn/mowing SKU metadata (IDs 001-004)
**Files:** `supabase/migrations/20260322000000_fix_test_users_and_seed_metro.sql`
**Scope:** Update Standard Mow, Edge & Trim, Leaf Cleanup, Hedge Trimming with correct categories, descriptions, inclusions, exclusions, routing fields, handle costs, durations, base prices, checklists, proof requirements.

### B2: Fix treatment/cleanup SKU metadata (IDs 005-008)
**Files:** Same migration file
**Scope:** Update Weed Treatment (→treatment), Fertilization (→treatment), Mulch Application (→cleanup), Spring Prep (→cleanup). Fix categories, add descriptions, routing fields.

### B3: Fix specialty SKU metadata (IDs 009-00d)
**Files:** `supabase/migrations/20260223032019_*.sql`
**Scope:** Update Window Cleaning, Power Wash, Pool Service, Pest Control, Dog Poop Cleanup with calibrated data. These already have correct categories but need enriched metadata.

### B4: Add 5 new SKUs
**Files:** New migration or update to existing migration
**Scope:** Insert Gutter Cleaning, Fall Prep, Trash Can Cleaning, Grill Cleaning, Dryer Vent Cleaning with complete metadata.

### B5: Update seed-rich-metro.sql
**Files:** `supabase/seed-rich-metro.sql`
**Scope:** Mirror all changes from B1-B4 into the seed file. Add new v_sku_ variables. Ensure consistency.

### B6: Verify build + type-check
**Scope:** Run `npm run build`, `npx tsc --noEmit`. Fix any type errors. Verify seed SQL is syntactically valid.

---

## Session Handoff
- **Branch:** claude/add-feature-maturity-ratings-tMeen
- **Last completed:** None — starting fresh
- **Next up:** B1 — Fix lawn/mowing SKU metadata
- **Context at exit:** —
- **Blockers:** None
- **PRD queue:** PRD-046 (levels), PRD-047 (simulator validation), PRD-048 (schema enhancements)
