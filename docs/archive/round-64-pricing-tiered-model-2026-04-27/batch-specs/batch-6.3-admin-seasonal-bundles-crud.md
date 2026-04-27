# Batch 6.3 — Admin Seasonal Bundles CRUD + zone rollout + window editor

> **Round 64 · Phase 6 · Batch 3 of 3 — final Phase 6 batch**
> **Created:** 2026-04-26
> **Mode:** Quality (production-facing admin CRUD with destructive write paths)
> **Review:** Medium — 3 parallel lanes + Lane 4 synthesis (sub-agent)

---

## Why

Batches 6.1 and 6.2 shipped the schema + Fall Prep strawman + customer-facing surfaces. The schema is admin-gated (RLS) and the seeded bundle is in `'draft'` status with empty `zone_ids` — meaning customers see nothing yet. Batch 6.3 lands the admin CRUD page so the human admin can:

- Promote draft bundles to `'active'`.
- Edit name, season, window dates, description, total_credits.
- Add / edit / reorder / delete bundle line items.
- Pick which zones a bundle rolls out to.
- Archive bundles after the season ends.

Without this UI, every future bundle requires a migration. With it, admins draft bundles in the dashboard.

## Goals

1. New page at `/admin/seasonal-bundles` (NOT `/admin/bundles` — that's the legacy routines viewer; rename deferred to Phase 8 doc-sync).
2. List view: all bundles grouped by status (active, draft, archived). Each row shows name + season + window + zone count + status pill.
3. Detail/edit view (sheet): edit bundle metadata + line items + zone rollout.
4. New-bundle flow: blank form → save as draft.
5. Status promotion buttons: "Promote to active" / "Archive".
6. Line-item CRUD inline.
7. Zone rollout multi-select (pulls existing zones list).

## Non-goals

- Hero image upload — punt to a future polish batch (admin can paste a URL).
- Bundle templates / cloning — punt.
- Bulk actions — punt.
- Customer-side admin preview — admin sees the same data shape the customer would but rendered in the admin UI.

## Scope

### New page

- **`src/pages/admin/SeasonalBundles.tsx`** (~250-350 LOC)
  - Top: "+ New bundle" CTA → opens edit sheet pre-filled with sensible defaults (status='draft', empty items, empty zone_ids, season='fall', window = next 90 days).
  - Three sections: Active · Drafts · Archived (collapsible, draft expanded by default).
  - Each row: bundle name + season tag + window dates + zone count + status pill + edit pencil.
  - Empty states per section.

### New components

- **`src/components/admin/bundles/BundleEditSheet.tsx`** (~250-350 LOC)
  - Sheet, large.
  - Form fields: name, slug (auto-derived from name unless edited), season select, window_start_date + window_end_date pickers, description textarea, total_credits input, hero_image_path (optional URL string).
  - Sub-section: "Zones" — multi-select chips of all available zones from a `useZones` hook.
  - Sub-section: "Line items" — list of editable rows (label, est_minutes, credits, sort_order). Add row button. Delete row button. Drag handle for sort_order is out-of-scope; sort_order edited inline as integer.
  - Footer: Save / Save & Activate / Archive / Cancel.
  - Live "Bundle savings" summary: separate (from sum of items) vs total (from total_credits field) vs save (computed).

- **`src/components/admin/bundles/BundleRow.tsx`** (~60-100 LOC) — single row for the list view.

### New hooks

- **`src/hooks/useAdminBundles.ts`** — list ALL bundles (admin RLS bypasses status+zone gates). Returns by-status grouped data. Refetches on focus.
- **`src/hooks/useAdminBundleMutations.ts`** — all 6 mutations: create, update, archive, promote, addItem, updateItem, deleteItem, reorderItems. Each invalidates the appropriate cache keys.

### Existing-file edits

- **`src/App.tsx`** — register `/admin/seasonal-bundles` lazy route under the existing admin protected route block. Use a new `AdminSeasonalBundles` lazy import. Do NOT touch the existing `/admin/bundles` (legacy routines viewer) — Phase 8 will rename.
- **Admin nav** — find where admin nav links live (likely `src/components/AdminLayout.tsx` or similar) and add a "Seasonal Bundles" link. Verify before assuming.

### Helper

- **`src/lib/bundleSlug.ts`** + test — pure function `slugify(name: string)` producing kebab-case slugs (e.g. "Fall Prep 2026" → "fall-prep-2026"). Reused by the new-bundle flow when admin types a name and slug field is auto-populated. Strip diacritics, lowercase, hyphenate spaces, drop non-alphanum-hyphen.

## Acceptance criteria

- [ ] Admin can navigate to `/admin/seasonal-bundles` and see Fall Prep strawman in the Drafts section.
- [ ] Editing the strawman: change description, save → re-fetch shows new description.
- [ ] Adding a line item: appears in the list in correct sort_order position.
- [ ] Promoting status='draft' → status='active': the bundle now shows up in the customer's `useBundles` query (verify by switching auth context if possible, or by running RLS-tested SQL).
- [ ] Picking a zone from the multi-select: zone_ids array updates correctly.
- [ ] Slug auto-fills from name on new-bundle, but is editable.
- [ ] Slug uniqueness — Postgres UNIQUE constraint will reject duplicates; UI shows a clear error.
- [ ] separate_credits is auto-computed by summing items.credits when the admin edits items, and persisted to the row.
- [ ] CHECK constraint `separate_credits >= total_credits` is enforced — if admin enters total > separate, save is rejected with a clear UI message.
- [ ] `npx tsc --noEmit` clean, build clean, vitest passing (slugify tests).
- [ ] No new lint errors in changed files.

## Testing tiers

| Tier | Run? | Notes |
|---|---|---|
| T1 (tsc + build + lint) | ✅ via `/pre-pr` | Mandatory |
| T2 (vitest) | ✅ | slugify helper tests |
| T3 (smoke) | — | No edge function changes |
| T4 (Playwright E2E) | — | Defer — admin role testing requires admin-seeded auth user; carry-over to a polish batch |
| T5 (Sarah persona) | — | Admin surfaces are out of Sarah's scope (customer persona) |

## Out of scope (deferred)

- Hero image upload (admin pastes URL string).
- Bundle templates / cloning.
- Bulk delete / bulk archive.
- Admin E2E spec for the full CRUD flow.
- Renaming legacy `src/pages/admin/Bundles.tsx` → `Routines.tsx` — Phase 8 doc-sync per existing TODO.
- Audit log / undo for archives — separate batch.

## Risks + override notes

- **Bundles + bundle_items types still pending** — same `as any` cast pattern as Batch 6.2. The regen-types auto-PR will eventually clean these up.
- **Zone list source** — verify whether a `useZones` hook already exists; if not, write a small inline query against the `zones` table (admin can see all per RLS).
- **Concurrent edits** — admin rarely double-edits, but if a stale edit overwrites a fresh one no warning is shown. Acceptable for MVP; future enhancement could use updated_at optimistic locking.
- **Slug rename on existing bundle** — changing slug breaks any in-flight customer URL `/customer/bundles/:slug`. Block slug edits on bundles where status is or has been 'active'? OR just disable slug edits after first save? Choose: disable slug edits after first save (simpler).
- **separate_credits drift** — if admin edits items but the migration's denormalized `separate_credits` isn't updated, the customer-side savings math becomes wrong. Mitigation: `useAdminBundleMutations.updateItem` always recomputes `bundle.separate_credits = sum(items.credits)` and updates the parent bundle in the same transaction.

## Batch deliverables checklist

- [ ] 1 new page (SeasonalBundles).
- [ ] 2 new components (BundleEditSheet, BundleRow).
- [ ] 2 new hooks (useAdminBundles, useAdminBundleMutations).
- [ ] 1 helper + test (slugify).
- [ ] Route + nav link added.
- [ ] All gates green.
- [ ] PR opened with Test plan citing T1 + T2.
- [ ] Self-merge after Vercel ✅ (no migrations in this batch).
- [ ] Closeout: flip 6.3 ✅, Phase 6 ✅ complete; update Session Handoff for Phase 7 entry decision.
