# Module 03: Zones, Coverage & Capacity
> **Implementation Status:** ✅ Implemented in Round 1. Round 2B added zone_category_providers (Primary/Backup model), expansion_suggestions, waitlist_entries.

**Handled Home — PRD (Governance Layer, no scheduling yet)**  
**Customer + Provider:** Mobile-only  
**Admin Console:** Mobile-optimized, operationally usable  
**Primary Admin Route:** `/admin/zones`  
**Last updated:** 2026-02-21  

---

## 0) Why this module exists

Handled Home is **density-based**, not on-demand.

Zones are the foundation of:
- Service Day assignment (future modules)
- Capacity control
- Expansion strategy
- Provider allocation
- Operational efficiency

This module creates the **territory governance layer**: where we operate, how we staff it, and how much load we can support—without implementing scheduling yet.

---

## 1) Core intent (how this should feel)

### Admin should feel
> “I can launch a new city in 10 minutes.”

### Customers should feel
> “This just works.”

### Product qualities
- Clean
- Controlled
- Predictable
- Operationally powerful
- Easy for admin to manage
- Invisible but effective for customers

---

## 2) Scope

### In scope (Module 03 delivers)
- **Region** structure (organizational grouping)
- **Zone** structure (zip-based territory definition)
- **Coverage logic** (zip → zone mapping; “covered vs not covered”)
- **Default service day pattern** per zone (governance only)
- **Capacity settings** per zone (governance only)
- **Provider assignment mapping** (primary + backup providers per zone)
- **Admin Console UI** for regions/zones/capacity/provider assignment
- **Insights panels** (AI-ready “wow” features):
  - Smart adjacent-zip suggestions
  - Zone health indicator (advisory)
  - Expansion signals (non-serviced zip demand)

### Explicitly out of scope
- Route optimization
- Calendar assignment
- Auto-scheduling
- Service day generation
- Subscription gating
- Dispatching + job creation

---

## 3) Conceptual model

Hierarchy:

**Region** (e.g., Los Angeles County)  
→ **Zones** (e.g., “Westlake Village – Tuesday”)  
→ Zone rules:
- Default service day pattern
- Capacity limits
- Assigned providers (primary + backup)

Zones determine:
- Whether a customer is serviced
- Which day pattern they should eventually receive
- Which providers can fulfill jobs (future)
- How many homes can be handled per day (future enforcement)

---

## 4) Customer experience requirements (passive, no new UI)

This module **enhances but does not block** customers.

### 4.1 Coverage awareness (passive)
When customer zip is covered:
- System can identify the customer’s **active zone**

When not covered:
- System flags the property as **non-serviced area**
- Future modules can use this for waitlist, expansion notifications, etc.

**No new customer screens are required in Module 03.**  
(Accuracy of zip → zone mapping is the deliverable.)

---

## 5) Admin Console requirements

### 5.1 Route and information architecture
Route: **`/admin/zones`**

Single page, mobile-friendly, with 3 tabs (top segmented control):
1) **Regions**
2) **Zones**
3) **Insights**

> “Don’t make me think” rule: keep the admin experience in one place with predictable tabs.  

---

## 6) Regions (Admin)

### 6.1 Admin can create region
Fields:
- **Name** (required) — “Los Angeles County”
- **State** (required) — “CA”
- **Status** (required)
  - `active`
  - `paused`

Notes:
- Regions are **organizational only**.
- No geospatial shapes in Module 03.

### 6.2 Admin can edit region
- Update name, state, status

### 6.3 Admin can archive region (soft delete)
- Status becomes `archived`
- Archived regions remain in DB for reporting/history
- Archived regions:
  - Do not appear in create/edit zone selects (unless “show archived” toggle is enabled)

---

## 7) Zones (Admin)

### 7.1 Create zone
Fields:
- **Zone name** (required)  
  Example: “Westlake Village – Tuesday”
- **Region** (required)  
  Select from active regions
- **Zip codes** (required)  
  Mobile-friendly input:
  - Comma-separated entry
  - Auto-normalize: trim spaces, keep 5-digit strings only
- **Default Service Day Pattern** (required)
  - Day of week: monday…sunday
  - Optional service window:
    - `AM`, `PM`, or `Any` (optional, default Any)
