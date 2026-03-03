# PRD 300 — Sprint 6: Route Sequencing v1 + Equipment Manifest

## TL;DR
Sprint 6 turns the **assigned work** (Sprint 5) into a **day-of executable route** per provider:
- An ordered stop list per provider per day (route sequencing v1)
- Coarse **customer ETA ranges** derived from the stop order
- A **provider equipment manifest** (what kits/tools/consumables are needed that day)
- **Bundling rules** that reward keeping same-property tasks together and discourage splitting

This runs on the **nightly planning boundary**.

---

## Context & Dependencies
This sprint assumes these already exist:
- **Visits + Visit Tasks** (Sprint 1)
- **Zones + zone metrics** (Sprint 2)
- **Zone × Category market states** gating supply/demand (Sprint 3)
- **Rolling horizon planner (14-day plan / 7-day freeze)** (Sprint 4)
- **Provider assignment v1** that assigns each scheduled visit to a provider (Sprint 5)

Sprint 6 does **not** change who is assigned (that’s Sprint 5). It determines **the best order** to execute the assigned stops and what’s required to execute them.

---

## Goals
1) Produce a **clear ordered route** for each provider for each day in the **LOCKED window (Days 1–7)**.
2) Produce **coarse ETA ranges** for customer-facing UI derived from the ordered route.
3) Generate a **daily equipment manifest** per provider.
4) Enforce **bundling preference**: same property tasks are merged into one stop when feasible.
5) Keep outputs stable: avoid unnecessary re-ordering from night to night unless it materially reduces travel time / increases feasibility.

---

## Non-Goals (explicitly out of scope)
- Real-time GPS-based rerouting or constant live ETAs (costly + noisy)
- Full emergency replanning across providers (planned for later “exceptions/emergencies” sprint)
- Complex VRP optimization with heavy solvers (v1 should be heuristic and explainable)

---

## Key Definitions
- **Stop**: a property visit on a specific date (may include multiple tasks/sku lines).
- **StopDurationMinutes**: expected on-site time for the stop.
- **TravelMinutes(a→b)**: estimated travel time between two stops (or home base → first stop).
- **Route**: ordered list of stops for a provider on a date.
- **ETA Range**: coarse customer-facing arrival window.

---

## Inputs
Per provider per service day:
- Home base location
- Working window(s) for that day (start/end)
- **Optional recurring weekly pattern** (which days they work + start/end, possibly split shifts)
- **Optional blocked windows** for non-Handled commitments (e.g., legacy customers)
  - Time range (required)
  - **Location (optional, recommended)**
  - Duration (optional if implied by start/end)
- Capacity constraints (max minutes/day, optional max stops/day)

Per stop:
- Location (lat/lon)
- StopDurationMinutes (sum of task mins minus bundling discounts)
- Any time-window constraints (v1: mostly none; later: appointment windows)
- Required equipment kits (from tasks)

---

## Provider Availability Model (Transition-Friendly)
### Intent
Some providers will join with **existing customers and established weekly routines**. We need a “give and take” setup that:
- Respects their real availability (so they can keep income continuity)
- Lets Handled Home still build dense, profitable routes
- Gradually migrates legacy customers into the platform without chaos

### Recommended v1 approach
1) **Weekly Availability Template (hard constraint)**
   - Providers set: days-of-week on/off + start/end times (and optionally split shifts).
2) **Blocked Windows for Legacy Commitments (hard constraint)**
   - Providers can add recurring or one-off blocks such as “Tues 10:00–11:30 (Legacy client)”.
   - **Location is optional (recommended).**
  - If provided, routing treats it as an **anchor** (better density + more accurate feasibility).
  - If omitted, treat as a **time-only block** (still respected, but routing is less precise).
- **Recommendation (v1):** allow time-only blocks to reduce onboarding friction, but strongly encourage adding a location with simple microcopy: “Add a location to help us plan around this commitment.”
3) **Flex Capacity (soft preference / incentive)**
   - Encourage providers to offer at least one flexible block per week (e.g., “Thu PM flexible”) in exchange for honoring their anchors.
   - Later: reward flexibility with better assignments or small payout boosts.

