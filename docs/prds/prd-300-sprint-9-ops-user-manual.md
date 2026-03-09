# Handled Home Ops User Manual (Backend Operations)
**Version:** Canvas v1.2 (aligned to PRD 300 — Sprints 1–9)
**Audience:** Ops / Dispatchers / Superusers (Admin role)
**Purpose:** Train new ops staff and provide step-by-step procedures to keep the system reliable, calm, and profitable.

> **Operating mindset:** Handled Home is a *density-based subscription* platform, not a calendar app. Ops protects **predictability**, **capacity**, and **trust** first; optimization is secondary. The system runs a 14-day rolling horizon with a **7-day freeze** (LOCKED window) and uses a **provider-first self-healing** model whenever possible.

---

## 0) Quick-start (how to use this manual)
1. Start with **Section 1** (Core concepts + autopilot).
2. Learn the rhythm in **Section 3** (Daily ops) and **Section 4** (Weekly ops).
3. For any problem, go to **Section 7** (Exceptions & repairs).
4. If you’re unsure whether you’re allowed to change something inside the freeze, go to **Section 8** (Break Freeze policy).
5. If you’re launching or changing SKUs, go to **Section 4A/4B** (SKU discovery + tuning).

---

## 1) Core concepts you must understand

### 1.1 Planning windows
- **LOCKED window (Days 1–7):** commitments. Avoid changes. Any change must be explicit and audited.
- **DRAFT window (Days 8–14):** adjustable planning. This is where the system improves density and Ops can tune inputs.
- **Rolling horizon:** Every day, a new day is added to the 14-day plan; the oldest day rolls off.

### 1.2 Zones and capacity
- A **Zone** is a geographic service area with capacity constraints (provider count, shift hours, drive-time, equipment, demand).
- Zones are the core unit of planning, pricing adjustments, and state gating.
- **Capacity is not “hours.”** Capacity includes: drive time, travel clustering, appointment windows, equipment constraints, and provider eligibility.

### 1.3 Market / Zone / Category state gating
- Every **Zone × Category** pair has an **operational state** (e.g., OPEN, WAITLIST, CLOSED).
- The state affects:
  - customer ability to add services
  - planning engine inputs
  - provider recruiting targeting
  - how aggressively the system tries to auto-recover

### 1.4 Provider assignment model (Primary + Backup)
- Each service day has a **Primary provider** plan.
- A **Backup provider** exists for resilience (or the system marks “no backup available” and escalates).
- Provider assignment respects:
  - eligibility (skills, equipment, insurance, checks)
  - availability / shift
  - max workload
  - drive-time thresholds
  - profit and payout constraints

### 1.5 Scheduling profiles (customer expectation)
Scheduling profiles determine what is “locked” vs “flexible”:
- **APPOINTMENT_WINDOW:** customer expects a time window; hardest to move.
- **DAY_COMMIT:** customer expects same day; timing within day is flexible.
- **SERVICE_WEEK:** customer expects within a week; day is flexible.
- **UNATTENDED_FLEX:** explicitly unattended and flexible; system can move within configured limits.

### 1.6 The Ops “promise”
Ops protects:
1. **Customer trust:** show up within expectation, keep the home safe, communicate clearly.
2. **Provider trust:** fair workload, predictable expectations, fast resolution of issues.
3. **Profitability:** prevent silent leaks from reschedules, freebies, and uncontrolled credits.

---

## 2) Autopilot and provider-first self-healing

### 2.1 Autopilot overview (what’s automated vs. what needs humans)
This system is designed to run **mostly unattended**. Humans (Ops/Dispatcher) are primarily:
- monitoring health signals
- handling escalations when consequences exceed tolerances
- tuning inputs (zones, capacity, SKU settings, provider coverage)

### 2.2 What the system automates
**Planning + scheduling**
- Maintains the 14-day horizon.
- Treats Days 1–7 as LOCKED and Days 8–14 as DRAFT.
- Regenerates DRAFT plans on schedule and/or on triggers.

**Provider assignment (Primary + Backup)**
- Assigns Primary and (when available) Backup.
- Rebalances in DRAFT to improve density and reduce drive time.

**Route sequencing + manifests**
- Sequences stops within routes.
- Produces the daily **equipment manifest** per provider/route.

**Comms**
- Sends reminders.
- Sends approved notices when reschedules occur.