- **Status** (required)
  - `active`
  - `paused`
  - `expansion_planned`

### 7.2 Edit zone
- Update zip list
- Update default day pattern
- Update status

### 7.3 Archive zone (soft delete)
- “Delete” action sets zone status to `archived`
- Archived zones:
  - Do not match customer coverage lookups
  - Remain for audit/history

### 7.4 Admin list view requirements
Zone list rows should be extremely scannable:

Row shows:
- Zone name
- Region name
- Status pill
- Default day pattern (e.g., “Tue • AM”)
- Zip count (e.g., “14 zips”)
- Capacity quick view (e.g., “Max homes/day: 25”)
- Provider summary (e.g., “2 primary • 1 backup”)

Row tap → Zone detail screen (inline sheet modal on mobile preferred):
- “Details”
- “Capacity”
- “Providers”

---

## 8) Capacity settings per zone (governance only)

Each zone has:
- **Max homes per service day** (required)
- **Max service minutes per day** (optional but future-proof)
- **Buffer %** (required, default 0)
  - “Overbooking tolerance” (advisory for now)

### 8.1 Admin UX requirements
Capacity should feel easy to understand.

On zone detail:
- Inputs:
  - Max homes/day
  - Max minutes/day
  - Buffer %
- A read-only indicator box:
  - **“Capacity: 18 / 25 scheduled”**
  - In Module 03, “scheduled” can be shown as `0` if scheduling not implemented yet.
  - If the repo already has a scheduling table later, show real counts; otherwise show `0` with label “Scheduling starts in Module 06.”

### 8.2 Automation rules (future-safe)
Zone changes must NOT:
- Retroactively delete customer properties
- Silently remove associations
- Reduce capacity without warning (future)

**Rule now:** if admin reduces max homes/day below current “scheduled count” (if available), show warning and require confirm.

---

## 9) Provider assignment (Admin)

### 9.1 Goal
Maintain a clear mapping of:
- Primary provider(s)
- Backup provider(s)

No routing logic yet—just the relationship.

### 9.2 UI requirements
On zone detail → Providers:
- List all users with role `provider`
- Two toggles per provider:
  - Primary (on/off)
  - Backup (on/off)
- Rules:
  - Provider can be both primary and backup (allowed, but UI should discourage with a hint)
  - At least one primary is recommended (warn, don’t block)

---

## 10) Coverage logic (system behavior)

### 10.1 Active coverage definition
A property is **covered** when:
- Property.zip_code matches any zip in `zones.zip_codes`
- The zone status is `active`
- The zone’s region is `active` (if region status exists)

### 10.2 Match priority
If a zip exists in multiple active zones (shouldn’t happen, but possible):
- Choose the most recently updated zone (or first by created_at)
- Log an admin-visible warning in future reporting
- Do not block; keep coverage predictable

### 10.3 Suggested helper (optional implementation)
Create a DB view or RPC:
- `get_active_zone_for_zip(zip TEXT)` → returns zone + region metadata
This keeps matching consistent across Customer + Admin surfaces.

---

## 11) AI-enhanced features (wow, but lightweight)

### 11.1 Smart Zone Suggestion (Admin Assist)
When admin enters zip codes in a zone:
- System suggests adjacent zip codes that appear “nearby” operationally.

**Lightweight implementation (Module 03):**
- Suggest zips that exist in other zones in the same region (or any region) that share a prefix (first 3 digits), but aren’t included yet.
- Also suggest zips from “top non-serviced demand” list (see 11.3) that match the prefix.

UI:
- “Suggestions” chip row:
  - “Add 91361”
  - “Add 91362”
Tap chip → adds zip to input list.

This is not true AI yet, but it feels smart and sets up future clustering.

### 11.2 Density Health Indicator (AI-ready)
Each zone shows a “Zone Health Score” (advisory only).

Inputs:
- Homes signed up in zone (count of properties with zip mapped to this zone)
- Capacity per day (max_homes_per_day)
- Utilization ratio = homes / capacity

Display:
- **Green:** healthy density
- **Yellow:** under-utilized
- **Red:** over-capacity risk

Suggested thresholds (tunable):
- Green: 0.60 – 0.95
- Yellow: < 0.60
- Red: > 0.95

