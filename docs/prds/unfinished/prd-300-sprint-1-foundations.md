# Sprint 1 PRD — Foundations: Data Model + Geo Index + Schedule States (Non-Prescriptive)

## Executive summary
Sprint 1 establishes the **foundation** required for an automated, nationwide routing + scheduling engine—without prescribing implementation internals. The output of this sprint is a set of **capabilities** in the codebase:
- The system can represent visits, bundled tasks, provider capabilities, and schedule states.
- The system can attach a stable geo index to properties/providers.
- Ops can configure core scheduling “dials” (including 2-hour appointment windows) in the Admin UI.

This sprint is deliberately focused on **correct primitives + clear UX**, so later sprints can add optimization logic safely.

---

## Strategic intent (why this sprint matters)
Handled Home’s competitive edge is **automation with calm predictability**:
- **Lower cost-to-serve** through clustered routing and fewer exceptions.
- **Faster market expansion** because regions/zones are computable and measurable.
- **Higher retention** because schedules feel stable and familiarity is preserved when feasible.
- **Monetization without chaos** via scarcity-based paid preferences (priced constraints) and appointment windows for presence-required services.

Sprint 1 ensures we don’t “bake in” brittle assumptions. If we get the primitives right, the optimizer can evolve without constant migrations or UX rework.

---

## Locked decisions (scope constraints)
- **Planning model:** Rolling 14-day horizon with **7-day freeze** (implementation in later sprint; Sprint 1 defines states/fields/UX expectations).
- **Auto-assigned Service Day** by default.
- **Home-required categories:** **2-hour appointment windows** in v1, configurable as an **Admin dial**.
- **Paid preferences:** **scarcity-based handle cost**.
- **Zones:** overlap allowed for optimization (zones are control surfaces, not hard walls).
- **Customer promise:** **Day + ETA range**; **15-minute arrival notification** when a customer purchased a preference and always for presence-required appointments.

---

## Sprint goals (what “done” means)
### G1 — Scheduling primitives exist and are consistent
- A “visit” can hold one or more service tasks (bundling foundation).
- Each visit has a **schedule state** that supports the future rolling planning model.
- Visits can have an optional **time window** (presence-required) and optional **ETA range**.
- The system supports plan/versioning semantics so later sprints can replan without confusing the user.

### G2 — Geo primitives exist and are queryable
- Properties and provider home bases have a stored geo coordinate.
- The system can attach a **stable geo index** suitable for fast filtering/grouping (implementation choice up to Lovable—e.g., H3 or equivalent).

### G3 — Provider capability primitives exist
- Providers can store:
  - home base location
  - service categories they can perform
  - equipment kits
  - working hours + capacity limits

### G4 — Admin scheduling dials exist
- Ops can set policy defaults in Admin (with audit trail):
  - Appointment window length (default 2h)
  - Day + ETA range display policy
  - Arrival notification minutes (default 15)
  - Preference pricing mode display (scarcity-based)

---

## Non-goals (explicitly not in Sprint 1)
- Route optimization algorithms (assignment/sequencing)
- Zone builder and market generation
- Waitlist/recruiting state machine integration (PRD-025)
- “Best 3 appointment options” engine
- Disruption replanning (weather/no-show)

---

## UX principles (apply now)
1) **Predictability beats cleverness:** show clear states and effective dates.
2) **Customer-friendly labels:** avoid internal jargon like “DRAFT/LOCKED” on customer surfaces.
3) **Minimal cognitive load:** one primary action per screen; hide advanced options.
4) **Explain constraints as benefits:** “7-day heads up keeps routes efficient and prices low.”

---

## User flows (Sprint 1)

### Flow A — Admin configures scheduling policy dials
**Intent:** enable nationwide ops control without code edits; ensure later sprints can evolve behavior with simple settings.

**Steps**
1) Admin → Settings → **Scheduling**
2) Admin configures:
   - Appointment window length (default 2h; selectable options)
   - Customer promise display: Day + ETA range
   - Arrival notification minutes (default 15)
   - Preference pricing: shown as scarcity-based (and optionally toggleable if the codebase supports it)
3) Save with audit reason

**UX requirements**
- Settings are presented as **policy cards** with:
  - what it affects
  - when it takes effect
  - a short “why this exists” tooltip
- Save requires an audit note (short reason) to reduce accidental churn.