4) **Swiss-cheese guardrails (recommended)**
   - **Goal:** prevent extremely fragmented schedules that destroy routing density, while still letting busy providers onboard.

   **v1 policy (recommended):** *soft caps + eligibility gates (not hard “no”).*
   1) **Minimum Handled availability to be “assignable”**
      - Providers should have at least **MinHandledHoursPerWeek** available to Handled to receive meaningful assignments.
      - Starter defaults (admin dials):
      - **MinHandledHoursPerWeek = 8** (minimum to receive meaningful assignments; can be lower for niche categories)
      - **FullMarketplaceEligibleHoursPerWeek = 12** (recommended default for broad marketplace eligibility and better routing density)
      - If below **MinHandledHoursPerWeek**: allow onboarding, but show “Limited availability” and restrict them to small/overflow assignments.
      - If between **MinHandledHoursPerWeek** and **FullMarketplaceEligibleHoursPerWeek**: provider is eligible, but the system should prefer **low-friction, nearby add-ons** and avoid overfilling them (protects density + reliability while they ramp up).
      - At or above **FullMarketplaceEligibleHoursPerWeek**: provider is **fully marketplace eligible**.
      - **Recommendation:** even if “Limited availability,” providers may still **bring/migrate customers** onto Handled (see policy below), because this accelerates adoption and reduces disintermediation risk.
      - However, until they meet the minimum availability, they should be treated as **Provider-Anchored First** (**recommended: soft preference, not a hard lock**):
      - Prioritize assignments to their migrated/anchored customers.
      - Allow **opportunistic** additional marketplace stops **only if** it fits cleanly inside their open segments *and* does not threaten anchored commitments or quality (see guardrails below).

   2) **Recurring blocked window soft cap (migration-friendly)**
      - Starter default (admin dial): **MaxRecurringBlocksPerWeek = 3**.
      - If a provider adds more than the cap:
        - Allow it, but require them to also add **FlexHoursPerWeek ≥ 8** *or* convert some blocks into a single larger block.
        - UX copy: “Too many blocks makes routing inefficient. Add a flexible block so we can still build you a profitable route.”

   3) **Fragmentation check (per day)**
      - Compute a simple fragmentation indicator:
        - **NumSegmentsPerDay** = number of available time segments after subtracting blocks
        - **MinSegmentMinutes** = shortest available segment
      - Starter defaults (admin dials):
        - **MaxSegmentsPerDay = 3**
        - **MinSegmentMinutes = 90**
      - If violated: warn and suggest fixes (merge blocks, add availability, add location anchors).

   4) **Fair give-and-take**
      - If provider insists on heavy blocking (legit legacy book): accept it, but treat them as a **specialty/anchor provider** with lower density expectations until migration completes.

### How the planner should treat blocked windows
For a provider/day, the route is planned around **time segments**:
- Segment 1: DayStart → Block1Start
- Segment 2: Block1End → Block2Start
- Segment 3: Block2End → DayEnd

The route sequencing algorithm (this sprint) runs **within each segment** using only the stops that fit, and treats the block as an immovable constraint.

### Provider UX (where friction is removed)
- “Set My Schedule” wizard:
  - Weekly pattern (days + start/end)
  - Add blocked windows (“I already have customers on Tuesdays”)
  - Ask for **optional location** (search/map pin)
  - Provide a clear **Skip** option (“Time-only”) with microcopy explaining the tradeoff
  - Show an instant preview: “You have ~X hours/week available to Handled Home”
  - **Availability Health** (recommended): show a simple meter + guidance
    - “Great for routing” vs “Too fragmented”
    - If below minimum hours: “Limited availability — you may receive fewer assignments until you add more open time.”
- If between 8–12 hrs/week: “Good — add a bit more availability to unlock full marketplace work.”
- If ≥12 hrs/week: “Great for routing — full eligibility unlocked.”
- “Bring My Customers” (later sprint, but plan for it):
  - Mark certain customers as “anchor/legacy” so their day-of-week stays stable during migration
  - **Limited availability policy (recommended):**
    - Allow bringing customers even if provider is under MinHandledHoursPerWeek, **but** those customers must map to a feasible recurring pattern.
    - Require the provider to set, per migrated customer, a **recurring day + AM/PM** (or a recurring block) so the system can plan around it.
    - Until the provider meets **MinHandledHoursPerWeek (8 hrs/week)**, treat the provider as **Provider-Anchored First** (**soft preference**) :
    - Assignments prioritize their migrated customers.
    - They may receive **extra marketplace work only when it fits perfectly** (opt-in) and passes the guardrails below.
    - If the provider’s schedule is too fragmented to serve the migrated customers reliably, show a clear prompt: “To bring this customer over, add more open time or consolidate blocks.”

### Business rationale
- This is the cleanest on-ramp for pros: they don’t have to abandon their book of business to try Handled.
- It reduces provider churn during the first 30 days (critical).
- It gives you a clear lever: you can trade **density + stability** for honoring **anchors**.

