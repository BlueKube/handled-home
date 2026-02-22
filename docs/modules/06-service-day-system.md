# 06-service-day-system.md  
**Handled Home — Module 06 PRD (Service Day Engine: Assign → Confirm → Track)**  
**Mobile:** iOS + Android (Capacitor) — Customer + Provider  
**Admin Console:** Mobile-optimized, operationally usable  
**Primary Customer Routes:** `/customer/service-day`, `/customer/dashboard`  
**Primary Admin Route:** `/admin/service-days` (or add a “Service Days” tab under `/admin/zones`)  
**Last updated:** 2026-02-21  

---

## 0) Why this module exists

Handled Home is **density-based**. A subscription only feels premium if a customer:
- knows **exactly** what day to expect service  
- trusts the schedule is stable and “handled”  
- cannot create chaos by browsing calendars and self-booking  

Module 06 turns zones + capacity governance into a real customer promise:

> “This is your Service Day. It recurs. It’s predictable.”

---

## 1) Core intent (how this should feel)

### Customer
- “I didn’t have to think. They picked the right day.”  
- “If it doesn’t work, I can reject once and get a couple reasonable options.”  
- “This feels premium and controlled—not cheap and chaotic.”  

### Ops/Admin
- “We control density and capacity.”  
- “We can shift defaults without breaking trust.”  
- “No one can spam reschedules.”  

### Provider (light touch)
- “I know which zones/days I’m responsible for.”  
- “Workload doesn’t whipsaw.”  

---

## 2) Scope

### 2.1 In scope (Module 06 delivers)

A) **Service Day Assignment Engine**
- Assign a recurring **day-of-week** (+ optional window: AM/PM/Any) to each customer based on:
  - property’s active zone (Module 03)  
  - zone default service day pattern (Module 03)  
  - zone capacity (Module 03 + tracked assignments)  
  - provider assignment mapping (Module 03; feasibility signal only)  
- Create a **Service Day Offer** for customer confirmation

B) **Customer confirm / one-time reject flow**
- Customer sees assigned day, confirms  
- Customer may reject **once**  
- On reject, system offers **2–3 controlled alternatives max**  
- After rejection token used:
  - customer must select from offered alternatives OR contact support (no infinite cycling)

C) **Capacity enforcement (minimal but real)**
- Assignment and alternatives must avoid exceeding zone/day capacity  
- Assignments increase tracked counts **atomically**  
- No job creation, no routing

D) **Admin controls**
- View utilization by zone/day  
- Adjust zone default day pattern if needed (or rely on Module 03 edit)  
- Override a specific customer’s assigned day (audited)

E) **Premium communications**
- “What happens next” microcopy everywhere  
- Friendly reason codes for failures:
  - zone paused  
  - not covered  
  - capacity full  
  - plan not enabled in zone (from Module 05)

### 2.2 Out of scope
- No calendar browsing UI  
- No dispatch/job creation  
- No provider execution checklists/photos (later)  
- No complex reschedules beyond the one-time reject flow  
- No weather-mode rescheduling (later)  

---

## 3) Definitions

- **Service Day**: Recurring day-of-week (optional window: `am` / `pm` / `any`)  
- **Service Week**: Zone-anchored operational week used for entitlements and scheduling later  
- **Service Day Offer**: Proposed Service Day requiring customer confirmation  
- **Rejection Token**: Customer gets exactly **1** reject (default 1, future-configurable)  
- **Assignment State**:
  - `offered` → `confirmed` (and optionally `superseded` for history)  

---

## 4) Preconditions + gating (consistent with Modules 01–05)

### 4.1 Required
Customer must have:
- authenticated session and `activeRole=customer` (Module 01)  
- property profile exists (Module 02)  
- property is covered by an **active** zone (Module 03)

### 4.2 Subscription dependence (Module 05 alignment)
Default rule:
- Service Day assignment is created **after subscription becomes active**, because Service Day is the first operational commitment.

Allowed exception (premium preview, optional):
- If you want pre-subscribe confidence, show an **estimate** of likely day on `/plans` or `/routine`, but do **not** reserve capacity until paid.

**Hard rule:** capacity reservation happens only when creating an actual Service Day Offer (post-subscribe).

---

## 5) Customer experience (UX)

### 5.1 Customer dashboard banner
Route: `/customer/dashboard`

Banner states:
- **No Service Day yet**: “We’re assigning your Service Day.”  
- **Offer pending**: “Confirm your Service Day” → `/customer/service-day`  
- **Confirmed**: “Your Service Day: Tue” badge  

---

### 5.2 Assigned Service Day screen
Route: `/customer/service-day`

#### State 1 — Loading / no assignment
- Title: “Your Service Day”
- Body: “We’re matching you to the best route for your neighborhood.”
- If > 5s: “This usually takes under a minute.”

#### State 2 — Offer: Confirm your Service Day
Display:
- “Your Service Day: **Tuesday**”
- Window: “**Any time window**”
- Explanation (template-driven):
  - “We chose Tuesday because it matches your zone route and keeps service reliable.”

CTAs:
- Primary: **Confirm Service Day**
- Secondary: **This day won’t work** (Reject) — only if token unused

