# Batch B2 — Types Regen + Doc Sync + Lessons

> **Size:** S
> **Review:** Quality (2-lane Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Update TypeScript types to reflect the 9 new columns, sync all documentation, and close out the SKU Calibration full pass.

## Deliverables

1. **Update `src/integrations/supabase/types.ts`** — add the 9 new fields to sku_levels and service_skus Row/Insert/Update types
2. **Update `docs/feature-list.md`** — mark PRD-048 items as DONE
3. **Update `docs/working/plan.md`** — mark B2 ✅, update session handoff
4. **Update `lessons-learned.md`** — add any session lessons
5. **Update `docs/sku-calibration-report.md` Section 9** — note that schema enhancements are now implemented (not just recommended)

## Acceptance Criteria

- [ ] types.ts includes all 9 new fields with correct TypeScript types
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] feature-list.md updated
- [ ] plan.md shows all batches ✅
- [ ] lessons-learned.md updated

## Out of Scope

- Admin UI changes
- Migration changes (B1)