---

### Flow B — Provider completes “Work Setup”
**Intent:** capture the minimum data required to build efficient, clustered routes later.

**Steps**
1) Provider → Profile → **Work Setup**
2) Enter:
   - home base (address or pin)
   - categories supported
   - equipment kits
   - working hours + max jobs/day
3) Save

**UX requirements**
- Use a 3-step setup pattern: Location → Services → Schedule
- Include “why we ask” microcopy: “Tighter routes = higher earnings per hour.”

---

### Flow C — Customer sees upcoming visits and scheduling promises
**Intent:** introduce the scheduling model gently so customers trust it.

**Steps**
1) Customer dashboard → Upcoming
2) Show each upcoming visit:
   - date
   - ETA range (may be placeholder in Sprint 1 but fields/UX should exist)
   - status label (customer-friendly)

**Customer-facing state labels (recommended)**
- Planning (future DRAFT)
- Scheduled (future LOCKED)
- Today (DISPATCHED)
- In Progress
- Completed

**UX requirements**
- Calm banner: “We optimize routes weekly. Changes take effect starting <date>.”

---

## Functional requirements (non-prescriptive)

### FR1 — Scheduling state machine
The system supports these states (names may differ internally):
- Planning (draft)
- Scheduled (locked)
- Dispatched (day-of)
- In progress
- Complete
- Exception pending
- Canceled / Rescheduled

Requirements:
- A visit can transition through these states in a traceable way.
- Later sprints can create new plan versions without losing history.

### FR2 — Visits support bundling
- One visit can include multiple service tasks at the same property/date.
- Tasks can store duration estimate and whether presence is required.

### FR3 — Geo indexing
- Properties and providers store geo coordinates.
- The system stores a geo index value that supports grouping/filtering and is stable across runs.

### FR4 — Provider capabilities
- Providers can store service categories + equipment kits + capacity + working hours.

### FR5 — Policy configuration dials
- A policy layer exists that provides resolved values for:
  - appointment window minutes (default 120)
  - ETA range display (Day + range)
  - arrival notification minutes (default 15)
  - preference pricing mode (scarcity)

Notes:
- Implementation should follow existing code patterns and reuse existing “policy precedence” mechanisms if present.

---

## Suggested UI components

### Admin → Scheduling Settings
- **Policy cards** with:
  - dropdown/select for appointment window length
  - toggle for ETA range display
  - numeric input for arrival notification minutes
  - read-only badge: “Preference pricing: scarcity-based” (or toggle if feasible)
- **Effective date** messaging (future-friendly): “Applies to visits scheduled after <date>.”
- **Audit reason modal** on save.

### Provider → Work Setup
- Stepper layout
- Address capture (or map pin)
- Multi-select for categories and equipment
- Simple weekly schedule builder (defaults allowed)

### Customer → Upcoming
- List cards with date + ETA range + status
- “How scheduling works” expandable disclosure

---

## Privacy & trust requirements
- Provider home base is sensitive:
  - visible to provider and ops/admin as needed
  - never exposed to customers
- Policy changes and schedule-affecting changes must be auditable.

---

## Acceptance criteria
1) Admin can change appointment window length (default 2h) and the resolved value is reflected in relevant UI.
2) Providers can save home base + capabilities and return later to edit.
3) Customer Upcoming view displays date + status labels; ETA range fields exist even if the engine is not yet computing precise ETAs.
4) Visit/task bundling is representable (a visit can include multiple category tasks).
5) Schedule state transitions are possible and recorded.
6) No customer can view provider home base details.

---

## Testing expectations
- Basic tests for:
  - policy resolution returning the correct appointment window length
  - provider setup persistence
  - visit/task bundling representation
  - state transitions
- Manual QA:
  - admin dial updates are intuitive and audited
  - customer language is clear and non-technical

---

## Deliverables checklist
- Admin Scheduling Settings surface (and wiring)
- Provider Work Setup surface (and wiring)
- Customer Upcoming visits list with clear labels
- Scheduling primitives + state machine support
- Geo coordinate + geo index support
- Audit logging for policy changes

---

## Handoff notes to Lovable
- Keep implementation aligned with existing conventions in the codebase.
- Prefer minimal migrations and reuse existing primitives.
- Focus on correctness, privacy, and clear UX; optimization comes later.

