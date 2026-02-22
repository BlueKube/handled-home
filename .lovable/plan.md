

# Module 06: Service Day Engine — Full Implementation Plan

## Overview
This module turns zone capacity governance into a real customer promise: a recurring Service Day that is assigned, confirmed, and tracked. It includes the assignment engine, customer confirm/reject flow, capacity enforcement, admin utilization views, and the 06.1 hardening layer (concurrency safety, offer expiry cleanup, alternative ordering strategy).

---

## Phase 1: Database Schema + RPCs

### 1A: New tables (single migration)

**`zone_service_day_capacity`**
- `id` uuid pk default gen_random_uuid()
- `zone_id` uuid not null references zones(id)
- `day_of_week` text not null
- `service_window` text not null default 'any'
- `max_homes` int not null
- `buffer_percent` int not null default 0
- `assigned_count` int not null default 0
- `updated_at` timestamptz default now()
- Unique constraint: `(zone_id, day_of_week, service_window)`

**`service_day_assignments`**
- `id` uuid pk default gen_random_uuid()
- `customer_id` uuid not null (references auth user, no FK to auth.users)
- `property_id` uuid not null references properties(id) (unique — one assignment per property)
- `zone_id` uuid not null references zones(id)
- `day_of_week` text not null
- `service_window` text not null default 'any'
- `status` text not null default 'offered' (offered, confirmed, superseded)
- `rejection_used` boolean not null default false
- `reserved_until` timestamptz null
- `reason_code` text null
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

**`service_day_offers`**
- `id` uuid pk default gen_random_uuid()
- `assignment_id` uuid not null references service_day_assignments(id)
- `offered_day_of_week` text not null
- `offered_window` text not null default 'any'
- `offer_type` text not null default 'primary' (primary, alternative)
- `rank` int not null default 1
- `accepted` boolean not null default false
- `created_at` timestamptz default now()

**`service_day_override_log`**
- `id` uuid pk default gen_random_uuid()
- `actor_admin_id` uuid not null
- `assignment_id` uuid not null references service_day_assignments(id)
- `before` jsonb not null
- `after` jsonb not null
- `reason` text not null
- `notes` text null
- `created_at` timestamptz default now()

**`service_day_preferences`** (optional, from 06.1)
- `id` uuid pk default gen_random_uuid()
- `customer_id` uuid not null
- `property_id` uuid not null references properties(id)
- `preferred_days` text[] not null default '{}'
- `created_at` timestamptz default now()

**Schema additions to `zones`** (from 06.1)
- `alternative_strategy` text not null default 'window_first'
- `offer_ttl_hours` int not null default 48

### 1B: RLS policies

- **service_day_assignments**: customer reads own (customer_id = auth.uid()), admin all
- **service_day_offers**: customer reads own (via assignment join), admin all
- **zone_service_day_capacity**: authenticated read, admin write
- **service_day_override_log**: admin insert + read only
- **service_day_preferences**: customer read/write own, admin read all

### 1C: Database RPCs (Postgres functions)

All core operations go through RPCs for atomicity and row-lock safety (06.1 requirement).

1. **`create_or_refresh_service_day_offer(p_property_id uuid)`**
   - Idempotent: returns existing active offer if valid, or creates new one
   - Looks up property zone, zone default day/window
   - SELECT FOR UPDATE on capacity row
   - If capacity available: increment, create assignment (status=offered, reserved_until = now + zone.offer_ttl_hours), create primary offer row
   - If default full: try alternatives per zone.alternative_strategy, create assignment with primary + up to 3 alternative offer rows
   - Returns assignment + offers as JSON

2. **`confirm_service_day(p_assignment_id uuid)`**
   - Validates caller owns assignment
   - Updates assignment status to 'confirmed'
   - Marks the matching offer as accepted=true
   - Returns success

