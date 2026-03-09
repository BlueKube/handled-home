# PRD 300 — Sprint 7: Appointment Windows v1 (Home-Required Services)

## TL;DR
Sprint 7 adds **time-window scheduling** for services that require the customer to be home (or otherwise provide access). It introduces:
- Customer **availability capture** + selection of an appointment window
- A planning rule set that offers only **feasible windows** (protect unit economics)
- Route feasibility logic that respects **time windows** alongside provider availability + blocked windows
- Clean exception flows when a window can’t be honored

This runs on the **nightly planning boundary** and integrates tightly with Sprint 4–6.

---

## Context & Dependencies
Assumes:
- SKUs/services can be flagged as **presence required** (Sprint 1)
- Rolling horizon planner (14-day plan / 7-day freeze) (Sprint 4)
- Provider assignment v1 (Sprint 5)
- Route sequencing v1 + ETA ranges + provider availability blocks (Sprint 6)

Sprint 7 does **not** implement real-time tracking or same-day dynamic rescheduling.

---

## Goals
1) Allow customers to schedule **home-required** services via a **small set of offered appointment windows** that are likely to be honored.
2) Ensure the routing engine respects **time-window constraints** when sequencing provider routes.
3) Keep the experience premium and calm: avoid “calendar chaos.”
4) Provide clean fallbacks when a promised window becomes infeasible (rare, but must exist).
5) **Relief valve (recommended):** support **time-flexible services** where the customer does **not** expect a specific appointment time, but the work must be completed within an acceptable **service week window** (e.g., “anytime this week”). If the provider falls behind, these jobs enter a **due-soon/overdue queue** and must be fitted in before the window ends.

---

## Non-Goals
- Live GPS ETAs / constant re-forecasting
- Full solver-grade VRPTW optimization (v1 should be explainable and reasonably efficient)
- Provider swapping / emergency re-planning across providers (later sprint)

---

## Key Concepts
- **Home-required stop**: a stop with one or more tasks that require presence/access.
- **Appointment window**: [start, end] time interval that must be honored.
- **Soft vs hard constraints**:
  - Appointment window = **hard** constraint
  - Customer “preferred window” (non-home-required) = optional later, **soft**

---

## Scheduling Profiles by SKU (Routing Patterns)
### Intent
Different service types have different customer expectations. To avoid a one-size-fits-none system, each SKU (or category default) should use a **scheduling profile** that determines:
- What the customer must choose (if anything)
- What constraints the planner enforces
- What the customer sees in the UI

### Recommended v1 profiles (keep it simple)
1) **APPOINTMENT_WINDOW (rigid)**
   - Customer selects a **3-hour window** (e.g., 9–12 / 1–4).
   - Planner enforces a **hard time window**.
   - Typical: cleaners who need access, indoor handyman with customer present.

2) **DAY_COMMIT (semi-flex)** *(optional to enable in v1; useful soon)*
   - Customer selects **day + AM/PM** (no exact time window).
   - Planner treats day as fixed (inside freeze), sequences within the day.
   - Customer can see an ETA range once Scheduled (from Sprint 6).
   - Typical: lawn mowing, pool service, exterior work where day matters but time doesn’t.

3) **SERVICE_WEEK (flexible)**
   - Customer selects nothing time-wise; the system schedules **any day within a service week**.
   - Planner enforces a **WeekEndDate due-by** (hard at week-level).
   - Customer sees “Scheduled this week,” plus due-by/overdue as needed.
   - Typical: pest control programs, filter changes, exterior preventive maintenance.

### Access requirement is separate from “appointment expectation”
Important distinction: “no appointment time” does **not** necessarily mean “exterior only.” Some services can be time-flex if the provider has approved access (key/code/permission).

Recommended access modes (v1 labels):
- **Customer-present required** → generally must use APPOINTMENT_WINDOW.
- **Provider access OK** (key/code/permission) → can use DAY_COMMIT or SERVICE_WEEK.
- **Exterior only** → can use DAY_COMMIT or SERVICE_WEEK.

### Defaults by category, overrides by SKU (and SKU variants)
- Set a **default profile per category** (fast ops).
- Allow **SKU overrides** (real-world exceptions).
- **Recommendation:** scheduling profile must be selectable at the **SKU variant / option level** (because variants can change access + customer expectations).
  - Example: **Window Cleaning (Exterior-only)** can be DAY_COMMIT or SERVICE_WEEK.
  - Example: **Window Cleaning (Inside + Outside)** should be APPOINTMENT_WINDOW (customer-present required).

#### Mixed-profile bundles (recommended v1 behavior)
When a customer’s selected bundle contains tasks with different scheduling profiles:
- **APPOINTMENT_WINDOW tasks** always keep their hard window.
- **SERVICE_WEEK tasks** do **not** force the customer into choosing an appointment time; they remain week-flexible and may be **piggybacked** onto an appointment visit if feasible.
- **DAY_COMMIT tasks** are day-fixed (AM/PM) and may be piggybacked onto an appointment visit on the same day if feasible.