#### State 3 — Rejected: Choose an alternative
- Header: “Pick one of these options”
- Subheader: “To keep routes reliable, we offer a few controlled choices.”
- Show **2–3 alternatives max**
- Customer must pick one and confirm

If no alternatives:
- “We’re at capacity on nearby days.”
- CTA: “Contact support”
- Optional: “Save preferred day” (no promise)

#### State 4 — Confirmed
- “You’re handled.”
- “Your Service Day: Tuesday”
- Next step: “Finalize your routine for your service weeks.” (Module 07)

---

## 6) Rejection rules (strict)

- Exactly **1** reject token
- Reject generates 2–3 alternatives
- No second reject
- If customer needs different day after token:
  - support flow only

---

## 7) Assignment engine (core logic)

### 7.1 Inputs
- Property → active zone
- Zone default day/window
- Zone capacity (max homes/day + buffer)
- Existing assignment counts
- Provider mapping (feasibility signal)

### 7.2 Outputs
- Primary offer
- 0–3 alternatives
- Explanation string (templated)
- Failure reason codes

### 7.3 Deterministic rules
1) Try zone default day/window first  
2) If full:
   - try same day other window (if applicable)
   - then adjacent days in priority order
3) Never offer > 3 options
4) Never exceed `max_homes * (1 + buffer_percent)`

### 7.4 Capacity tracking (atomic)
- Reserve capacity when offer is created
- Move reservation when alternative chosen
- TTL recommended: 48 hours for unconfirmed offers

### 7.5 Race handling
- Retry once with next best option
- Fail gracefully if all options fill during race

---

## 8) Admin experience

### 8.1 Utilization
Route: `/admin/service-days` (or `/admin/zones` tab)

Zone list row shows:
- Zone name, status, default day
- Assigned/limit
- Mon–Sun counts
- Stability indicator

Zone detail:
- Utilization bars
- Assignment list (customers + day/window + status)
- Settings (default day/window, max homes/day, buffer) with warnings

### 8.2 Override
- Requires reason
- Warn on exceeding capacity
- Allow “Force anyway” with typed confirm
- Audit log always

---

## 9) Data model (Supabase)

### 9.1 New tables

#### `service_day_assignments`
- `id` uuid pk
- `customer_id` uuid not null
- `property_id` uuid not null unique
- `zone_id` uuid not null
- `day_of_week` text not null
- `service_window` text not null default 'any'
- `status` text not null default 'offered' (`offered`,`confirmed`,`superseded`)
- `rejection_used` boolean not null default false
- `reserved_until` timestamptz null
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

#### `service_day_offers`
- `id` uuid pk
- `assignment_id` uuid fk
- `offered_day_of_week` text not null
- `offered_window` text not null default 'any'
- `offer_type` text not null (`primary`,`alternative`)
- `rank` int not null default 1
- `accepted` boolean not null default false
- `created_at` timestamptz default now()

#### `zone_service_day_capacity`
- `id` uuid pk
- `zone_id` uuid fk
- `day_of_week` text not null
- `service_window` text not null default 'any'
- `max_homes` int not null
- `buffer_percent` int not null default 0
- `assigned_count` int not null default 0
- `updated_at` timestamptz default now()
Unique: `(zone_id, day_of_week, service_window)`

#### `service_day_override_log` (or reuse existing audit log)
- `id` uuid pk
- `actor_admin_id` uuid not null
- `assignment_id` uuid not null
- `before` jsonb not null
- `after` jsonb not null
- `reason` text not null
- `created_at` timestamptz default now()

### 9.2 RPCs (recommended)
- `create_or_refresh_service_day_offer(property_id)`
- `confirm_service_day(assignment_id)`
- `reject_service_day_once(assignment_id)`
- `select_alternative_service_day(assignment_id, offered_day, offered_window)`
- `try_reserve_capacity(zone_id, dow, window)`
- `release_capacity(zone_id, dow, window)`

---

## 10) RLS policies

- Customers can read their own assignment/offers
- Customers cannot directly write day values (use RPCs)
- Admins can read/write all
- Providers: no access in Module 06

---

## 11) AI + automations (practical “wow”)

All automations are:
- explainable
- template-based
- admin-toggleable

1) **Explainable assignment text**  
- “We chose {day} because it matches your neighborhood route and keeps service reliable.”

2) **Capacity-aware alternatives**  
- 2–3 nearest feasible options only

3) **Predictability score (admin)**  
- Stable / Tight / Risk based on utilization + overrides

4) **Bad-fit detector**  
- If rejected and abandoned for 24h, show one nudge asking preference (no promise)

5) **Drift alerts (admin)**  
- Weekly alert if overrides spike in a zone

---

## 12) Acceptance tests

1) Covered subscribed customer receives offer  
2) Confirm locks and updates dashboard  
3) Reject once produces 2–3 alternatives  
4) Second reject blocked  
5) Capacity prevents over-assignment under concurrency  
6) Admin can view utilization + override with audit  
7) No calendar browsing exists

---

## 13) Definition of done

Service Days are assigned, confirmed, and tracked with:
- strict one-time reject + controlled alternatives
- atomic capacity protection
- admin utilization visibility + audited overrides
- premium “what happens next” UX

No scheduling/dispatch/job execution is included.