---

## Outputs
1) Provider day plan:
   - Ordered stops (1..N)
   - Planned start time (internal)
   - Planned arrival time estimate per stop (internal)
   - Customer-facing ETA range per stop
2) Customer-facing values:
   - Status: Planned vs Scheduled (already defined)
   - For Scheduled: ETA range label (coarse)
3) Equipment manifest:
   - Required kits/tools/consumables
   - Optional: “load list” + checklist UI

---

## Algorithm 1 — Bundling & Stop Duration
### Intent
If multiple tasks exist at the same property on the same day, they should execute as **one stop** to avoid duplicate travel and duplicated setup time.

### Rules (v1)
1) Same property + same service day → **merge** into one stop.
2) StopDurationMinutes is computed as:

**StopDurationMinutes = Σ TaskMinutes − SetupDiscountMinutes**

Where:
- **TaskMinutes** comes from the SKU defaults (or later from learned averages)
- **SetupDiscountMinutes** is a simple function:

**SetupDiscountMinutes = min(SetupCap, SetupBase × (NumTasks − 1))**

Starter defaults (admin dials):
- SetupBase: 5 minutes
- SetupCap: 15 minutes

3) Discourage splitting same property across different providers or different days unless forced:
- Add a **SplitPenaltyMinutes** to the optimizer objective (see below)
- Or make it a hard rule for v1 unless infeasible

---

## Algorithm 2 — Route Sequencing v1 (Heuristic, Explainable)
### Intent
Given an assigned set of stops for a provider/day, output an order that:
- Minimizes travel time
- Respects provider working windows
- Avoids late completion
- Avoids unnecessary reordering from day to day

### Objective (conceptual)
Minimize:

**RouteCost = Σ TravelMinutes + α·OvertimeMinutes + β·WindowViolationMinutes + γ·ReorderThrashPenalty + δ·SplitPenaltyMinutes**

Where α, β, γ, δ are tunable weights.

### Suggested heuristic approach (v1)
1) **Build a baseline order** (fast):
   - Start at home base
   - Use nearest-neighbor insertion OR a simple “sweep” clustering by angle around home base
2) **Improve the route** (lightweight):
   - Run a 2-opt pass (swap segments if it reduces TravelMinutes)
3) **Feasibility check**:
   - Simulate day execution:
     - Start at provider day start
     - Add travel + duration sequentially
     - Ensure finish ≤ provider day end; if not, mark infeasible
     - If the provider has **blocked windows**, also ensure each stop’s simulated execution fits within the available segments (DayStart→BlockStart, BlockEnd→NextBlockStart, etc.). If stops can’t fit without overruns or segment violations, mark infeasible.
4) **Stability / anti-thrash**:
   - Compare new order to prior night’s order for that same provider/day
   - Only accept a re-order if it reduces total TravelMinutes by at least:

     **MinImprovementMinutes** or **MinImprovementPercent**

   Starter defaults (admin dials):
   - MinImprovementMinutes: 8
   - MinImprovementPercent: 7%

### Edge cases
- If infeasible (overtime predicted):
  - Flag to ops as a “route infeasible” issue for assignment engine to fix next night
  - Do **not** silently cram it—better to surface the risk

---

## Provider Reordering v1 (Recommended)
### Recommendation
Allow providers to **drag/drop reorder stops** as a “nice touch,” but only with **guardrails** so we don’t blow up feasibility or customer trust.

### Guardrails (v1)
1) **Reorder allowed only before “Start Day.”**
   - This preserves a stable customer experience and prevents constant ETA churn.
2) Reorder must remain **feasible**:
   - If the reorder would predict finishing after the provider’s working end time (or violates any existing constraints), show a clear warning and **block** the change (or require an explicit override reason if you want a softer gate).
3) When a provider reorders, the app immediately recalculates and shows:
   - Estimated **drive minutes**, **service minutes**, and **finish time** for the day.
4) Customer ETAs:
   - The customer-facing ETA range should be computed from the **published route order**.
   - Reorders **before Start Day** can update ETAs once, at the moment the provider taps **Start Day** (or immediately if you’re comfortable with pre-day ETA refresh).
5) **After Start Day: allow a tiny, controlled adjustment (recommended)**
   - Allow a single action: **“Move next stop to end”** (only for stops not yet started).
   - No full drag/drop after Start Day.
   - Do **not** recalculate customer-facing ETAs in real time (keep the promise of stability), but do recalc **internal** finish-time estimate and show a **“May finish late”** warning if triggered.
   - Rate-limit: e.g., max **2 uses/day** to prevent abuse.
   - Log the action for ops visibility (helps diagnose chronic routing issues).