**Constraint precedence (for a single stop if tasks are executed together):**
APPOINTMENT_WINDOW (most rigid) → DAY_COMMIT → SERVICE_WEEK (most flexible).

This keeps the customer experience simple while still allowing opportunistic bundling for unit economics.

#### Piggybacking policy (recommended v1)
**Recommendation:** piggybacking of flexible work onto an appointment visit should be **automatic when feasible**, with **clear disclosure** and an **easy opt-out**.

Automatic piggybacking is allowed only if all are true:
- **Does not change the customer’s promise** for the appointment-window task (no shifting/widening the chosen window).
- **Feasibility remains true** (route remains feasible for all time windows).
- **Access mode compatible** for the piggybacked work (e.g., provider-access OK / exterior only, or otherwise does not require an additional customer-present commitment).
- **Duration guardrail (Decided, recommended v1):** allow piggybacking only if the added on-site time is small.
  - Compute **MaxAddedMinutesAllowed = min(MaxPiggybackAddedMinutes, MainTaskDurationMinutes × MaxPiggybackAddedPercent)**
  - Starter defaults (admin dials):
    - **MaxPiggybackAddedMinutes = 30**
    - **MaxPiggybackAddedPercent = 25%**
  - If the piggybacked work would exceed MaxAddedMinutesAllowed, keep it on its own schedule (DAY_COMMIT or SERVICE_WEEK) rather than bundling into the appointment visit.

Customer UX (recommended):
- In visit details, show a line like: **“Also scheduled during your appointment: Exterior window cleaning”**.
- Provide a simple control: **“Don’t bundle this with my appointment”** (moves it back to its own flexible schedule if feasible).

---

## Product Principles (important)
1) **Offer, don’t ask**: customers pick from 3–6 windows you offer (generated from feasibility), rather than typing availability.
2) **Protect density**: appointment windows are expensive; constrain when/where they’re offered.
3) **Stability > tightness**: wider windows that you keep are better than tight windows you miss.

---

## Customer UX / Flows

### Flow A — Adding a home-required service
1) Customer selects a service that requires presence.
2) The app shows an “Appointment required” step:
   - A short explanation: “This service needs you home. Pick a window.”
3) Show **recommended windows** (3–6 options) across the next 7–14 days.
4) Customer selects one window.
5) Confirmation screen:
   - “Scheduled for Tue (PM) — 1:00–4:00”
   - Policy: “Locked once inside the 7-day window.”

### Flow B — Managing windows for recurring home-required services
- If the service repeats, allow a simple “Default window preference”:
  - “Prefer Tue PM” or “Prefer weekday afternoons”
  - Use as a **soft preference** to guide future offerings.

### Flow C — When we can’t offer windows
- Show **WAITLIST / not available** messaging consistent with Sprint 3 states.
- Offer:
  - “Join waitlist”
  - “Choose a different service”
  - “Pick a wider window” (if your UX supports multiple sizes)

### Customer visibility
- **Planned**: show day + AM/PM for upcoming (outside freeze)
- **Scheduled (home-required)**: show the specific appointment window
- **Scheduled (time-flexible)**: show **“Scheduled this week”** in the list; show the exact **service-week date range** in details; show **Due-soon/Overdue** badges when applicable

---

## Provider UX / Flows
- In the route list, home-required stops display a **time window badge** (e.g., “1–4pm”).
- Provider reorder rules:
  - Before Start Day: drag/drop reorder is allowed **only if** it remains feasible with all time windows.
  - After Start Day: “Move next stop to end” is allowed only if it does not violate any upcoming time window.

### Relief valve (recommended): Provider-placed *time-flexible* work (no appointment time)
**Intent:** support services like monthly pest control where the **timing is flexible** as long as the job is completed within a defined **service week window**. This is not “manual work outside the system” — it is a normal job/task, just without a time appointment.

#### How it shows up to the customer (recommended)
- In the **Upcoming list**, show: **“Scheduled this week”** (no appointment time).
- In the **visit details**, show the explicit range: **“Service week: Mar 9–15”** (or whatever the current service-week window is).
- Optional microcopy: “We’ll complete this service sometime this week. You don’t need to be home unless noted.”
- Quiet notification policy: notify **only if at risk of missing the week** (similar to running-late).
- If **Due-soon / At risk / Overdue**, elevate clarity:
  - **Due-by badge timing (Decided):** show **“Due by <WeekEndDay>”** starting **48 hours before WeekEndDate** (admin dial: **DueSoonLeadHours = 48**).
  - If WeekEndDate passes, show **“Overdue”**.
  - Always show the date range in details.

