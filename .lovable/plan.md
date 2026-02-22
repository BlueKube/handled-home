

# Module 07 Seasonal Services Implementation Plan

Based on the Module 07 Addendum (Section 19), this plan implements Seasonal Services as a clean layer on top of the existing routine/bundle system.

---

## Phase 1: Database Schema (Migration)

### Tables to create

**1) `seasonal_service_templates`**
- id, sku_id (FK → service_skus), name, description, default_windows (jsonb), is_active, created_at, updated_at
- RLS: authenticated can read active templates; admin manages all

**2) `zone_seasonal_service_rules`**
- id, zone_id (FK → zones), seasonal_template_id (FK → seasonal_service_templates), is_enabled, price_override_cents, windows_override (jsonb), capacity_reserve_rule (jsonb), created_at, updated_at
- RLS: authenticated can read enabled rules; admin manages all

**3) `customer_seasonal_selections`**
- id, customer_id, property_id (FK → properties), zone_id (FK → zones), seasonal_template_id (FK → seasonal_service_templates), selection_state (off/included/upsell), window_preference (early/mid/late), year, source (bundle_builder/support/promo), created_at, updated_at
- RLS: customers manage own (customer_id = auth.uid()); admin reads all

**4) `seasonal_orders`**
- id, customer_id, property_id (FK → properties), zone_id (FK → zones), seasonal_template_id (FK → seasonal_service_templates), year, pricing_type (included/upsell), price_cents, status (planned/scheduled/completed/canceled), planned_window_start (date), planned_window_end (date), scheduled_service_day_id (uuid nullable), created_at, updated_at
- RLS: customers manage own; admin manages all

### updated_at triggers
- On all 4 tables

---

## Phase 2: Hooks & Logic

### New hooks

**`src/hooks/useSeasonalTemplates.ts`**
- Fetch active seasonal templates for a zone (joined with zone_seasonal_service_rules)
- Returns template list with zone-specific pricing, windows, and enabled status

**`src/hooks/useSeasonalSelections.ts`**
- CRUD for customer_seasonal_selections for a property/year
- Toggle selection state, update window preference
- Manage "skip this year" (set selection_state = 'off')

**`src/hooks/useSeasonalOrders.ts`**
- Read seasonal_orders for a customer/property/year
- Create/update orders when selections change
- Compute planned window dates from template windows + preference (early/mid/late)

### Window date computation utility

**`src/lib/seasonal.ts`**
- `computeWindowDates(windows, preference, year)` → { start: Date, end: Date }
  - Early = first third, Mid = middle third, Late = last third
- `getEffectiveWindows(template, zoneRule)` → use zone override if present, else template defaults

### Entitlement extension

- Check if plan includes seasonal credits (future: add `seasonal_credits_per_year` to plan_entitlement_versions)
- For now: seasonal items are upsell-only unless plan has seasonal credits configured
- If credits exceeded, flag remaining as upsell

---

## Phase 3: Customer UI

### A) "Seasonal Boosts" section in Build Routine (`/customer/routine`)

**New component: `src/components/routine/SeasonalBoostsSection.tsx`**
- Rendered below the existing routine items section
- Fetches seasonal templates for the customer's zone
- Each item shows:
  - Name, description, duration range, price or "Included"
  - Recommended windows (e.g., "May–Jun")
  - Window preference picker: Early / Mid / Late toggle
  - ON/OFF toggle
  - Proof requirements badge
- Toggling ON creates a customer_seasonal_selection + seasonal_order
- Toggling OFF updates selection_state to 'off' and cancels the order

### B) Review step additions (`/customer/routine/review`)

**New component: `src/components/routine/SeasonalYearStrip.tsx`**
- 12-month horizontal strip showing planned seasonal windows
- Each month block highlights if a seasonal item is planned in that window
- Labels like "Planned in Oct (Mid)"
- Rendered below the existing 4-week preview

### C) Customer Dashboard — "Seasonal Plan" card

**New component: `src/components/customer/SeasonalPlanCard.tsx`**
- Shows upcoming seasonal items for the current year
- Window preference can be changed inline
- "Skip this year" button
- Status badges: Planned → Scheduled → Completed

Add to `src/pages/customer/Dashboard.tsx`

---

## Phase 4: Admin UI

### A) Admin seasonal management

**New component: `src/components/admin/ZoneSeasonalPanel.tsx`**
- Embedded in ZoneDetailSheet as a new "Seasonal" tab
- Lists seasonal templates with toggle to enable/disable per zone
- Price override input
- Window override inputs (start/end month-day)
- Capacity reserve rule (simple % or max count)

### B) Admin seasonal templates management

**New page or section in `/admin/skus`**
- Create/edit seasonal_service_templates
- Link to existing SKU catalog
- Set default windows
- Toggle active/inactive

---

## Phase 5: Capacity & Billing Integration

### Capacity soft check
- When creating a seasonal_order, check zone capacity for the planned window
- If oversubscribed, show warning and suggest alternative window
- Simple implementation: count existing planned orders in the same window period

### Billing (minimal)
- Upsell seasonal items: store price_cents on seasonal_order
- Actual payment integration deferred to Module 11 (billing)
- For now: create the order record with pricing info for future billing

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/seasonal.ts` | Window date computation utilities |
| `src/hooks/useSeasonalTemplates.ts` | Fetch seasonal templates for a zone |
| `src/hooks/useSeasonalSelections.ts` | CRUD customer seasonal selections |
| `src/hooks/useSeasonalOrders.ts` | Manage seasonal orders |
| `src/components/routine/SeasonalBoostsSection.tsx` | Seasonal section in routine builder |
| `src/components/routine/SeasonalYearStrip.tsx` | 12-month visual strip for review |
| `src/components/customer/SeasonalPlanCard.tsx` | Dashboard seasonal plan card |
| `src/components/admin/ZoneSeasonalPanel.tsx` | Admin zone seasonal config |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/customer/Routine.tsx` | Add SeasonalBoostsSection below routine items |
| `src/pages/customer/RoutineReview.tsx` | Add SeasonalYearStrip below 4-week preview |
| `src/pages/customer/Dashboard.tsx` | Add SeasonalPlanCard |
| `src/components/admin/ZoneDetailSheet.tsx` | Add "Seasonal" tab with ZoneSeasonalPanel |

---

## Implementation Order

1. **Database migration** — Create all 4 tables with RLS + triggers
2. **Utility + hooks** — seasonal.ts, useSeasonalTemplates, useSeasonalSelections, useSeasonalOrders
3. **Customer UI** — SeasonalBoostsSection, SeasonalYearStrip, SeasonalPlanCard
4. **Admin UI** — ZoneSeasonalPanel in ZoneDetailSheet
5. **Integration** — Wire into existing Routine.tsx, RoutineReview.tsx, Dashboard.tsx

---

## Backward Compatibility

- All seasonal sections render only if seasonal templates exist for the zone
- Default state is OFF — no seasonal items selected
- Existing routine/bundle flows are completely unaffected
- No changes to existing tables or RPCs