**Guardrails**
- Prevents broad churn inside LOCKED.
- Enforces zone/category gating.
- Flags SLA risks, missing proof, and repeated failures.

### 2.3 Provider-first self-healing (preferred)
Providers are closest to reality (traffic, job ran long, supplies). Providers can propose adjustments; the system decides:
- **APPROVE (silent)** when no customer impact and downstream risk stays within tolerances.
- **APPROVE + NOTIFY** when customer impact is within policy.
- **APPROVE + MICRO-REOPTIMIZE** to adjust remaining stops locally.
- **DENY (explain)** when it would violate promises/constraints.
- **DENY + ESCALATE** when it needs human judgement.

Provider actions the system should support:
- Update ETA / “running late”
- Push a stop later within the same day
- Reorder remaining stops
- Move eligible unattended jobs to another day (only if allowed by profile + dials)
- Report blocked access / safety issue / supplies issue

### 2.4 Autopilot health: what “nothing is broken” looks like
When autopilot is healthy, Ops should see:
- **Today (LOCKED) has 0 unassigned jobs** (excluding customer cancellations).
- Minimal SLA-risk flags.
- DRAFT window unassigned is low (or explainable: WAITLIST/CLOSED).
- Reschedule rate inside LOCKED stays low.
- Proof submission is high with few chases.
- Average drive time/route is stable.

**GREEN / YELLOW / RED checklist**
- **GREEN:** no P0/P1, 0 unassigned today, low SLA-risk, DRAFT stable.
- **YELLOW:** DRAFT unassigned creeping up, drive time rising, proof missing rising.
- **RED:** any P0, any unassigned inside LOCKED, planner stale/not running, missed-window cascade risk.

### 2.5 Minimal Ops workload on a GREEN day
On a true GREEN day, Ops work should be ~15–30 minutes:
1. Confirm health dashboard is GREEN.
2. Spot-check 1–2 zones (today + tomorrow).
3. Close out yesterday’s leftovers (if any).
4. Log any early-warning trends.

---

## 3) Roles & permissions (who can do what)

### 3.1 Roles (simple)
- **Superuser:** can change anything; can break freeze; can override states, pricing multipliers, and payout models.
- **Ops:** runs daily procedures; approves limited exceptions; manages disputes/credits within policy.
- **Dispatcher:** routing adjustments in DRAFT; can request break-freeze but cannot execute.
- **Growth manager:** views states/capacity; runs recruiting; no ops-critical changes.

> Policy: If unsure, escalate rather than guess. Wrong changes inside the freeze damage trust.

### 3.2 The audit rule
Any action that affects:
- appointment day/time expectation
- provider assignment
- customer charges/credits
- provider payout
- zone/category state
must be logged with:
- reason code
- notes
- who did it
- before/after snapshot

---

## 4) Daily Ops Rhythm

### 4.1 Morning checklist (every day)
1. Review today’s schedule health (exceptions queue, missing assignments, at-risk windows).
2. Review provider readiness (call-outs, late check-ins if supported, equipment alerts).
3. Confirm communications are queued (today reminders, any reschedule notices).
4. Sanity check today’s routes (impossible sequencing, long drive segments).
5. Close loop on yesterday (incomplete jobs, disputes, payouts needing adjustment).

### 4.2 Midday monitoring
Watch for:
- delays snowballing into missed windows
- access issues
- duration outliers
Prefer provider self-healing first; only step in on denied/escalated actions.

### 4.3 End-of-day wrap
1. Confirm jobs completed or moved to exception queue.
2. Confirm proof submitted for proof-required SKUs.
3. Review credits issued and validate reasons.
4. Prep tomorrow’s at-risk items (ensure backup coverage where possible).

---

## 5) Weekly Ops Rhythm (capacity + health)

### 5.1 Zone capacity review (weekly)
For each zone:
- demand vs capacity
- exception rate (reschedules, missed windows, disputes)
- provider utilization and churn risk
- profitability (payout vs value proxy)

Actions:
- recommend zone adjustments (expand/shrink)
- recruit providers for weak zones
- adjust zone/category state (WAITLIST/CLOSED) if needed

### 5.2 Freeze boundary review (weekly)
- Are we breaking freeze too often?
- If yes: root causes likely include capacity mismatch, too-strict windows, provider reliability, or incorrect SKU durations.

---

## 6) SKU Discovery + Continuous Tuning (provider-informed)

