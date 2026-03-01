
# Sprint 3C — Growth Surfaces + Add Service Drawer + Home Restructure

## What & Why

Sprint 3C transforms the customer Home tab from a passive dashboard into an active growth engine. It adds a **suggestion system** (smart, throttled, suppressible), an **Add Service Drawer** (universal entry point from Home/Routine/Membership), and restructures the Home stack to always show an action path. This is the conversion layer that drives attach rate (services per household per cycle).

**Depends on:** 3A (Levels) + 3B (Coverage Map + Property Signals) — both complete.

---

## Phase 1: Suggestion Engine Schema + RPC (Database)

### Migration 1: Suggestion tables

**Table: `suggestion_suppressions`**
- `id` uuid PK default gen_random_uuid()
- `property_id` uuid FK → properties(id) ON DELETE CASCADE
- `sku_id` uuid FK → service_skus(id) ON DELETE CASCADE (nullable — null means suppress whole category)
- `category` text (nullable — for category-level suppression)
- `reason` text NOT NULL (already_have_someone, not_relevant, too_expensive, not_now)
- `suppressed_until` timestamptz NOT NULL (default now() + 90 days)
- `created_at` timestamptz default now()
- Unique constraint on (property_id, sku_id) WHERE sku_id IS NOT NULL
- RLS: customer own-property INSERT/SELECT/DELETE, admin all

**Table: `suggestion_impressions`**
- `id` uuid PK default gen_random_uuid()
- `property_id` uuid FK → properties(id) ON DELETE CASCADE
- `sku_id` uuid FK → service_skus(id) ON DELETE CASCADE
- `surface` text NOT NULL (home, drawer, routine, receipt)
- `created_at` timestamptz default now()
- RLS: customer own-property INSERT/SELECT, admin all
- Index on (property_id, sku_id, created_at DESC)

**Table: `suggestion_actions`**
- `id` uuid PK default gen_random_uuid()
- `property_id` uuid FK → properties(id) ON DELETE CASCADE
- `sku_id` uuid FK → service_skus(id) ON DELETE CASCADE
- `action` text NOT NULL (added, dismissed, hidden)
- `reason` text (for hidden: already_have_someone, not_relevant, too_expensive, not_now)
- `metadata` jsonb default '{}'
- `created_at` timestamptz default now()
- RLS: customer own-property INSERT/SELECT, admin all

### Migration 2: `get_service_suggestions` RPC

SECURITY DEFINER RPC accepting `p_property_id uuid, p_surface text` returning jsonb array of suggestions.

Logic:
1. Get property coverage (eligible categories from `get_property_profile_context`)
2. Get property sizing signals
3. Get existing routine SKU IDs (exclude from suggestions)
4. Get active suppressions (exclude suppressed SKUs)
5. Get impression counts (exclude SKUs with ≥2 impressions in last 14 days)
6. Score remaining SKUs by:
   - Coverage status: NONE = 10, SELF (high-pain) = 7, SELF (other) = 3, PROVIDER = 1
   - Seasonality: month-based boost for windows/gutters/power_wash (+5 in season)
   - Home sizing: large home + outdoor category = +3
7. Return top N (4 for home, 6 for drawer) with:
   - sku_id, sku_name, category, default_level (id, label, handles_cost), reason string, suggestion_type (best_next / seasonal / adjacent)

---

## Phase 2: Frontend Hooks + Suggestion Infrastructure

### 2a. `useSuggestions` hook
- Calls `get_service_suggestions` RPC
- Accepts surface param (home/drawer)
- Returns typed suggestion array
- `useQuery` with 5-min stale time

### 2b. `useSuggestionActions` hook
- `recordImpression(skuId, surface)` — inserts to suggestion_impressions
- `hideSuggestion(skuId, reason)` — inserts to suggestion_suppressions + suggestion_actions
- `recordAdd(skuId)` — inserts to suggestion_actions with action='added'
- All mutations invalidate suggestions query

### 2c. `SuggestionCard` component
- Compact card: SKU name, default level label, handles cost, one-line reason
- "Add" button (primary, one-tap)
- "×" dismiss with reason popover (already_have_someone, not_relevant, too_expensive, not_now)
- Records impression on mount (once per session per SKU)

---

## Phase 3: Add Service Drawer

### 3a. `AddServiceDrawer` component (Sheet/Drawer)
- Header: "Add a service" / "Recommendations are tailored to your home."
- Section 1 — Best Next: top 4 SuggestionCards from useSuggestions(surface='drawer')
- Section 2 — Seasonal: up to 2 seasonal suggestions (filtered by type)
- Section 3 — Browse All: CTA button → opens existing AddServicesSheet catalog
- Section 4 — Switch placeholder: if coverage shows PROVIDER + OPEN_NOW/LATER, show "Switch a service" info link (routes to informational page, full switch flow deferred to 3D)

### 3b. Floating "+ Add" button
- Fixed bottom-right FAB on Home, Routine, Membership pages
- Opens AddServiceDrawer
- Uses framer-motion for entrance animation

### 3c. One-tap add flow
- Tap "Add" on suggestion → compact confirmation sheet:
  - SKU name, what's included, handles cost
  - Level selector (pre-selected to default)
  - Cadence selector (if routine service)
  - "Add to Routine" confirm button
- On confirm: add to routine via existing `useAddRoutineItem`, show success toast with 10-second undo
- Undo: remove the just-added item

---

## Phase 4: Home Tab Restructure

### 4a. Restructure Dashboard.tsx into the new stack:

**Section A — Next Up (always first)**
- Service day assigned + upcoming job: NextVisitCard (already exists)
- Service day not assigned: "We're preparing your Service Day" (already exists as banner)
- No routine: "Start your routine" CTA card

**Section B — This Cycle: Your Routine**
- Compact summary: # services active, handles usage bar, top 3 routine service pills
- CTA: "Edit routine" → /customer/routine

**Section C — Suggested for Your Home**
- 2–4 SuggestionCards from useSuggestions(surface='home')
- Section header: "Suggested for Your Home"

**Section D — Recent Receipt**
- Last completed job receipt card (or mocked preview if none)

### 4b. Remove from Home
- Redundant stat cards that duplicate info in the new sections
- Empty-state cards that say "wait" with no action

---

## Phase 5: Routine + Receipt Surfaces

### 5a. Routine page
- Add "Suggested adjacent service" card at bottom of routine item list (1 suggestion)
- Per-item "Upgrade level" quick action (already partially exists from 3A-14)

### 5b. Receipt growth surface
- At bottom of VisitDetail: 1–2 suggestion cards ("While we're here next time")
- Only for completed visits, tightly related to completed SKU category

---

## Phase 6: Instrumentation

### 6a. Growth event tracking
- Drawer opens → suggestion_actions (action='drawer_open')
- Suggestion impressions → suggestion_impressions table
- Suggestion adds → suggestion_actions (action='added')
- Suggestion hides → suggestion_actions (action='hidden', reason)
- All via useSuggestionActions hook (already wired in Phase 2)

---

## Implementation Order

1. **Phase 1** — DB migration (tables + RPC) — must be first
2. **Phase 2** — Hooks + SuggestionCard component
3. **Phase 3** — Add Service Drawer + FAB + one-tap add
4. **Phase 4** — Home restructure
5. **Phase 5** — Routine + Receipt surfaces
6. **Phase 6** — Instrumentation (mostly done via Phase 2 hooks)

---

## Deferred to 3D
- Full switch flow (Switch Kit)
- Ops Cockpit integration for suggestion analytics
- Advanced experimentation / A/B framework