#### Provider UX (v1)
- Week view with:
  - Existing scheduled route days (with time-window badges where applicable)
  - A list of **“Due this week”** flexible jobs
  - A list of **“Overdue / Due-soon”** items (priority)
- Provider can optionally **drag a due-this-week job onto a day** to commit it to that day (day-level commitment, no time window).
- System immediately shows:
  - Estimated added drive minutes + finish time
  - Warning/block if infeasible with existing time windows / availability / blocked windows

#### Guardrails (v1)
- Eligible only for jobs explicitly marked **time-flexible** (service-week scheduling allowed).
- **Recommended eligibility rule (v1):** time-flexible jobs must have access that does **not** require the customer to be present at a specific time (provider-access OK or exterior only). If customer-present is required, use APPOINTMENT_WINDOW.
- Must remain within provider availability (and not violate blocked windows).
- Must not cause any **home-required appointment windows** to become infeasible.
- Limit provider day-commitments to protect density and prevent “calendar chaos”:
  - Admin dials (starter): **MaxProviderCommittedFlexibleStopsPerDay = 1** and/or **MaxProviderCommittedFlexibleMinutesPerDay = 60**
- Changes obey lock rules:
  - Outside freeze: provider can move it.
  - Inside freeze: treat as locked unless ops intervention (later sprint can add “provider request change”)..

---

## Admin / Ops UX
- Scheduling settings:
  - **Default appointment window length (v1): 3 hours**
  - Which services require windows
  - Window offering policy knobs (see below)
  - (Optional) Relief valve knobs for service-week jobs (see below)
  - Piggybacking duration guardrails (admin dials): **MaxPiggybackAddedMinutes** and **MaxPiggybackAddedPercent** (see Piggybacking policy)

- **SKU / Catalog management (recommended addition in Sprint 7):**
  - Each SKU (and **SKU variant/option**) has:
    - **Scheduling profile** dropdown (APPOINTMENT_WINDOW / DAY_COMMIT / SERVICE_WEEK)
    - **Access mode** dropdown (Customer-present required / Provider access OK / Exterior only)
  - Category-level defaults can prefill these, but variants may override.
  - Admin audit log for changes (because changing a profile changes scheduling promises).

- Exceptions dashboard:
  - “Unbooked home-required demand” (customers haven’t picked a window)
  - “Window infeasible” flags for the next 7 days (should be rare)
  - “Unbooked home-required demand” (customers haven’t picked a window)
  - “Window infeasible” flags for the next 7 days (should be rare)

---

## Algorithms & Math (v1)

### A) Window Offering Policy (protect unit economics)
**Intent:** Only show windows you can realistically honor.

**Recommended approach:** generate candidate windows from a small template + filter by feasibility.

1) Define a weekly template of possible windows (per zone/category):
   - **Primary (recommended): specific 3-hour blocks** (appointment-like)
     - Starter template: **9–12** and **1–4** (local time)
   - **Fallback (recommended): AM/PM-style** (broader) when feasibility is low
     - Example fallback: **AM 8–12**, **PM 12–5**

   **Fallback rule (recommended):** if fewer than **MinWindowsToShow** windows are feasible (e.g., <3), widen to AM/PM-style for that zone/category/day so customers still see enough options.
2) For each candidate day/window, compute a coarse feasibility score using:
   - Projected provider **supply minutes** in that zone/category/day
   - Existing scheduled workload and existing time windows
   - Provider availability segments (including blocked windows)

**Feasibility gating (conceptual):**
A window is offerable if the system can place the stop into that window without pushing projected completion beyond day end or creating time-window conflicts.

**Business guardrails (recommended defaults as admin dials):**
- Offer at most **MaxWindowsShown = 6**
- Ensure at least **MinWindowsToShow = 3** (recommended; triggers AM/PM fallback if fewer are feasible)
- Ensure at least **MinLeadTimeHours = 24** (no next-hour bookings)
- Cap home-required volume by time bucket:
  - **MaxHomeRequiredStopsPerProviderPerDay** (e.g., 3)
  - **MaxHomeRequiredStopsPerZonePerDay** (e.g., 20, or derived from supply)


### B) Time Window Constraint Representation
For each home-required stop:
- **Window = [w_start, w_end]** (hard)
- Optionally: service duration estimate


### C) Route Feasibility Simulation with Time Windows
This extends Sprint 6’s simulation.

For an ordered route, simulate sequentially:
- Arrive_i = Depart_{i-1} + Travel(prev→i)
- Start_i = max(Arrive_i, w_start_i)  (if no window, w_start_i = -∞)
- If Start_i > w_end_i → **infeasible**
- Depart_i = Start_i + Duration_i

This is the basic **VRPTW feasibility check**.


### D) Sequencing Heuristic with Windows (v1)
**Intent:** keep the heuristic approach, but incorporate time windows.