### 6.1 The SKU lifecycle
1. **Draft SKU (pre-launch guess)**
2. **Pilot SKU (first 10–50 jobs)**
3. **Stable SKU**
4. **Optimized SKU**

### 6.2 Provider interview → SKU settings workflow
**Step 1 — Gather provider truth** (3–5 providers per category).

**Step 2 — Convert into SKU settings**
- Level variants (2–3 to start)
- Expected minutes by level + range (p50/p90)
- Presence required
- Scheduling profile
- Flex rules (move-day range, same-day slip, provider “push later”)
- Tools & consumables
- Proof requirements
- Hard stops / blocked reasons
- Add-ons and their duration/tool deltas

**Step 3 — Configure Autopilot Dials defaults**
Conservative for Pilot SKUs; loosen only after stability improves.

**Step 4 — Weekly iteration during pilot**
Adjust minutes, levels, proof requirements, and flex rules based on telemetry.

### 6.3 KPI loop for SKU tuning
Per SKU level:
- p50 and p90/p95 minutes
- reschedules (esp. inside LOCKED)
- proof missing rate
- tool mismatch incidents
- dispute/callback rate

Rules of thumb:
- If p90 >> expected: increase minutes or split into levels.
- If tool mismatches: tighten equipment requirements/manifest mapping.
- If reschedules cluster: adjust scheduling profile or flex rules.

---

## 7) Launch SKUs: Pool, Windows, Pest (templates)

### 7.1 Universal provider interview script
1. Job types + levels
2. Duration p50/p90 per level
3. Variance drivers
4. Scheduling expectations
5. Flexibility boundaries
6. Tools + consumables
7. Blocked reasons + how to prevent
8. Proof/documentation norms
9. Callbacks frequency and causes
10. Jobs/day and acceptable drive time
11. Safety/compliance constraints
12. When presence is required

### 7.2 Pool — starting defaults
- **Scheduling profile:** DAY_COMMIT (default)
- **Levels:** Basic (recurring), Plus, Rescue/Green-to-Clean (one-time)
- **Presence required:** No (unless access constraints)
- **Proof (pilot):** 2–4 photos + optional chemistry reading entry
- **Flex:** push later today allowed; move ±1 day in DRAFT for unattended (if cadence preserved)
- **Autopilot tolerances (pilot):** silent +15m; notify +15–45m; escalate >45m; max pushes/day 2

### 7.3 Windows — starting defaults
- **Scheduling profile:** APPOINTMENT_WINDOW (default)
- **Levels:** Exterior standard; Interior+Exterior; Multi-story/Deep
- **Presence required:** Yes for interior; optional for exterior if access works
- **Proof (pilot):** before/after by elevation/area + checklist
- **Flex:** push later only within window unless customer approves; move-day only for exterior unattended if allowed
- **Autopilot tolerances (pilot):** silent +10m; notify +10–30m; escalate >30m or any window miss; max pushes/day 1

### 7.4 Pest — starting defaults
- **Scheduling profile:** DAY_COMMIT (exterior); APPOINTMENT_WINDOW (interior)
- **Levels:** Perimeter recurring; Interior+Exterior; Targeted one-time
- **Presence required:** No for exterior; Yes for interior
- **Proof (pilot):** treatment log + 2–3 photos
- **Flex:** push later allowed when unattended; move ±2 days in DRAFT for exterior when weather impacts efficacy
- **Autopilot tolerances (pilot):** silent +15m; notify +15–45m; escalate >45m or any interior window affected; max pushes/day 2

### 7.5 Leveling strategy (avoid SKU explosion)
Split levels only when:
- p90 duration is consistently > 1.7× p50, or
- the same variance driver appears in >20% of jobs.

---

## 8) Tools & screens (Ops + Admin UX)
> Names are generic—map to actual UI labels.

### 8.1 Ops Dashboard
Shows:
- today’s workload by zone
- exceptions queue
- missing assignments
- provider call-outs
- alerts (proof missing, SLA risk)

#### 8.1A Ops Dashboard requirements (implementation-ready)
**Purpose:** Provide a single screen where Ops can confirm “GREEN day” in under 60 seconds and only click deeper when something is trending YELLOW/RED.

**Top-of-screen: Autopilot Status Banner (Green / Yellow / Red)**
- Displays current status + primary reason(s) when not GREEN.
- Click opens “Why not green?” breakdown.