Rationale: this solves the most common day-of realities (blocked gate, barking dog, customer texted “not today”, traffic anomaly) without turning the system into live rerouting complexity.

### Business rationale
- Providers often have local knowledge (traffic patterns, gate codes, customer preferences). Letting them reorder increases compliance and reduces friction.
- Guardrails protect you from turning “nice touch” into chaotic schedules and support tickets.

---

## Algorithm 3 — ETA Range Generation (Customer-facing)
### Intent
Customers get a **confidence-calibrated** arrival range without expensive live tracking.

### Compute an internal planned arrival time
Simulate through the ordered route:

**PlannedArrivalTime(stop i) = DayStart + Σ_{k<i}(Travel(k→k+1) + Duration(k)) + Travel(Home→1)**

### Convert to customer-facing ETA Range
Define a **range width** based on stop position and uncertainty.

Starter v1 rule (simple):
- BaseRange = 60 minutes
- Add 15 minutes per stop position bucket

Example:
- Stop 1–2: ±30 min (60-min window)
- Stop 3–5: ±45 min (90-min window)
- Stop 6+: ±60 min (120-min window)

Displayed as a window, e.g., **“10:00am–11:30am”**.

Admin dials:
- BaseRangeMinutes
- IncrementPerBucket
- Bucket thresholds

### Customer notification policy (v1)
- Nightly: update ETAs for next day only
- Day-of: **keep it quiet** — no routine “On our way” notifications
- Only notify if the visit is predicted to be **running late** (based on internal progress signals)

#### Running-late definition (recommended)
Notify only when we expect to **miss the end of the published ETA window** (this matches customer expectations and avoids noisy alerts).

Let:
- ETAWindow = [ETA_start, ETA_end]
- PredictedArrival = simulated arrival time using the current/published route order

Trigger a single “Running late” notification when either:
1) **PredictedArrival > ETA_end + LateGraceMinutes**, or
2) It’s already **past ETA_end** and the stop has not been started/arrived.

Starter default (admin dial):
- **LateGraceMinutes = 15**

Message style:
- Calm + specific: “Your visit is running later than expected and will arrive after the original window. We’ll be there as soon as possible.”
- Optional: show the updated coarse window (e.g., “Now expected 1:30–3:00”).

Anti-spam:
- Max **1 running-late notification per visit** unless the delay worsens dramatically (later sprint).

---

## Algorithm 4 — Equipment Manifest
### Intent
Provider sees what they need before starting the day, and ops reduces failure due to missing gear.

### Manifest generation (v1)
For a provider/day:

**Manifest = Union(RequiredKits(stop)) across all stops**

Plus optional consumables:
- If any task requires consumable X, include X with a conservative quantity rule (v1 fixed per stop).

### Provider UX
- Before day starts: “Today’s Loadout” checklist
- Mark “Packed” (optional)
- If missing: quick toggle “I’m missing item” → flags ops / may require reschedule

---

## UX / UI Requirements

### Customer
- Upcoming Visits list shows both **Scheduled** and **Planned**.
- Scheduled visits show an ETA range.
- **Planned visits show day + a coarse block (recommended: AM/PM)** and do not show a precise ETA range (to reduce anxiety).
  - Example: “Wed (AM)”
  - Microcopy: “Planned visits may shift nightly until they become Scheduled.”
  - Default blocks (v1): **AM = 8am–12pm**, **PM = 12pm–5pm** (make block times admin-adjustable later).
  - **Recommendation:** keep it strictly **AM/PM** in v1 (no “Evening” block yet). Evening adds operational complexity and increases late-day spillover risk before you have strong routing + exception handling.
  - Later (when proven): optionally add **EVENING = 5pm–8pm** for specific categories/markets as an advanced setting.
- If a planned visit shifts, show a simple diff note: “Moved Tue → Wed during nightly optimization.”

### Provider
- Day view:
  - Ordered stop list (1..N)
  - Each stop shows: address, bundled tasks, duration estimate, special notes (pets/lock/etc if present)
  - **Drag/drop reorder stops (before Start Day)**
    - Show updated estimated drive minutes + finish time
    - Warn/block if reorder makes the day infeasible
  - “Start Day” button (this is the soft commitment moment)
  - After Start Day: **Move next stop to end** (limited uses/day, no live ETA recalcs)
- Availability & Commitments:
  - Weekly availability template (days + start/end, optional split shifts)
  - Blocked windows for legacy commitments (recurring or one-off, optional location)
  - Optional toggle: “Open to extra work if it fits” (Provider-Anchored First mode)
  - Preview of Handled-available hours/week
