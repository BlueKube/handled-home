# PRD 300 — Sprint 8: Exceptions, Reschedules, and Ops Control v1

## TL;DR
Sprint 8 is the **operational safety net** that turns the routing engine into a real business:
- A unified **Exceptions Queue** (window-at-risk, overdue service-week, provider unavailable, access failure, weather)
- Minimal but powerful **Ops actions** to repair schedules without breaking trust
- Customer and provider **reschedule / issue reporting** flows
- Guardrails for when you’re allowed to **break the freeze**

Focus: **reliability, trust, and controllability**—not perfect optimization.

---

## Context & Dependencies
Assumes:
- Visit + Visit Tasks with schedule states (Sprint 1)
- Zones (Sprint 2)
- Zone×Category state gating (Sprint 3)
- Rolling horizon planner + freeze (Sprint 4)
- Provider assignment (Sprint 5)
- Route sequencing + ETAs + provider availability blocks (Sprint 6)
- Scheduling profiles: APPOINTMENT_WINDOW / DAY_COMMIT (optional) / SERVICE_WEEK (Sprint 7)

---

## Goals
1) Give Ops a single place to see **what will break** and **what already broke**.
2) Provide a small set of repair actions that preserve:
   - customer trust (promises)
   - provider trust (fairness)
   - unit economics (density)
3) Support customer/provider-initiated changes without creating “calendar chaos.”
4) Define when and how the system may **override the 7-day freeze**.

---

## Non-Goals
- Full day-of real-time replanning across the entire market
- Live GPS tracking
- Complex multi-party negotiation flows

---

## Exception Types (v1)

### Predictive (found at nightly planning)
- **Window-at-risk** (appointment window likely to be missed)
- **Service-week-at-risk** (likely to miss WeekEndDate)
- **Provider overload** (finish time beyond working end)
- **Coverage break** (no qualified provider remaining)

### Reactive (reported day-of)
- **Provider unavailable** (sick, vehicle issue)
- **Access failure** (customer not home, gate locked, wrong code)
- **Customer reschedule request**
- **Weather / safety stop**
- **Quality block** (provider reports hazard)

---

## Ops Console (Core UX)

### 0) Severity, SLA, and Escalation (critical)
To prevent the exceptions queue from becoming a junk drawer, each exception must have:
- **Severity** (🔴 urgent / 🟠 soon / 🟡 watch)
- **SLA target** (how quickly ops should resolve)
- **Escalation timer** (auto-bump severity if not handled)

Recommended defaults:
- 🔴 Urgent: impacts a scheduled appointment within **48 hours** (SLA: same day)
- 🟠 Soon: impacts within **3–5 days** (SLA: 24–48h)
- 🟡 Watch: outside 5 days or low confidence risk (SLA: within 5 days)

Escalation rule (v1): if unresolved when within the next **48 hours**, bump to 🔴.

---

## Ops Console (Core UX)

### 1) Exceptions Queue
Each item shows:
- Severity: 🔴 urgent / 🟠 soon / 🟡 watch
- Type (Window-at-risk, Overdue, Provider unavailable, etc.)
- Affected customer + service
- Scheduled date + promise (window / service-week)
- Assigned provider
- “Why” summary (top reasons + key metrics)

### 2) Exception Detail View
A guided repair panel:
- Current plan snapshot: route order, ETA window, remaining capacity
- Constraints: window, due-by, provider hours, blocked windows
- Repair suggestions (ranked) with impact estimates:
  - Customer impact (promise change?)
  - Provider impact (extra minutes)
  - Business impact (extra drive)

### 3) Ops Actions (v1)
Keep the set small:
1) **Reorder within provider day** (respect windows)
2) **Move to another day** (outside freeze allowed; inside freeze requires Break Freeze)
3) **Swap provider** (same day or different day) with feasibility check
4) **Convert scheduling profile** (rare; only with customer consent)
5) **Cancel / refund / credit** (last resort)

#### Missing-but-critical: Action confirmations + comms preview
For any action that changes a customer promise (window/day/week):
- Show an **impact preview** before applying:
  - Old promise → new promise
  - “Will notify customer: Yes/No”
  - Provider impact minutes

Also include:
- **Idempotency + undo (Decided, critical):** **all ops actions** must be safe to retry and must support **Undo** within a short window (e.g., 10 minutes).
  - Undo should restore the previous plan snapshot and roll back any state changes.
  - For financial actions (cancel/refund/credit), Undo should create an explicit **reversal** (e.g., re-instate the visit and reverse the credit/refund) and require a short reason note.
  - If an external payment processor makes a true reversal impossible, Undo should create the closest compensating action (e.g., issue a counter-credit) and clearly label it in the audit trail.