**Must-have KPI tiles (today + next 24–48h)**
- Unassigned jobs (LOCKED window) — should be 0
- SLA-risk jobs (within next 4 hours)
- Provider call-outs (today)
- Proof missing (yesterday + today)
- Customer-impacting reschedules (today)

**Exceptions queue (triage list)**
- Default sort: severity (P0→P3), then SLA deadline
- Quick actions: open ticket, assign owner, escalate, notify customer/provider

**Zone health table (rolling 7 days)**
Columns (minimum):
- zone
- jobs today
- unassigned today
- reschedule rate (LOCKED)
- avg drive minutes/route
- proof missing rate
- dispute rate

**Drilldowns (1 click)**
- From any KPI or zone row → list of underlying jobs/providers with timestamps and reason codes.

**Configurable thresholds (“dials” backing the banner)**
All thresholds should be admin-configurable (global + optional per zone/category):
- Max unassigned in LOCKED (default 0)
- SLA-risk threshold (e.g., ETA slip minutes)
- Max reschedule rate inside LOCKED (weekly)
- Max proof-missing rate (rolling 7 days)
- Max provider call-outs per day (by zone)
- Max avg drive minutes/route (by zone)

**Alerting behavior**
- YELLOW/RED transitions generate an Ops notification and create/attach to an incident log.
- RED transitions should create an exception ticket automatically with the reason summary.

**Audit + observability**
- Every automated change and every human override should be visible from the dashboard via:
  - “Recent system actions” feed
  - “Recent overrides” feed

> Acceptance check: If Ops can’t tell whether the system is healthy within 60 seconds, the dashboard is missing the right aggregation.

### 8.2 Rolling Horizon Planner
- 14-day view with LOCKED vs DRAFT
- regenerate plan in DRAFT
- freeze boundary indicator
- break-freeze request flow

### 8.3 Zone Builder
- create/edit zones
- capacity settings
- zone-category state table

### 8.4 Provider Assignment Console
- availability + eligibility
- explainability (“why assigned”)
- override controls (role-gated)

### 8.5 Route Sequencing + Equipment Manifest
- route order + drive time
- manifest per provider/day
- equipment mismatch warnings

### 8.6 Appointment Windows / Home Constraints
- customer preferences (if supported)
- home-required services / constraints
- “do not visit” flags

### 8.7 Exceptions & Reschedules Center
- queue with reason codes
- actions: reschedule, reassign, cancel, credit, escalate
- SLA timers + comm templates

### 8.8 Autopilot Dials (Provider Autonomy Controls)
- tolerance settings (“dials”)
- global defaults + (optional) overrides by zone/category
- provider autonomy tiers (trust-based)
- dial change history + audit log

---

## 9) Standard procedures (normal operations)

### 9.1 Adding a new zone
1. Draft boundaries.
2. Set initial capacity assumptions.
3. Set zone-category states (limited OPEN; others WAITLIST).
4. Seed providers or start recruiting.
5. Run DRAFT plan (Days 8–14) and verify feasibility.
6. Open to customers.

### 9.2 Opening a new category in a zone
1. Confirm provider + equipment coverage.
2. Confirm duration defaults are conservative.
3. Set state to OPEN.
4. Monitor first week (exceptions, duration outliers, provider complaints).

### 9.3 Running the planner (DRAFT)
1. Confirm inputs are clean (availability, addresses, constraints).
2. Generate plan.
3. Review unassigned, drive time, route duration.
4. Fix via capacity settings, recruiting flags, or SKU defaults.
5. Publish.

### 9.4 Provider call-out (same day)
Prefer system backup coverage first.
1. Confirm call-out.
2. Identify affected jobs.
3. Try Backup provider.
4. If no backup: system reschedule (10.2) + customer notice.
5. Log: PROVIDER_CALLOUT.

### 9.5 Customer reschedule request
1. Check LOCKED vs DRAFT.
2. DRAFT: reschedule to next available.
3. LOCKED: approve only for emergency/access/safety; otherwise propose next available.
4. Log: CUSTOMER_REQUEST.

### 9.6 Missed window risk
1. Identify root cause.
2. Prefer provider self-healing (ETA update, reorder, push later) within tolerances.
3. If risk persists: reassign or reschedule.
4. Log: SLA_RISK.

---

## 10) Exceptions & repairs (playbooks)