Recommended v1 heuristic:
1) Split stops into two sets:
   - Windowed stops (hard constraints)
   - Flexible stops
2) Place windowed stops first (sorted by window start time).
3) Insert flexible stops between windowed stops using least-added-travel insertion while remaining feasible.
4) Run a constrained 2-opt pass that never breaks feasibility.

**Stability / anti-thrash** still applies:
- Only reorder if improvement exceeds MinImprovement thresholds AND feasibility stays intact.


### E) When a window becomes infeasible (rare)
If a previously scheduled window is no longer feasible at nightly planning:
1) Attempt local repair:
   - Reorder within the route
   - Drop one flexible stop (mark as needs reassignment next night)
2) If still infeasible:
   - Flag an ops exception: “Window at risk”
   - If inside freeze window: require ops action (later sprint may automate)
   - If outside freeze window: propose alternate windows to customer

### F) Service-week flexible work (relief valve)
Some services are **time-flexible**: the customer does not need a scheduled appointment time, but expects completion within an acceptable window.

This is driven by the SKU’s **scheduling profile** (SERVICE_WEEK) and an access mode that does not require customer-present.

Represent these jobs with a **ServiceWeekWindow** (hard at week-level):
- **WeekStartDate** and **WeekEndDate** (**Decided default: Mon–Sun**)
- Rationale: aligns with customer mental model + ops reporting and keeps weeks consistent across markets.
- Later: allow market/category overrides if needed (e.g., Sat–Fri in specific regions).
- Optional: **PreferredDay** or **PreferredAM/PM** as a soft preference (later)
- Optional: access note (“You don’t need to be home; exterior only”) or “home required” flag if applicable

Planning rule:
- The system must schedule the job on or before **WeekEndDate**.
- The job may be scheduled on any day within the window as a **flexible stop** (no time window), subject to feasibility with other time-windowed stops.
- Providers may optionally **commit it to a specific day** via drag/drop (hard day constraint), subject to feasibility.

Due-soon / overdue queue:
- **DueSoonLeadHours (Decided): 48**. When the job is within **48 hours** of WeekEndDate, mark as **Due-soon** and elevate it in the provider queue (and show the customer a “Due by” badge).
- If WeekEndDate passes uncompleted, mark as **Overdue** and surface prominently to provider + ops.
- If it passes WeekEndDate uncompleted, mark as **Overdue** and surface prominently to provider + ops.

Customer notification (quiet, recommended):
- Notify only if the system predicts it will miss **WeekEndDate** (e.g., “This week’s service is running later than expected; we’ll complete it as soon as possible.”)

Escalation:
- If the current plan cannot satisfy WeekEndDate, flag ops: **“Service week at risk.”**

---

## Business Strategy Rationale
- Appointment windows are a **premium promise**; missing them kills trust.
- Constraining windows protects your unit economics (travel time is the hidden tax).
- “Offer feasible options” is the core trick that makes this scalable nationwide.

---

## Acceptance Criteria
1) Customers can pick an appointment window for home-required services from a feasible offered set.
2) Home-required stops are scheduled and routed without violating any time windows.
3) Provider reordering is blocked if it would violate a time window.
4) The nightly planner flags any predicted window infeasibility for ops visibility.
5) Customers see Planned (day + AM/PM) outside freeze, and the specific window once Scheduled.
6) Relief valve: providers can optionally **commit time-flexible (service-week) jobs** to a specific day (no appointment time) with feasibility checks and guardrails; overdue items surface in a priority queue.

---

## Open Questions (to decide with Brandon)
1) Default appointment window length: **Decided — 3 hours (v1)**.
2) Window style: **Decided — primary 3-hour blocks (9–12, 1–4) with fallback to AM/PM** if fewer than MinWindowsToShow options are feasible.
3) Paid “narrow window” upgrade later: yes/no?
4) How aggressive should we be on limiting home-required volume per provider/day?
5) Relief valve strictness: should provider day-commitments for **time-flexible (service-week) jobs** be capped by **stops/day**, **minutes/day**, or both (recommended: both)?
6) Service-week window definition: **Decided — Mon–Sun** by default (with optional market/category override later if needed).
7) Customer display for time-flexible jobs: **Decided** — show **“Scheduled this week”** in lists; show the date range in details; show **Due-by/Overdue** badges only when it matters.
8) Due-by badge lead time: **Decided — 48 hours** before WeekEndDate (admin dial: **DueSoonLeadHours = 48**).
9) Do we enable the **DAY_COMMIT** scheduling profile in v1 (day + AM/PM, no exact window), or keep v1 to only APPOINTMENT_WINDOW + SERVICE_WEEK?
10) For mixed-profile bundles piggybacking: **Decided — automatic when feasible**, with clear disclosure in visit details + an easy customer opt-out (“Don’t bundle this with my appointment”).