- **Audit trail completeness:** store reason code + freeform note for every ops action, and link the action to the originating exception item.

---

## Policy: Freeze Override (Break Freeze)
Inside the 7-day lock, changes should be rare and explicit.

### When breaking freeze is allowed (recommended)
- Provider unavailable
- Safety / weather
- Access failure
- High-confidence Window-at-risk that can’t be repaired without a move

### Break-freeze requirements
- Ops reason code
- Customer notified if promise changes
- Audit log records who/why/what changed

### Missing-but-critical: Break-freeze frequency guardrail
To protect trust, limit how often a single customer’s locked schedule can be altered.
- Starter default (policy): **MaxBreakFreezePerCustomerPer30Days = 1** (exceptions: true emergencies)
- If exceeded, require supervisor/secondary approval (later) or show a strong warning.

### Provider swap policy by planning window (recommended)
- **Inside freeze:** provider swaps require ops action (exception-driven), because swaps change customer experience.
- **Outside freeze:** provider swaps may be **auto-applied** if guardrails pass (see Open Questions #2 decision).

---

## Algorithms & Math (v1)

### A) Repair Strategy Order (deterministic)
Try in order:
1) Local repair (same provider/day): reorder + shift flexible stops
2) Same provider, different day (if allowed; outside freeze)
3) Swap provider within zone (same day)
4) Swap provider within zone (different day)
5) Escalate (refund/credit/manual)

Feasibility checks:
- Windowed: Start_i ≤ w_end
- Service-week: scheduled date ≤ WeekEndDate
- Provider: finish ≤ day end

### B) Scoring candidate repairs
**RepairScore = +PromiseKeptBonus − (AddedDriveMin × w_drive) − (AddedOvertimeMin × w_ot) − (ProviderDisruption × w_disrupt) − (CustomerDisruption × w_cust)**

---

## Customer UX

### Missing-but-critical: Customer communication templates (quiet but consistent)
Standardize messaging so ops actions feel intentional, not chaotic.
Recommended templates (short):
- **Promise changed:** “We updated your visit to keep service reliable. New plan: <new promise>.”
- **At risk:** “This week’s service may run later than expected. We’ll complete it as soon as possible.”
- **Access failed:** “We couldn’t access your home. We reserved <option>. Confirm or choose another.”

Avoid multiple pings: max **1 message per change** unless the situation worsens materially.

---

## Customer UX

### 1) Customer reschedule request
**Decided recommendation:** Inside the freeze, allow **self-serve reschedules** from a small set of **feasible options**.

Inside freeze:
- Show 3–6 feasible alternatives:
  - **APPOINTMENT_WINDOW:** pick another offered 3-hour window in the next 7–14 days
  - **DAY_COMMIT (if enabled):** pick another day + AM/PM
  - **SERVICE_WEEK:** move to the next service week
- Confirm calmly: “We’ll update your plan tonight.”
- If no feasible options exist: “We’ll help you reschedule” → creates an ops exception.

Outside freeze:
- Normal offered feasible options.

### 2) Access failure outcome (recommended: auto-hold + easy confirm)
**Recommendation:** for access failure, the system should **auto-create a priority reschedule** by placing a **temporary hold** on the *next best feasible option*, while still giving the customer quick control.

Behavior:
- Immediately mark the visit as **Access failed** and create an exception item.
- System selects the **next best feasible** slot based on the same offering logic:
  - **APPOINTMENT_WINDOW:** next feasible 3-hour window (or best within the next 7–14 days)
  - **DAY_COMMIT:** next feasible day + AM/PM
  - **SERVICE_WEEK:** move to the next service week (or remaining days this week if still feasible)
- Create a **soft hold** (temporary reservation) on that option so it doesn’t vanish.

Customer flow:
- Show a calm message:
  - “We couldn’t access your home today. We reserved the next available time: **Wed 1–4**. Confirm or choose another option.”
- Actions:
  - **Confirm** (one tap)
  - **Choose another time** (shows 3–6 feasible options)
  - **Skip this cycle** (optional, category/policy controlled)

Hold expiration (recommended):
- Hold expires after **HoldTTLHours = 12** (admin dial). If it expires:
  - release the hold
  - keep the item in the exceptions queue as “Customer confirmation needed”

Why this is best:
- Fast recovery (most customers just confirm)
- Avoids ops workload
- Prevents the customer from facing a blank screen of options

### 3) Transparency
- If a promise changes: notify once with clear reason + new plan.

---

## Provider UX