UI:
- Small colored dot + label (Healthy / Under-filled / Over capacity risk)
- Tooltip (or helper text): “Advisory. Scheduling enforcement begins in Module 06.”

### 11.3 Expansion Signal Dashboard
On `/admin/zones` → Insights tab:
- “Top non-serviced zip codes by signups”
- Show:
  - Zip code
  - Count of properties in that zip
  - Optional: suggested region (if state/region data exists)

Definition:
- A “non-serviced zip” = any property.zip_code that has **no active zone** match.

Query:
- Group properties by zip_code
- Filter out zip_codes covered by active zones
- Order by count desc

---

## 12) Data model (Supabase)

### 12.1 Existing tables (from repo schema)
- `regions`
  - `id`, `name`, `status`, `created_at`
- `zones`
  - `id`, `region_id`, `name`, `zip_codes` (text[]), `default_service_day` (day_of_week),
  - `max_stops_per_day`, `max_minutes_per_day`, `status`, `created_at`

### 12.2 Additive fields (allowed in Module 03)
To meet the module outcomes, add non-breaking columns (nullable defaults).

#### `regions` additions
- `state` TEXT NOT NULL DEFAULT 'CA'
- Expand `status` allowed values (still TEXT):
  - `active`, `paused`, `archived`

#### `zones` additions
- `buffer_percent` INT NOT NULL DEFAULT 0
- `default_service_window` TEXT NULL  
  Allowed values: `am`, `pm`, `any` (store lowercase)
- Expand `status` allowed values:
  - `active`, `paused`, `expansion_planned`, `archived`
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now() (recommended for conflict resolution + ordering)

### 12.3 New mapping table (provider assignments)
Create a join table (required for this module):

#### `zone_provider_assignments`
- `id` UUID PK default gen_random_uuid()
- `zone_id` UUID FK → zones.id (cascade delete ok)
- `provider_user_id` UUID FK → auth.users.id
- `assignment_type` TEXT NOT NULL  
  Allowed: `primary`, `backup`
- `created_at` timestamptz default now()

Constraints:
- Unique: `(zone_id, provider_user_id, assignment_type)`

---

## 13) Security & RLS

### 13.1 Regions / zones
- Read: **authenticated** can read (already true in repo migrations)
- Write: **admins only**

### 13.2 Zone provider assignments
Policies:
- Read:
  - Admins can read all
  - Providers can read rows where `provider_user_id = auth.uid()` (so provider app can show assigned zones later)
- Write:
  - Admins only

---

## 14) Admin UX flow (three mindless clicks)

### Create a new city (region)
1) Admin → `/admin/zones` → Regions tab  
2) Tap “New Region”  
3) Enter name + state → Save

### Launch a new zone
1) Zones tab → “New Zone”  
2) Enter zone details + zips + default day → Save  
3) On Zone detail → Providers tab → toggle primary/backup

### Check expansion demand
1) Insights tab  
2) “Non-serviced zip demand” list  
3) Tap a zip → quick action “Create zone with this zip” (prefill)

---

## 15) Non-goals and guardrails

- Do not implement geospatial polygons
- Do not implement scheduling
- Do not auto-migrate customers into new zones in a way that breaks their property
- Do not hide destructive actions:
  - “Delete” must be “Archive” with clear wording

---

## 16) Acceptance tests (Module 03)

1) Admin can create region (name, state, status).  
2) Admin can create zone with zip codes + default day + optional window.  
3) Zone appears in list with correct summary fields.  
4) Editing a zone updates coverage behavior (zip → zone).  
5) Customer with matching zip is recognized as covered (active zone only).  
6) Capacity fields persist (max homes/day, max minutes/day, buffer%).  
7) Provider assignment persists (primary/backup).  
8) Zone Health indicator renders without error (even if scheduling count is 0).  
9) Non-serviced zip counts display in expansion insight panel.

---

## 17) Definition of done

Zones can be created, edited, and archived, and they govern coverage reliably.

Admin can clearly see:
- Where we operate (regions + zones)
- How much capacity exists (per zone)
- Where expansion demand is forming (non-serviced zip insights)

The system is stable enough to support the upcoming Subscription Engine and Service Day modules.
