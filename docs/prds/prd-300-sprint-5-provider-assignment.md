# PRD 300 — Sprint 5 PRD: Provider Assignment v1 (Clustered, Capacity-Constrained)

## Why this sprint exists
Sprint 5 turns the planning system from “we know *what* visits should happen” into “we know *who* will do them.”

The business objective is simple:
- **Minimize drive time** (profit + provider happiness).
- **Respect constraints** (skills, equipment, working hours, capacity).
- **Preserve predictability** (avoid thrash; don’t reshuffle near-term work).
- **Enable ops to scale** (clear reasons, knobs, and an exception workflow).

This sprint produces a **Primary + Backup provider** for each planned/scheduled visit.

---

## In-scope (Sprint 5)
1) **Candidate selection** (fast feasibility filter) per visit:
   - Category/skill eligibility
   - Required equipment/kit eligibility
   - Working day & hours compatibility
   - Capacity availability
   - Geographic feasibility (proximity / zone / drive-time footprint)

2) **Assignment solver v1**:
   - Assigns a **primary** provider to each eligible visit (when feasible)
   - Assigns a **backup** provider when there is at least one viable alternative
   - Optimizes for: travel efficiency, workload balance, and (capped) familiarity

3) **Stability rules**:
   - Avoid reassigning visits nightly unless forced or meaningfully beneficial
   - Stronger stability inside the **7‑day freeze** window

4) **Explainability**:
   - Every assignment and recommendation includes top reasons and a confidence level
   - Unassigned visits produce structured “why not” reasons and recruiting signals

5) **Ops + Admin UX**:
   - Nightly run summary + exceptions
   - Visit-level assignment details (primary/backup, reasons, confidence)
   - Manual override actions (assign, swap, lock, unassign) with audit notes
   - Tuning dials (weights + thresholds) editable in admin with audit history

---

## Out of scope (future sprints)
- Full route sequencing / stop order / time-of-day ETA ranges (**Sprint 6**)
- Automated appointment-window selection for home-required services (later)
- Real-time replanning during the day (emergencies, lateness) (later)
- Provider “offer/accept marketplace” mechanics (optional future model)
- Dynamic pricing / surge pricing (separate growth/monetization work)

---

## Dependencies (already implemented or in-progress)
- **Visits + Visit Tasks** exist and represent “one property + one date with one or more tasks.” (Sprint 1)
- **Rolling Horizon Planner** produces a 14-day view with:
  - Days **1–7 = Scheduled/Locked**
  - Days **8–14 = Planned/Draft**
  and runs on a **nightly planning boundary** (Sprint 4)
- **Zone Builder** produces geo-based zones and zone metrics (Sprint 2)
- **Market states** gate intake and activate nightly boundary changes (Sprint 3)

---

# Core concepts

## Entities (conceptual, not implementation)
- **Visit**: A planned service stop at a property on a date.
- **Visit Task(s)**: The service SKUs included in the visit.
- **Provider Work Profile**: Provider home base, working hours, skills, equipment kits, and capacity.
- **Assignment**: Primary provider + optional backup provider for a visit.

## What “clustered” means (v1)
Because Sprint 6 will handle exact stop ordering later, Sprint 5 uses a **coarse clustering proxy**:

- Keep each provider’s work on a given day **geographically compact** relative to:
  1) provider home base, and
  2) the centroid of the provider’s already-assigned visits that day.

This reduces later sequencing cost and keeps the route “tight.”

---

# Metrics & math (explicit)

> All metrics are computed per **date** and (when relevant) per **zone + category**.

## 1) Service minutes
For each visit:
- **VisitMinutes** = sum of the expected minutes of all tasks in that visit.

If a task has a known duration estimate, use it.
If not, use a category default (admin dial).

## 2) Provider daily capacity
For each provider p on date d:
- **WorkMinutes(p,d)** = minutes between start/end working hours (minus breaks if modeled)
- **CapacityMinutes(p,d)** = WorkMinutes(p,d) × UtilizationTarget

Where:
- **UtilizationTarget** is a dial (e.g., 0.80 to leave buffer).

## 3) Provider remaining minutes
- **RemainingMinutes(p,d)** = CapacityMinutes(p,d) − AssignedVisitMinutes(p,d)

## 4) Geographic cost proxy (distance / drive-time)
We need a **fast** estimate to compare candidates.

Preferred (when available):
- **DriveTime(a,b)** from a routing API (OSRM / Mapbox / Google) cached nightly.

Fallback:
- Haversine distance between coordinates converted to minutes via an average speed by region.

We use:
- **GeoCost(p, v, d)** = estimated travel minutes added if provider p takes visit v on date d.

Since we don’t have sequencing yet, v1 uses:
- **GeoCost ≈ min( DriveTime(home_base(p), location(v)),
                  DriveTime(centroid(assigned_locations(p,d)), location(v)) )**