- Equipment view:
  - Today’s Loadout checklist

### Admin / Ops
- Route overview per provider/day:
  - Total stops, total drive minutes, total service minutes, finish time estimate
- Exceptions list:
  - infeasible routes (predicted overtime)
  - high-uncertainty ETAs (too many stops)

---

## Business Strategy Rationale
- Sequencing + bundling is where your **unit economics** show up (travel is the tax).
- Coarse ETAs build trust without turning your cloud bill into a live-tracking nightmare.
- Equipment manifests reduce “I couldn’t do the job” failure modes that destroy NPS.

---

## Acceptance Criteria
1) For every provider with assigned work in the next 7 days, the system produces an ordered route for each day.
2) Bundled tasks at the same property appear as a single stop with a discounted setup time.
3) Customer Scheduled visits display an ETA range derived from the route.
4) Provider sees a daily stop order and a loadout list.
5) Reordering is stable: the system does not reshuffle stop orders nightly unless it passes the MinImprovement threshold.
6) Provider controls:
   - Before Start Day: drag/drop reorder with feasibility checks.
   - After Start Day: only **Move next stop to end** (rate-limited), with internal finish-time recalculation and clear warnings if it risks overtime.
7) Provider availability constraints are respected:
   - Routes do not schedule stops outside the provider’s working windows.
   - Routes do not violate provider blocked windows (legacy commitments), including **time-only** blocks.
   - If a blocked window includes a location, routing treats it as an **anchor** to improve feasibility and reduce travel.
8) Limited-availability providers can still migrate customers:
   - Migrated customers must be tied to a feasible recurring day + AM/PM (or recurring block).
   - Until minimum availability is met, providers are **Provider-Anchored First**:
     - Migrated/anchored customers are protected.
     - Additional marketplace work is **soft-allowed** only if it fits cleanly (see below).

### Provider-Anchored First: extra-work guardrails (recommended)
Extra marketplace stops may be assigned only if all are true:
1) **No harm to anchors:** projected completion time stays within the provider’s day end minus a buffer.
   - Admin dial: **AnchorBufferMinutes = 30**
2) **Segment fit:** the stop fits inside an available segment (respecting blocked windows).
3) **Travel impact cap:** incremental travel added is below a cap.
   - Admin dial: **MaxAddedDriveMinutesPerDay = 20**
4) **Complexity cap:** limit extra work while availability is limited.
   - Admin dial: **MaxExtraStopsPerDay = 1**
5) **Provider opt-in:** provider can toggle “I’m open to extra work if it fits.”

Rationale: This keeps the system migration-friendly without turning limited-availability providers into expensive, low-density routing liabilities.

---

## Open Questions (to finalize with Brandon)
1) Planned visits display: **Decided** — show **day + AM/PM** (coarse) for Planned; show ETA range only once Scheduled.
2) ETA range sizing: how wide should ranges be by default? (60/90/120?)
3) Provider control: **Decided** — allow **drag/drop reorder before Start Day** with feasibility guardrails (see Provider Reordering v1).
4) After Start Day controls: **Decided** — allow **Move next stop to end** (limited uses/day, no live ETA recalcs).
5) Notification policy: **Decided** — no routine route-start notifications; notify customers only if **running late**.
6) Planned block granularity: **Decided** — **AM/PM only** in v1 (no Evening block yet).
7) Blocked window location requirement: **Decided** — location is **optional** (time-only allowed), but the UX should **strongly encourage** adding a location for better routing.
8) Blocked window fragmentation guardrails: **Decided** — use **soft caps + minimum availability gates** (e.g., min 8 hrs/week, soft cap 3 recurring blocks/week, warn if segments become too fragmented).
9) Limited-availability providers bringing customers: **Decided** — allow it, but treat as **Provider-Anchored First** until minimum availability is met; require feasible recurring day + AM/PM (or recurring block) per migrated customer.
10) Provider-Anchored First strictness: **Decided** — use a **soft preference** (not hard restriction), with guardrails + provider opt-in for extra marketplace work.
11) Full marketplace eligibility threshold: **Decided** — default **FullMarketplaceEligibleHoursPerWeek = 12** (keep MinHandledHoursPerWeek = 8 as the minimum assignable threshold).

---

## Notes for later sprints
- Home-required appointment windows (Sprint 7) will add hard time windows into the sequencing feasibility check.
- Emergency handling will add day-of replanning and cross-provider swaps.