### Missing-but-critical: Provider fairness + no-blame defaults
Exceptions should not punish providers unfairly or encourage bad behavior.
- Access failure should capture **reason codes** (gate locked, customer not home, code wrong).
- If access failure is customer-caused, do not penalize provider reliability score.
- If provider-caused (late start, skipped), flag for coaching (later sprint), not immediate punishment.

---

## Provider UX

### 1) Report an issue
Provider can flag:
- Can’t access
- Customer asked to skip
- Safety/weather
- Running late (manual)

### 2) Provider unavailable
- Provider marks unavailable for a day → affected visits flagged + repair suggestions.

---

## Operational Analytics (minimal but critical)
To improve the system, log every exception + resolution outcome with reason codes.

Minimum metrics:
- Window miss rate (by category, zone, provider)
- Access failure rate (by access mode)
- Break-freeze frequency
- Reschedule frequency
- Time-to-resolve exceptions (SLA compliance)

Also capture (critical for learning):
- **Top reason codes** frequency (access codes wrong, provider late start, weather, etc.)
- **Repair outcome distribution** (reorder vs move day vs swap provider vs cancel)
- **Customer impact rate** (% repairs that changed a promise)
- **Repeat offender signals** (same property repeated access failures)

---

## Roles & Permissions (minimal but critical)
Not everyone should be able to break freeze or swap providers.
Recommended levels:
- **Ops:** can reorder within day, suggest swaps/moves, resolve low-severity exceptions.
- **Dispatcher/Superuser:** can break freeze, swap providers, cancel/refund.

All privileged actions require reason code + audit trail.

---

## Evidence & Attachments (minimal but critical)
For disputes and trust:
- Allow attaching **photos** and **notes** to an exception item (e.g., locked gate photo, weather hazard).
- Show these in the exception detail view.

---

## Support Hand-off (minimal but critical)
Some exceptions become customer support tickets.
- If an exception remains unresolved past its SLA, escalate to a support queue.
- Provide a “Create support ticket” action (or internal tag) from the exception detail view.

---

## Playbooks & Automation Hooks (small but critical)
To make ops fast and consistent, attach lightweight playbooks to each exception type.

### Playbooks (v1)
For each exception type, define:
- **Suggested next actions** (ordered)
- Required comms (customer/provider) and templates
- Evidence checklist (photo, note, reason code)

### Automation hooks (v1)
- Auto-create exceptions from signals:
  - provider marks unavailable
  - access failure reported
  - nightly “at risk” detections
- Auto-assign exceptions to an owner (round-robin or by zone)

---

## Bulk Ops Tools (high leverage)
Ops will often handle multiple items at once.
- Bulk actions (v1):
  - mark as “Acknowledged”
  - assign owner
  - snooze until next nightly run
  - bulk message (using templates) *only when appropriate*

---

## Provider Compensation Rules (fairness + behavior)
Define defaults so exceptions don’t create provider resentment.
- If **customer-caused access failure**:
  - provider receives a small **show-up credit** (policy dial) and is not penalized.
- If **provider-caused miss**:
  - no credit; flag for coaching later.

Keep v1 simple: policy-level defaults + audit trail.

---

## Customer Recovery Policy (minimal)
When promises are broken, you need a consistent recovery gesture.
- Optional v1 rule: if a promised window is missed (or a service-week goes overdue), auto-suggest:
  - a small credit
  - or a “priority next window”

Keep decisions ops-controlled at first, but log outcomes.

---

## Notification Throttling (avoid spam)
Across all exception-related messaging:
- Max **1 notification per change** (already stated)
- Max **N notifications per week per customer** (recommended dial) to prevent flood during edge cases

---

---

---

## Acceptance Criteria
1) Predictive exceptions appear in Ops queue after nightly planning.
2) Reactive exceptions can be created from provider/customer flows.
3) Ops can apply the core actions with feasibility checks.
4) Any break-freeze action requires reason + audit + customer notification when promises change.
5) Customer reschedules inside freeze are **self-serve from feasible options**, with ops fallback when none exist.
6) Access failure triggers an exception and generates an **auto-held best next option** for the customer to confirm (with alternate feasible options available).

---

## Open Questions (to decide with Brandon)
1) For access failure: **Decided — auto-hold next best feasible option**, with customer confirm/choose-alternate, and a hold TTL (recommended 12 hours).
2) Provider swaps outside freeze: **Decided — AUTO with guardrails** (promise preserved, material improvement, stability cap, provider eligibility). Inside freeze remains ops/exception-driven.
3) Should we introduce a “Missed Appointment Fee” later, or keep it purely operational?
4) Should “Skip this cycle” be allowed for some categories (e.g., pest) but not others (e.g., cleaners)?
5) Undo scope: **Decided — Undo for all ops actions**, including cancel/refund/credit, implemented as true reversal when possible or compensating action when not.

