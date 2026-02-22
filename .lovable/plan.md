

# Module 04: SKU Catalog — Implementation Plan

## Overview
Build the full SKU Catalog: admin CRUD with structured scope/photos/checklist, customer browse page, provider reference view. Extends the existing `service_skus` table with new columns.

---

## Current State
- `service_skus` table exists with: `id`, `name`, `description` (nullable), `inclusions` (nullable text[]), `exclusions` (nullable text[]), `duration_minutes`, `fulfillment_mode` (enum), `weather_sensitive`, `required_photos` (nullable jsonb), `base_price_cents` (NOT NULL, default 0), `status` (default 'active'), `created_at`
- RLS: all authenticated can read all SKUs; admins can manage
- `/admin/skus` is a placeholder page
- No customer or provider SKU pages exist
- `fulfillment_mode` enum already has: `same_day_preferred`, `same_week_allowed`, `independent_cadence`
- StatusBadge already handles `draft`, `active`, `paused`, `archived`

---

## Step 1: Replace Documentation
Replace `docs/modules/04-sku-catalog.md` with the uploaded PRD.

## Step 2: Database Migration

### 2a. Add new columns to `service_skus`
- `category TEXT NULL` -- optional grouping (e.g., Exterior, Kitchen, Utilities)
- `checklist JSONB NOT NULL DEFAULT '[]'` -- structured task verification items
- `price_hint_cents INT NULL` -- optional, non-binding pricing hint
- `pricing_notes TEXT NULL` -- optional internal notes
- `edge_case_notes TEXT NULL` -- optional edge-case instructions
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` -- with auto-update trigger

### 2b. Alter existing columns
- `description`: SET NOT NULL, SET DEFAULT '' (PRD requires it)
- `inclusions`: SET NOT NULL (already has DEFAULT '{}')
- `exclusions`: SET NOT NULL (already has DEFAULT '{}')
- `required_photos`: SET NOT NULL (already has DEFAULT '[]')
- `status`: change DEFAULT from 'active' to 'draft'

### 2c. Handle `base_price_cents`
The PRD uses `price_hint_cents` (nullable) instead of `base_price_cents` (NOT NULL, default 0). Strategy:
- Keep `base_price_cents` for backward compatibility (no data loss)
- Add `price_hint_cents` as the new nullable column
- Admin UI uses `price_hint_cents` going forward
- `base_price_cents` can be deprecated/removed in a future cleanup

### 2d. Add `updated_at` trigger
Reuse existing `update_updated_at_column()` function.

### 2e. Update RLS policies
Current policy lets all authenticated users read all SKUs. PRD says non-admins should only see `active` SKUs.

Replace the SELECT policy:
```sql
DROP POLICY "Anyone authenticated can read SKUs" ON service_skus;
CREATE POLICY "Non-admins can read active SKUs"
  ON service_skus FOR SELECT
  USING (
    status = 'active'
    OR has_role(auth.uid(), 'admin')
  );
