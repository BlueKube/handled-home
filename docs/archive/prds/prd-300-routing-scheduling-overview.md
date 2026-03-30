# Routing & Scheduling Engine — Scope Overview (Sprint Plan)

## Purpose
Define the implementation scope and architecture for a nationwide-scale routing + scheduling engine that:
- Auto-assigns **Service Day** by default to minimize cost.
- Uses a **rolling planning window** with a **7-day freeze** for predictability.
- Supports **home-required** categories via appointment windows with **“best 3 options”** suggestions.
- Supports **multi-category bundling** per visit (shared travel + shared setup).
- Preserves **provider/customer familiarity** as a soft preference (without sacrificing profitability).
- Handles **emergencies** (weather, no-show, lateness) via minimum-disruption replanning.

This document breaks the work into **8 sprints**. Each sprint will later get its own detailed PRD.

---

## Key Product & Ops Decisions (Locked for this scope)
1) **Rolling Horizon:** Plan over **14 days**; **Days 1–7 are LOCKED**, Days 8–14 are DRAFT.
2) **Customer Change Policy:** Routine changes require **≥7 days heads-up** to be guaranteed (DRAFT only).
3) **Service Day Assignment:** **System auto-assigns** Service Day by default.
4) **Paid Preferences:** Customer day/time preferences can be allowed but cost **extra handles** (priced constraints).
5) **Home-Required Categories:** Require explicit availability; app suggests **best 3 time options**.
6) **Familiarity:** Prefer repeat provider–customer pairing, but as a **capped soft reward**.
7) **Emergency Handling:** Replan locally with **minimum disruption**; avoid recomputing entire market.
8) **Zones:** Operational zones are derived from geo math (not ZIPs). Use **H3 cells** + PostGIS for geo truth.

---

## Glossary of Core Concepts
- **H3 Cell:** Hex-grid index used for scalable geo aggregation and partitioning.
- **Zone:** A merged set of H3 cells used for market controls (states, pricing, capacity).
- **Visit:** A service occurrence at a property on a date (may include multiple tasks/categories).
- **Task:** A category/service item at a property (can be bundled into a Visit).
- **LOCKED Window:** Next 7 days of scheduled visits are commitments (minimize changes).
- **DRAFT Window:** Days 8–14 are candidates; optimizer can rearrange.
- **Shadow Price Map:** Internal cost map by (cell, day, time bucket) representing scarcity/capacity.

---

## Sprint Plan Overview (8 Sprints)

### Sprint 1 — Foundations: Data Model + Geo Index + Schedule States
**Goal:** Establish the canonical data model and state machine needed for routing/scheduling.

**Deliverables**
- Tables/fields (or equivalents) to support:
  - Provider home base location, skills, equipment kits, max jobs/day, working hours.
  - Property geo (lat/lng) + H3 cell.
  - Service definitions: categories, duration estimates, presence-required flag.
  - Visits and Tasks (support multi-category bundling).
- Scheduling state machine:
  - DRAFT, LOCKED, DISPATCHED, IN_PROGRESS, COMPLETE, EXCEPTION_PENDING, CANCELED/RESCHEDULED.
- Plan versioning fields: `route_plan_version`, `locked_at`, `draft_generated_at`.
- PostGIS + spatial indexes (or documented alternative if not available during pilot).

**Acceptance**
- Any property/provider can be mapped to a cell.
- Visits can exist in DRAFT and be promoted to LOCKED.

---

### Sprint 2 — Zone Builder v1 (Automated Zones from H3)
**Goal:** Automatically create operational zones that minimize drive time and support capacity controls.

**Deliverables**
- Zone Builder v1:
  - Inputs: region boundary, H3 resolution, min/max zone size targets, demand/supply metrics.
  - Output: zones as merged H3 sets (stored as polygon + H3 list).
- Zone naming convention:
  - Internal ID + customer-facing label (e.g., “Austin Central”).
- Zone metrics:
  - demand density, expected weekly minutes, supply minutes, drive-time dispersion proxy.

**Acceptance**
- Generate zones for a pilot region automatically.
- Point-in-zone queries work.

---

### Sprint 3 — Market/Zone Category States Integration (PRD-025 Alignment)
**Goal:** Wire operational zone/category states to control catalog availability and recruiting/waitlist behavior.

**Deliverables**
- Zone-category states (including WAITLIST_ONLY and PROVIDER_RECRUITING) used consistently across:
  - Customer catalog gating
  - Provider opportunity surfaces
  - Admin zone matrix
- Category-level waitlist support.
- Transition guardrails + audit log for state changes.

**Acceptance**
- Customer cannot subscribe where category is not OPEN/allowed.
- Waitlist works per (zone, category).

---

### Sprint 4 — Rolling Horizon Planner (14-day plan + 7-day freeze)
**Goal:** Implement the nightly (or periodic) planner that creates and maintains DRAFT/LOCKED schedules.

**Deliverables**
- Planner job:
  - Generates DRAFT visits for days 8–14.
  - Promotes day 8 into LOCKED nightly (or on schedule).
  - Respects customer change policy and does not alter LOCKED unless forced.