3. **`reject_service_day_once(p_assignment_id uuid)`**
   - Validates rejection_used = false
   - Sets rejection_used = true
   - Generates 2-3 alternatives (capacity-checked, row-locked)
   - Inserts alternative offer rows
   - Returns alternatives

4. **`select_alternative_service_day(p_assignment_id uuid, p_offer_id uuid)`**
   - Single transaction: lock old capacity row (decrement), lock new capacity row (increment if available), update assignment day/window, mark offer accepted, set status=confirmed
   - Rollback if new capacity full

5. **`admin_override_service_day(p_assignment_id uuid, p_new_day text, p_new_window text, p_reason text, p_notes text)`**
   - Admin-only (checked via has_role)
   - Moves capacity atomically
   - Logs to service_day_override_log
   - Allows exceeding capacity with explicit flag

6. **`cleanup_expired_offers()`**
   - Finds status='offered' AND reserved_until < now()
   - Releases capacity, marks assignment 'superseded'
   - Called by scheduled edge function

### 1D: Triggers
- `updated_at` trigger on `service_day_assignments` and `zone_service_day_capacity`

### 1E: Seed capacity rows
- When a zone exists, admin needs to manually configure capacity rows per day/window, OR auto-seed from zone defaults (a one-time seed script or on-demand in admin UI)

---

## Phase 2: Edge Functions

### 2A: `cleanup-expired-offers` (scheduled, hourly)
- Calls the `cleanup_expired_offers()` RPC using service role key
- Runs every hour via cron configuration in config.toml
- Logs expired count

---

## Phase 3: React Hooks + Data Layer

### 3A: `useServiceDayAssignment` hook
- Fetches current customer's assignment (status in offered/confirmed) for their property
- Fetches associated offers
- Provides: assignment, offers, isLoading, refetch

### 3B: `useServiceDayActions` hook
- `createOrRefreshOffer(propertyId)` — calls RPC
- `confirmServiceDay(assignmentId)` — calls RPC
- `rejectServiceDay(assignmentId)` — calls RPC, returns alternatives
- `selectAlternative(assignmentId, offerId)` — calls RPC
- `savePreferences(propertyId, days[])` — upserts to service_day_preferences

### 3C: `useServiceDayCapacity` hook (admin)
- Fetches zone_service_day_capacity rows for a zone
- CRUD operations for capacity rows
- Utilization calculations

### 3D: `useServiceDayAdmin` hook (admin)
- Fetches all assignments for a zone (with customer/property joins)
- Override mutation (calls admin_override RPC)
- Stats: rejection count, override count, expiry count (last 7/30 days)

---

## Phase 4: Customer UI

### 4A: `/customer/service-day` page (new)
State machine UI with 4 states:

- **State 1 — Loading/No assignment**: "We're matching you to the best route." Auto-calls createOrRefreshOffer on mount if no assignment exists and subscription is active.
- **State 2 — Offer pending**: Shows assigned day + window + explanation template. "Confirm Service Day" button + "This day won't work" secondary button (if rejection not used).
- **State 3 — Rejected/Alternatives**: Shows 2-3 alternative cards to pick from. If no alternatives available: "Contact support" CTA + optional preference capture checkboxes.
- **State 4 — Confirmed**: "You're handled." Shows confirmed day. Teaser for Module 07 (routine builder).

### 4B: Customer dashboard banner update
Update `src/pages/customer/Dashboard.tsx` to show dynamic Service Day status:
- No assignment yet: "We're assigning your Service Day" banner
- Offer pending: "Confirm your Service Day" link to `/customer/service-day`
- Confirmed: "Your Service Day: Tuesday" badge (real data replacing current hardcoded "Tuesday")

### 4C: Routing
- Add `/customer/service-day` route in App.tsx, wrapped with CustomerPropertyGate + SubscriptionGate (service day requires active subscription)

---

## Phase 5: Admin UI

### 5A: `/admin/service-days` page (new)
A dedicated admin page (or tab under zones) showing:

**Zone list view:**
- Each zone row: name, default day, assigned/limit counts per day, stability indicator (Stable/Tight/Risk based on utilization %)

**Zone detail (sheet/drawer):**
- Utilization bars per day/window
- Assignment list (customer name, day, window, status)
- Capacity configuration (max_homes per day/window, buffer %)
- Override button per assignment (opens modal with reason dropdown, notes, capacity warning, "Force anyway" typed confirm)
- Health stats from 06.1: expiry count (7d), reject rate (30d), override count (30d), tightness reason string

### 5B: Admin routing
- Add `/admin/service-days` route in App.tsx
- Add "Service Days" to admin MoreMenu or bottom tab bar

### 5C: Update ZoneCapacityPanel
- Replace the "Scheduling starts in Module 06" placeholder with real assigned_count from zone_service_day_capacity
- Show actual utilization

---

## Phase 6: Hardening (06.1 items built inline)

These are incorporated into the phases above rather than a separate pass:
- Row locking: built into all RPCs (Phase 1C)
- Offer TTL + cleanup: built into schema (Phase 1A) and edge function (Phase 2A)
- Alternative strategy (window-first/day-first): built into create_or_refresh RPC logic + zones column (Phase 1A/1C)
- Override audit UX: built into admin UI (Phase 5A)
- Preference capture: built into customer reject flow (Phase 4A)
- Explainable assignment templates with reason codes: built into RPCs + customer UI

---

## Implementation Sequence

The work should be done in this order due to dependencies:

```text
Phase 1 (DB)  -->  Phase 2 (Edge fn)  -->  Phase 3 (Hooks)
                                               |
                                        +------+------+
                                        |             |
                                   Phase 4         Phase 5
                                  (Customer)       (Admin)
```

1. Phase 1: Migration + RPCs + RLS (foundation, everything depends on this)
2. Phase 2: Cleanup edge function (can deploy immediately after schema)
3. Phase 3: React hooks (depends on schema + RPCs existing)
4. Phase 4 + 5: Customer and Admin UI (can be built in parallel, both depend on hooks)

---

## Technical Notes

- All capacity mutations use `SELECT ... FOR UPDATE` row locks in Postgres RPCs to prevent race conditions
- The `create_or_refresh_service_day_offer` RPC is idempotent — safe to call on page load
- No foreign keys to `auth.users` — customer_id references are enforced via RLS (auth.uid())
- The existing `admin_audit_log` table can be used alongside `service_day_override_log` for broader audit visibility
- The `zones.alternative_strategy` column controls whether alternatives are generated window-first or day-first
- The `zones.offer_ttl_hours` column makes TTL configurable per zone (default 48h)
- The cleanup edge function should be registered in `supabase/config.toml` with `verify_jwt = false` (called by cron, not users)

## Files Created/Modified Summary

**New files:**
- `src/pages/customer/ServiceDay.tsx`
- `src/pages/admin/ServiceDays.tsx`
- `src/hooks/useServiceDayAssignment.ts`
- `src/hooks/useServiceDayActions.ts`
- `src/hooks/useServiceDayCapacity.ts`
- `src/hooks/useServiceDayAdmin.ts`
- `src/components/customer/ServiceDayOffer.tsx` (offer card component)
- `src/components/customer/ServiceDayConfirmed.tsx`
- `src/components/customer/ServiceDayAlternatives.tsx`
- `src/components/admin/ServiceDayZoneDetail.tsx`
- `src/components/admin/ServiceDayOverrideModal.tsx`
- `supabase/functions/cleanup-expired-offers/index.ts`

**Modified files:**
- `src/App.tsx` (add routes)
- `src/components/MoreMenu.tsx` (add Service Days to admin menu)
- `src/pages/customer/Dashboard.tsx` (dynamic Service Day banner)
- `src/components/admin/ZoneCapacityPanel.tsx` (replace placeholder with real data)