If provider has no assigned visits yet that day, centroid term is ignored.

## 5) Familiarity score (capped)
We want to reward “same provider for same customer” without blowing up travel.

Define:
- **Familiarity(p, customer)** ∈ [0, 1]
Example (simple, v1):
- 1.0 if provider did ≥2 visits for this customer in last 60 days
- 0.5 if provider did 1 visit in last 90 days
- 0 otherwise

Then cap the influence with a dial:
- **FamiliarityBonus = w_fam × Familiarity × FamiliarityCap**
where FamiliarityCap limits how much travel we’re willing to “buy” for familiarity.

---

# Assignment algorithm (v1)

## Step A — Build feasible candidate set per visit (hard constraints)
For each visit v on date d, provider p is feasible if all are true:
1) **Skills**: provider is eligible for every task category in the visit (or the visit is split earlier; Sprint 6 bundling rules will reduce splits).
2) **Equipment**: provider has all required equipment/kit tags for tasks in the visit.
3) **Working day**: provider works on date d.
4) **Time feasibility proxy**: provider has enough remaining capacity:
   - RemainingMinutes(p,d) ≥ VisitMinutes(v) + BufferMinutes
5) **Geographic feasibility**:
   - DriveTime(home_base(p), location(v)) ≤ MaxCandidateDriveMinutes
   - (Optional) provider is allowed in the visit’s zone, if zones are used as a soft boundary.

If no candidates exist:
- Mark the visit **Unassigned**
- Record the top “why not” reason (no qualified provider / no capacity / too far)
- Emit a recruiting signal for that zone + category

## Step B — Score each feasible (provider, visit) pair (soft objective)
For each feasible provider p for visit v on date d compute:

**Score(p,v,d) =**
- w_dist × GeoCost(p,v,d)
+ w_balance × BalancePenalty(p,d)
+ w_spread × SpreadPenalty(p,d, v)
− w_fam × Familiarity(p, customer(v))
− w_zone × ZoneAffinityBonus(p, zone(v))

Where:
- **BalancePenalty(p,d)** increases as RemainingMinutes gets small (avoid overloading).
  Example:
  - BalancePenalty = max(0, (TargetRemainingMinutes − RemainingMinutes) / TargetRemainingMinutes)
- **SpreadPenalty(p,d,v)** penalizes making a provider’s daily cluster less compact.
  Example:
  - SpreadPenalty = increase in radius/diameter of assigned points if v is added.
- **ZoneAffinityBonus** is optional: if provider is “based” in/near that zone, small reward.

All weights are admin dials.

## Step C — Produce primary assignment set (solver)
We need a robust v1 approach that works at small scale and is extendable.

Recommended v1 approach:
1) **Greedy assignment** in priority order:
   - Start with visits that have **fewest candidates** (most constrained first).
2) Assign each visit to the provider with minimum Score, **subject to capacity updates**.
3) After the first pass, run a **local improvement** pass:
   - Swap assignments between providers if it reduces total score and respects constraints.

This yields a workable assignment without requiring a heavy optimization library.

## Step D — Choose backup provider (second-best feasible)
For each visit assigned to primary provider p1:
- Backup provider p2 is the lowest-score alternative among feasible candidates excluding p1,
  **with enough remaining minutes if the backup had to absorb it** (proxy check).

Backup is optional:
- If only one feasible provider exists, backup is “none.”

## Step E — Stability rules (anti-thrash)
We treat assignment stability as a first-class product feature.

### Stable by default
If a visit already has a primary provider from the prior run, keep it unless:
- The provider is no longer feasible (availability, skills, capacity), OR
- Switching produces a meaningful improvement.

### Improvement threshold (dial)
Define:
- **Improvement = Score(current) − Score(best_alternative)**

Reassign only if:
- Improvement ≥ ReassignMinScoreDelta
OR ImprovementPercent ≥ ReassignMinPercent

### Freeze window extra protection
Inside the 7-day freeze:
- Use stricter thresholds (e.g., 2× delta), AND
- Never reassign solely for “small travel gains.”

Only reassign for:
- Provider becomes infeasible
- Risk flags (capacity collapse) that would create missed visits
- Manual ops override

---

# Outputs & confidence

## Assignment outputs per visit
- Primary provider (required when feasible)
- Backup provider (optional)
- Confidence (Low/Med/High)
- Top reasons (2–3)
- Feasibility/exception flags (unassigned, capacity tight, long-drive, etc.)

## Confidence heuristic (v1)
Confidence is based on:
- **CandidateCount** (more candidates → higher confidence)
- **Margin** between best score and second-best score
- Whether assignment is inside freeze window

Example:
- High: CandidateCount ≥ 3 AND margin large
- Medium: CandidateCount = 2 OR margin moderate
- Low: CandidateCount = 1 OR capacity very tight

