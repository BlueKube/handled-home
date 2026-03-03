

# PRD-300 Sprint 1 — Foundations: Data Model + Geo Index + Schedule States

## What We Are Building
The scheduling and routing foundation: visits with bundled tasks, a schedule state machine, provider capability expansion (home base geo, equipment, working hours, capacity), geo indexing for providers, scheduling policy dials in admin, and customer-facing visit status labels.

## Existing Assets We Reuse
- `properties.lat`, `properties.lng`, `properties.geohash` — already exist
- `provider_capabilities` — extend, don't replace
- `admin_system_config` — use for scheduling policy dials
- `jobs` table — remains as-is; visits layer on top
- `service_skus.duration_minutes` — already exists

## What Is New

### Database (new tables + columns)
1. **`visits`** table — groups tasks at one property on one date; has schedule state, optional time window, ETA range, plan version
2. **`visit_tasks`** table — one per service task within a visit; links to SKU, has duration estimate and presence_required flag
3. **`visit_schedule_state` enum** — `planning`, `scheduled`, `dispatched`, `in_progress`, `complete`, `exception_pending`, `canceled`, `rescheduled`
4. **`provider_work_profiles`** table — home base lat/lng/geohash, max_jobs_per_day, working_hours (jsonb), equipment_kits (text[])
5. **`service_skus` column addition** — `presence_required boolean default false`
6. **Scheduling policy config rows** seeded into `admin_system_config` — `scheduling.appointment_window_minutes`, `scheduling.eta_range_display`, `scheduling.arrival_notification_minutes`, `scheduling.preference_pricing_mode`

### Frontend
7. **Admin → Settings → Scheduling tab** — policy cards for the 4 dials with audit reason on save
8. **Provider → Work Setup page** — 3-step stepper (Location → Services → Schedule) for home base, categories, equipment, hours
9. **Customer → Upcoming visits** — list cards with date + ETA range + customer-friendly status labels + "How scheduling works" disclosure

---

## Phases

### Phase 1 — Schema Migration
- Create `visit_schedule_state` enum
- Create `visits` table (id, property_id, provider_org_id, scheduled_date, schedule_state, time_window_start, time_window_end, eta_range_start, eta_range_end, route_plan_version, locked_at, draft_generated_at, created_at, updated_at)
- Create `visit_tasks` table (id, visit_id FK, sku_id FK, duration_estimate_minutes, presence_required, status, notes, created_at)
- Create `provider_work_profiles` table (provider_org_id PK FK, home_lat, home_lng, home_geohash, home_address_label, max_jobs_per_day, working_hours jsonb, equipment_kits text[], created_at, updated_at)
- Add `presence_required` column to `service_skus`
- Seed 4 scheduling config rows into `admin_system_config`
- RLS policies for all new tables
- Indexes: visits(property_id, scheduled_date), visits(provider_org_id, scheduled_date), visit_tasks(visit_id), provider_work_profiles(home_geohash)

### Phase 2 — Admin Scheduling Policy UI
- New scheduling settings tab at Admin → Settings (or dedicated route)
- Policy cards: appointment window length (dropdown), ETA range display (toggle), arrival notification minutes (numeric input), preference pricing mode (badge/toggle)
- Each card has "what it affects" + "when it takes effect" + tooltip
- Save requires audit reason modal
- Wired to `admin_system_config` upsert with `updated_by_user_id`
- Hook: `useSchedulingPolicy` — reads resolved values

### Phase 3 — Provider Work Setup Page
- New route: `/provider/work-setup`
- 3-step stepper: Location (address/map pin → lat/lng/geohash) → Services (multi-select categories + equipment kits) → Schedule (weekly hours builder + max jobs/day)
- "Why we ask" microcopy on each step
- Wired to `provider_work_profiles` upsert
- Accessible from Provider Profile nav

### Phase 4 — Customer Upcoming Visits View
- Update customer dashboard or create `/customer/upcoming` route
- List cards: date, ETA range (placeholder if not computed), customer-friendly status label (Planning / Scheduled / Today / In Progress / Completed)
- "How scheduling works" expandable disclosure with calm messaging
- Query `visits` + `visit_tasks` for the logged-in customer's properties
- Provider home base never exposed

---

## Technical Details

### Visit State Machine Transitions
```text
planning → scheduled → dispatched → in_progress → complete
planning → canceled
scheduled → canceled | rescheduled | exception_pending
dispatched → in_progress | exception_pending
exception_pending → rescheduled | canceled
```

### Privacy
- `provider_work_profiles` RLS: provider reads/writes own org; admin reads all; no customer access
- `visits` RLS: customer reads own (via property_id → user_id join); provider reads assigned; admin reads all

### Scheduling Policy Config Keys
| Key | Default | Type |
|-----|---------|------|
| `scheduling.appointment_window_minutes` | `120` | number |
| `scheduling.eta_range_display` | `"day_plus_range"` | string |
| `scheduling.arrival_notification_minutes` | `15` | number |
| `scheduling.preference_pricing_mode` | `"scarcity"` | string |