```

This ensures customers/providers only see active SKUs, while admins see all.

---

## Step 3: Create Data Hook

### `src/hooks/useSkus.ts`
- `useSkus(filters?)` -- fetch SKUs with optional status/category filters. Admin sees all; customer/provider filtered to active by RLS.
- `useSkuDetail(skuId)` -- fetch single SKU
- `useCreateSku()` -- insert mutation
- `useUpdateSku()` -- update mutation
- `useDuplicateSku()` -- fetch existing, insert copy with "(Copy)" name and status = 'draft'

---

## Step 4: Build Admin SKU Catalog Page

### `src/pages/admin/SKUs.tsx` (replace placeholder)
Layout:
- Search bar + category filter dropdown
- Status tabs: All | Active | Draft | Paused/Archived
- "New SKU" CTA button

### `src/components/admin/SkuListCard.tsx`
Each row shows:
- Name
- Status pill
- Duration (e.g., "30 min")
- Fulfillment mode label
- Photo count (e.g., "3 photos")
- Price hint badge if set (e.g., "$29 est.")
- Tap opens detail sheet

### `src/components/admin/SkuFormSheet.tsx`
Single-column form in a sheet modal. Collapsible sections:

**A) Basics**: Name (required), Description (required), Category (optional text), Status (draft/active/paused/archived)

**B) Scope**: Inclusions (list input with add/remove), Exclusions (list input), Edge-case notes (textarea)

**C) Execution Rules**: Duration minutes (number), Fulfillment mode (select), Weather sensitive (toggle)

**D) Proof Requirements (Photos)**: Structured list -- each item has label, when (before/after/both), count (number), notes (optional). Add/remove items.

**E) Checklist**: Structured list -- each item has label, required (toggle). Add/remove items.

**F) Pricing Metadata**: Price hint cents (optional number input, displayed as dollars), Pricing notes (optional textarea). Clear helper text: "For internal reference only."

### `src/components/admin/SkuDetailSheet.tsx`
Read-only detail view with Edit and Duplicate actions. Shows all fields in a clean layout. Archive action with confirmation.

Validation rules:
- Name required
- Description required
- At least 1 inclusion and 1 exclusion
- Duration must be set (> 0)
- Confirm dialog when changing fulfillment mode, photo count, or checklist count on an active SKU

---

## Step 5: Customer Services Page

### New route: `/customer/services`
Add to App.tsx inside customer routes (wrapped in CustomerPropertyGate).

### `src/pages/customer/Services.tsx`
- List of active SKUs (RLS handles filtering)
- Optional category filter
- Each card: name, short description, duration, fulfillment mode in plain English, weather badge
- Tap opens detail

### `src/pages/customer/ServiceDetail.tsx` (or inline sheet)
- Name + description
- "What's included" bullets (inclusions)
- "What's not included" bullets (exclusions)
- Timing: duration + fulfillment mode in plain English
- "How we confirm it's done": photo summary
- Price hint if exists (labeled "Estimated")

### Plain-English fulfillment mode map
```typescript
const modeLabels = {
  same_day_preferred: "Performed on your Service Day",
  same_week_allowed: "Completed within your service week",
  independent_cadence: "Scheduled on its own cycle",
};
```

---

## Step 6: Provider SKU Reference

No new page needed for now -- the PRD says "reusable detail view component." Create:

### `src/components/SkuDetailView.tsx`
Shared read-only component showing:
- Scope (inclusions/exclusions)
- Checklist items
- Required photos list
- Weather sensitivity
- Edge-case notes

Used by both admin detail sheet and provider reference. Provider page (`/provider/jobs`) will use this component in Module 09.

---

## Step 7: Navigation Updates

### Customer nav
Add "Services" entry to `customerNav` in AppSidebar.tsx and optionally to BottomTabBar (or accessible from "More" menu).

Route: `/customer/services`

---

## Files Impact

### New files
- `src/hooks/useSkus.ts` -- SKU CRUD hooks
- `src/components/admin/SkuListCard.tsx` -- SKU list row component
- `src/components/admin/SkuFormSheet.tsx` -- Create/edit form sheet
- `src/components/admin/SkuDetailSheet.tsx` -- Read-only detail sheet
- `src/components/SkuDetailView.tsx` -- Shared read-only SKU detail (reusable)
- `src/pages/customer/Services.tsx` -- Customer catalog browse
- `src/pages/customer/ServiceDetail.tsx` -- Customer SKU detail view

### Modified files
- `docs/modules/04-sku-catalog.md` -- Replace with new PRD
- `src/pages/admin/SKUs.tsx` -- Full implementation replacing placeholder
- `src/App.tsx` -- Add `/customer/services` and `/customer/services/:skuId` routes
- `src/components/AppSidebar.tsx` -- Add "Services" to customer nav

### Database changes
- Migration: add columns (`category`, `checklist`, `price_hint_cents`, `pricing_notes`, `edge_case_notes`, `updated_at`), alter nullability on existing columns, change default status, add trigger, update RLS

---

## Technical Notes

### Structured list input pattern (photos + checklist)
Reusable component pattern for adding/removing structured items within a form. Each item renders as a mini-form row with a remove button. "Add" button appends a new empty item.

### Photo requirement shape
```typescript
interface PhotoRequirement {
  label: string;
  when: "before" | "after" | "both";
  count: number;
  notes?: string;
}
```

### Checklist item shape
```typescript
interface ChecklistItem {
  label: string;
  required: boolean;
}
```

### Duplicate SKU logic
```typescript
// Fetch existing SKU, spread all fields, override:
// - Remove id (let DB generate)
// - name: `${original.name} (Copy)`
// - status: 'draft'
// - created_at/updated_at: let DB default
```

### Validation
- Block save if: no name, no description, empty inclusions, empty exclusions, duration <= 0
- Confirmation dialog if editing active SKU and changing: fulfillment_mode, required_photos count, checklist count