### 10.1 Severity levels
- **P0:** safety/security risk, damage, serious complaint
- **P1:** missed window/no-show, wrong provider, major service failure
- **P2:** minor quality issue, missing proof, late but completed
- **P3:** admin cleanup/data corrections

### 10.2 Reschedule playbook (system-initiated)
1. Confirm no viable backup.
2. Pick next best slot (minimize disruption; preserve density).
3. Notify customer with approved template.
4. Compensation only if policy triggers.
5. Log: SYSTEM_RESCHEDULE.

### 10.3 Reassign playbook (same day)
1. Validate reassignment won’t cascade into other misses.
2. Prefer provider already near area.
3. If drive time exceeds thresholds: escalate.
4. Log: PROVIDER_REASSIGN.

### 10.4 Proof missing playbook
1. Ping provider with deadline.
2. If unresponsive: mark needs review; apply payout hold policy (if enabled).
3. If customer disputes: request additional info; escalate if repeat.
4. Log: PROOF_MISSING.

### 10.5 Service quality dispute playbook
1. Collect provider proof + customer complaint details.
2. Decide redo / partial credit / no action.
3. Track repeat offenders (provider and customer).
4. Log: QUALITY_DISPUTE.

### 10.6 Credits / compensation guardrails
Use only for:
- missed window/no-show (P1)
- system reschedule inside LOCKED
- safety/access failure caused by provider

Never for:
- customer changed mind
- vague dissatisfaction without evidence
- discount-seeking behavior

Always log: amount, reason, job IDs, approver.

### 10.7 Break-freeze playbook (LOCKED window changes)
1. Confirm necessity (safety, provider failure w/o backup, access blocker).
2. Request approval (role-gated).
3. Execute + notify parties + audit.
4. Post-mortem: why did planning fail and what upstream setting changes prevent recurrence?

---

## 11) Break Freeze rules (the law)

### 11.1 Allowed inside LOCKED
- provider reassignment due to call-out
- reschedule due to access/safety
- emergency cancellations
- correcting obvious data errors that would cause failure

### 11.2 Not allowed (unless Superuser)
- changing zone-category state
- changing capacity settings
- re-running optimizer that reshuffles the entire plan
- mass reschedules for convenience

### 11.3 Superuser-only actions
- global settings changes
- payout model changes
- pricing multipliers / zone adjusted prices
- overriding state gates
- disabling proof requirements

---

## 12) Escalation tree

### 12.1 Escalate immediately
- any P0
- repeated provider issues in same zone/day
- unassigned jobs inside LOCKED
- planner stale/not running
- suspected system bug causing incorrect assignments

### 12.2 Escalation paths
- Dispatcher: routing/sequencing issues, capacity tuning suggestions
- Ops lead: credits, disputes, policy decisions
- Superuser: break-freeze, state changes, payout/pricing overrides
- Engineering: planner/assignment engine bugs, permissions/RLS, data integrity issues

---

## 13) Metrics Ops should watch
- exception rate by zone and category
- reschedules inside LOCKED
- average drive time per route
- unassigned jobs in DRAFT
- proof missing rate
- provider call-out rate
- customer churn/pause after bad experiences

---

## 14) Templates (copy/paste comms)

### 14.1 Customer: reschedule notice
“Hi [Name] — quick update: we need to move today’s [Service] due to an availability issue. Your new window is [Day, Window]. If you need a different time, reply here and we’ll work with you. Sorry for the inconvenience — we’ll make it right.”

### 14.2 Customer: running late
“Hi [Name] — your pro is running a bit behind. Updated ETA: [Time]. Thanks for your patience.”

### 14.3 Provider: proof needed
“Hey [Provider] — please upload proof photos for job [ID] by [Time] so we can close it out. Thanks.”

---

## 15) Glossary
- **LOCKED window:** next 7 days, committed plan
- **DRAFT window:** days 8–14, adjustable plan
- **Zone-category state:** operational status controlling availability
- **Primary/Backup providers:** resilience assignment model
- **Break-freeze:** controlled override in LOCKED window
- **Scheduling profile:** customer expectation type (window/day/week/flex)
- **Autopilot dials:** tolerance settings controlling provider autonomy and notifications

---

## 16) Change log
- v1.2: removed duplicated headings, cleaned structure, added scheduling profiles, consolidated autopilot + provider self-healing, and aligned to Sprint 9 concepts.