---

# User flows & UX

## A) Nightly planning boundary (system)
1) Planner produces / updates visits for next 14 days (Sprint 4).
2) Market state gating applies changes at the boundary (Sprint 3).
3) Provider Assignment v1 runs:
   - assigns primary + backup
   - applies stability rules
4) Results are published:
   - Days 1–7 shown as **Scheduled**
   - Days 8–14 shown as **Planned**
   - Assignments inside Scheduled window should be strongly stable

---

## B) Customer experience (read-only in this sprint)
Customers see Upcoming Visits with:
- **Scheduled** visits (locked) showing “Your pro is scheduled” and tasks included
- **Planned** visits (draft) showing “We’re planning your visit” + day-level certainty

Important UX rule:
- Do **not** surface provider name prominently for Planned visits unless you want customers to anchor on it and complain when it changes.
- If you do show it, include “May adjust until scheduled.”

---

## C) Provider experience (visibility + readiness)
Providers see:
- A calendar/list of assigned visits
- Clearly labeled:
  - **Scheduled (Locked)** vs **Planned (May adjust)**
- Each visit shows:
  - property name/address (as allowed)
  - task bundle summary
  - expected minutes (approx)
  - “Primary” tag (they are the primary)

Backup assignments are **not** shown as work the provider must do; instead:
- Ops can use backup for quick reassignment if primary fails.
- Providers could optionally see “You are backup” in a later sprint if you want proactive coverage.

---

## D) Admin / Ops experience (this is the main surface)
### 1) Assignment Run Summary
A dashboard for the last nightly run:
- Total visits processed
- % assigned primary
- % with backups
- Unassigned count (by zone + category)
- Capacity hotspots (providers at/over target)
- Long-drive assignments count

### 2) Exceptions Inbox (actionable)
A prioritized list:
- Unassigned visits (must fix)
- Visits with only 1 candidate (fragile)
- Visits where primary is near capacity limit
- Visits with “long-drive” flag (beyond a dial threshold)

Each exception item opens a detail drawer:
- Visit details (date, property, tasks, minutes)
- Candidate providers list (ranked) with reasons:
  - “Qualified + has kit + 12 min away + 40 min remaining”
- Recommended action:
  - Assign best candidate
  - Move to waitlist (if category state allows)
  - Trigger recruiting signal

### 3) Manual override tools (minimum viable)
Ops can:
- Assign a different primary provider
- Swap two visits between providers (if feasible)
- Lock assignment for a visit (prevents automatic reassignment unless infeasible)
- Remove assignment (forces re-run or manual)

Every action requires:
- A short “reason” note (audit trail)

### 4) Tuning dials (admin settings)
At minimum:
- weights: distance, balance, spread, familiarity
- max candidate drive minutes
- capacity utilization target
- reassign thresholds (score delta / percent)
- freeze-window strictness multiplier
- familiarity cap (max travel minutes worth of familiarity)

---

# Acceptance criteria (Sprint 5 “definition of done”)
1) For the next 14 days, every visit that has at least one feasible provider receives:
   - primary provider
   - backup provider when feasible
2) Unassigned visits are clearly flagged with top reason and appear in Ops Exceptions.
3) Assignments are stable across consecutive nightly runs unless:
   - the current provider becomes infeasible, OR
   - improvement exceeds configured thresholds.
4) Within the 7‑day freeze, reassignment is rare and only occurs for forced reasons or manual override.
5) Admin can review assignments, see ranked candidates and reasons, and apply manual overrides with audit notes.
6) Providers can view their assigned planned/scheduled work.
7) Customers can view planned/scheduled upcoming visits; planned is clearly labeled as “may adjust.”

---

# Test scenarios (high-value)
1) **Two providers, same skills**: visits assign to nearest home base; balance holds.
2) **One provider lacks equipment**: removed from candidates; assignment goes to next best.
3) **Capacity overflow**: excess visits spill to next provider; unassigned if none.
4) **Familiarity vs distance**: familiarity can win only within cap; otherwise distance wins.
5) **Freeze window stability**: small travel improvement does not trigger reassignment.
6) **Provider removed/unavailable**: assignments move to backup or next feasible provider; exceptions if none.
7) **Sparse market**: many visits show “only 1 candidate”; recruiting signals aggregate by zone+category.

---

# Business strategy notes (why this approach is correct)
- **Drive time is the margin killer** in home services. Clustering is your economic moat.
- **Stability is your brand moat.** People tolerate “planned” moving; they do not tolerate “scheduled” moving.
- **Explainability builds ops trust.** If ops can’t see “why,” they’ll override everything and the engine won’t scale.
- **Primary + backup** is the simplest way to get reliability without building real-time dispatch complexity too early.