- “Change effective date” logic:
  - Customer changes apply only to DRAFT window by default.
- Basic stability rules:
  - Penalize changes to provider assignment and major time shifts.

**Acceptance**
- A customer change today affects ≥8 days out.
- System produces a stable weekly plan that updates daily.

---

### Sprint 5 — Provider Assignment v1 (Clustered, Capacity-Constrained)
**Goal:** Assign visits to providers to keep routes clustered, minimize drive time, and respect skills/equipment.

**Deliverables**
- Candidate selection (fast filter) based on:
  - skill/category coverage
  - cell proximity
  - capacity and working hours
- Assignment solver v1:
  - Objective: minimize estimated travel + penalize imbalance + reward familiarity (capped)
  - Constraints: max jobs/day, skills, equipment kits, time window feasibility proxy
- “Primary + Backup” assignment output per visit.

**Acceptance**
- Each visit has primary provider (and backup when feasible).
- Assignments are stable unless significant efficiency gain or forced.

---

### Sprint 6 — Route Sequencing v1 + Equipment Manifest
**Goal:** Create an ordered daily route per provider and generate day-of execution artifacts.

**Deliverables**
- Sequencing algorithm v1:
  - Per-provider ordering with service durations and coarse time windows.
  - Generates ETA ranges (coarse) for customer-facing displays.
- Equipment manifest:
  - Determines required kits for the day (union of visit requirements).
- Multi-category bundling rules:
  - Merge tasks at same property into one stop, apply shared setup discount.
  - Penalize splitting same address across providers/days unless forced.

**Acceptance**
- Providers see a clear stop order + equipment needs.
- Bundled visits reduce total travel vs split visits.

---

### Sprint 7 — Home-Required Scheduling (Appointment Windows + Best 3 Options)
**Goal:** For presence-required categories, generate and present three optimal time options and lock appointments.

**Deliverables**
- Define time-window granularity for v1 (e.g., Morning/Afternoon/Evening or 2-hour windows).
- Customer availability capture UI + storage.
- “Best 3” suggestion engine:
  - Enumerate feasible windows
  - Score by marginal cost (shadow price) + feasibility checks
- Appointment lock behavior:
  - Once selected, becomes LOCKED within the freeze window.

**Acceptance**
- Home-required services cannot be scheduled without an appointment window.
- Suggested top 3 options are consistent and explainable.

---

### Sprint 8 — Disruption Engine (Minimum-Disruption Replanning) + Preference Pricing
**Goal:** Handle weather/no-show/late provider disruptions and implement paid preference constraints.

**Deliverables**
- Disruption detection signals:
  - provider no-show, late threshold, weather block category, access issue
- Replanning actions (in order):
  1) resequence remaining route
  2) swap subset to backup providers nearby
  3) push non-urgent outdoor work into DRAFT horizon
  4) for home-required appointments: instantly propose 2–3 new options
- Preference pricing:
  - Customer can request preferred day/time bucket for extra handles
  - System accepts preference if feasible; otherwise offers alternatives
- Audit + analytics for changes:
  - reason codes, cost impact, customer/provider churn impact

**Acceptance**
- A no-show can be recovered without blowing up the entire day.
- Preference requests are either scheduled or gracefully rejected with options.

---

## Solver & Infrastructure Strategy (Pilot → Nationwide)

### Solver Interface Abstraction
Implement an internal interface so you can swap engines:
- `TravelTimeProvider` (matrix + point-to-point)
- `AssignmentSolver`
- `RouteSequencer`
- `Replanner`

### Pilot (Fast Time-to-Proof)
- Start with a commercial travel-time provider and a robust VRP solver (or managed optimization), while preserving the abstraction layer.

### Scale (Cost & Control)
- Add caching (cell-to-cell travel times, shadow price maps)
- Consider OR-Tools as a backend option while retaining a commercial fallback.

---

## Core Metrics (What “Good” Looks Like)
- Avg drive minutes per visit (and per provider day)
- Jobs per provider hour (productivity)
- % visits served by same provider as last time (familiarity)
- Route churn rate (how often routes change after LOCKED)
- On-time rate for home-required appointments
- Disruption recovery success rate (no-show/weather)
- Unit economics per zone/category (profitability)

---

## Open Decisions to Lock Before Sprint PRDs (Locked)
1) **Home-required time window granularity (v1):** **2-hour windows** (admin-configurable dial).
2) **Paid preference policy:** **Scarcity-based handle cost** (price varies by capacity/availability).
3) **Zone boundaries:** **Overlap allowed** for assignment optimization (zones remain a control surface, not hard walls).
4) **Service-day promise language:** Show **day + ETA range**; add **15-minute arrival notification** when a customer purchased a preference (and always for presence-required appointments).

---

## Next Step
Create one **detailed PRD per sprint** (Sprints 1–8), including:
- user stories
- acceptance criteria
- data schema changes
- UI changes
- job/cron details
- integration points
- testing plan
- rollout plan

