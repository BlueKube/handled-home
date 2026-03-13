# Sprint 4 PRD — Rolling Horizon Planner (14‑Day Plan + 7‑Day Freeze) — Non‑Prescriptive

**Project:** Handled Home — Routing & Scheduling Engine (PRD 300)  
**Sprint:** 4 of 8  
**Primary outcomes:** A nightly planner that maintains a stable, predictable schedule using a **14‑day rolling horizon** with a **7‑day freeze**, while enforcing the **“changes take effect ≥ 8 days out”** policy.

---

## 0) Executive summary

Sprint 4 implements the **planning heartbeat** of Handled Home:

- Every night, the system refreshes the schedule for the next **14 days**.
- The next **7 days** are **LOCKED** (commitment window).
- Days **8–14** are **DRAFT** (optimizer can shape these days without breaking promises).
- Customer routine changes (and most ops adjustments) are **effective in the DRAFT window only**, unless explicitly marked as an exception.

This sprint creates the platform behavior that makes Handled Home feel premium:
**predictable, calm, and “handled”**—without giving customers the power to create scheduling chaos.

---

## 1) Strategic intent (why this sprint matters)

Handled Home wins by combining:
- **Customer trust:** “I know what day things happen, and it doesn’t randomly change.”
- **Operational leverage:** You can scale market-by-market without manual scheduling.
- **Unit economics:** Predictability enables route density and reduces costly exceptions.

A rolling horizon with a freeze window is the mechanism that reconciles:
- customers wanting control  
with  
- the business needing density and stability.

If Sprint 4 is done correctly, later sprints (assignment, routing, appointment windows, disruptions) become “plug‑ins” that operate inside a stable planning framework.

---

## 2) Locked decisions (scope constraints)

1) **Rolling horizon:** Plan **14 days** ahead.
2) **Freeze window:** Days **1–7** are **LOCKED** and should not be changed by normal planning.
3) **Draft window:** Days **8–14** are **DRAFT** and may be reshaped nightly.
4) **Nightly planning boundary:**  
   - All approved **zone/category state changes** (from Sprint 3) become effective at the **next nightly planning run**, not immediately.  
   - Customer routine changes are also applied at the nightly boundary.
5) **Customer change policy:** Changes made “today” are guaranteed only if they affect **≥ 8 days out** (the DRAFT window).

---

## 3) Definitions (working language)

- **Plan Run:** One execution of the planner that evaluates inputs and outputs an updated schedule.
- **LOCKED day:** A day inside the next 7 days; schedule is treated as a commitment.
- **DRAFT day:** A day 8–14; schedule can change with minimal customer impact.
- **Service Day:** The customer’s default day of week for routine service.
- **Visit:** A property + date occurrence that can contain multiple tasks (bundling).
- **Task:** A service item (SKU/category) attached to a visit.
- **Effective date:** The first date a change is allowed to influence the plan (generally the first DRAFT day).

---

## 4) Planner responsibilities (what it must do)

### 4.1 Maintain a rolling 14‑day schedule
For each property with an active subscription:
- Ensure the schedule has the correct set of **Visit candidates** for the next 14 days.
- Ensure **LOCKED vs DRAFT** classification matches the current date.

### 4.2 Promote days forward nightly
On each nightly run:
- “Day 8” becomes **LOCKED** (the freeze window advances by 1 day).
- A new “Day 14” is created/filled as **DRAFT**.

### 4.3 Apply changes only where allowed
- Customer routine edits (add/remove tasks, cadence changes, preference toggles) should:
  - **not** rewrite LOCKED,
  - take effect at the first eligible DRAFT date.
- Ops approvals from Sprint 3 (market/zone/category states) become effective at the nightly boundary and influence:
  - customer catalog gating (already handled in Sprint 3 UX),
  - and the planner’s **creation/retention** of DRAFT tasks.

### 4.4 Preserve stability by default
The planner should avoid reshuffling DRAFT plans unnecessarily:
- Prefer keeping the prior draft arrangement unless a constraint changed.
- When changes are required, make the smallest possible change set.

---

## 5) Algorithms & math (be explicit)

### 5.1 Date windows
Let **T0** be “today” in the relevant operating timezone.

- **LOCKED window** = dates **T0+0** through **T0+6** (7 days)
- **DRAFT window** = dates **T0+7** through **T0+13** (7 days)
- **Horizon** = LOCKED ∪ DRAFT = **14 days**

**Nightly boundary rule:**  
At the nightly run, re‑compute T0 and re‑assign window membership.

### 5.2 Effective date rule for customer changes
When a customer changes their routine at time **t**:
- Set **EffectiveDate = first day in the DRAFT window** (i.e., **T0+7**) at the next nightly boundary.
- The plan must guarantee:
  - No LOCKED visit/task is removed or moved due to that change.
  - The first schedule that reflects the change is **≥ 8 days out** (calendar days), unless the system flags it as an exception.

**UI requirement:** The customer must see “This change will start on {EffectiveDate}.”

### 5.3 Task cadence (frequency) math (v1 deterministic)
The planner needs a stable way to decide **which tasks are due on which visit**.

**Preferred approach (stable + simple): cadence based on Service Day occurrences**
For each property:
- Define **occurrence index k** for Service Day visits (k = 0,1,2,3…) starting at subscription activation (or first confirmed service day).
- For each task with cadence **N weeks**:
  - Schedule the task on service occurrences where:

\[
k \equiv offset \pmod{N}
\]

Where:
- **N** ∈ {1,2,4} initially (weekly / biweekly / every 4 weeks), extend later.
- **offset** is captured at subscription start (or derived from last completion) so schedules don’t “jump” when re‑planned.

This yields predictable behavior:
- Weekly tasks always appear.
- Biweekly tasks appear every other Service Day.
- 4‑week tasks appear once per “monthly‑feel” cycle.

**If a task is skipped/cancelled:** keep the offset stable (don’t drift); makeup logic is Sprint 8.

### 5.4 Bundling rule (v1)
For any date where the property has a Visit:
- All due tasks for that property/date are attached to the **same Visit** (one stop).
- If multiple tasks are due, the visit duration estimate is additive (later improved with setup synergy).

**Time estimate (simple v1):**
\[
VisitMinutes = \sum_{task \in visit} TaskMinutes(task)
\]

(If you later add synergy discounts, do it as an adjustment term, not in this sprint.)

### 5.5 Stability rule (anti‑thrash)
Define a “plan difference” score between the prior plan and the new plan for DRAFT days:

- **DateShiftPenalty:** count of tasks moved to a different day
- **CreateDeletePenalty:** count of tasks newly created or removed
- (Provider/time penalties come later once assignment and appointment windows exist.)

Minimize:
\[
Score = w_1 \cdot DateShiftPenalty + w_2 \cdot CreateDeletePenalty
\]

In Sprint 4, it’s enough to implement the intent:
**Do not move DRAFT tasks unless a constraint changed**.

---

## 6) Planner run sequence (nightly job behavior)

### Step A — Gather inputs (read‑only)
- Active subscriptions + routine task configuration per property
- Service Day assignment status per property
- Zone membership for each property (from geo index + zones)
- Current market/zone/category states + any approved pending changes (Sprint 3)
- Existing planned schedule inside the horizon (LOCKED + DRAFT)

### Step B — Apply state changes at the nightly boundary (new decision)
If there are admin‑approved state changes waiting:
- Apply them now (as of this plan run).
- Record in audit trail (already specified in Sprint 3).

### Step C — Build the “target plan skeleton”
For each property:
- Identify which dates in the horizon are that property’s Service Day dates.
- Ensure a Visit exists on those dates (or is created as DRAFT/LOCKED according to window).

### Step D — Populate DRAFT tasks based on cadence + eligibility
For each property’s DRAFT visits:
- Compute which tasks are due by cadence (Section 5.3).
- Filter tasks that are not eligible due to:
  - zone/category state gating (e.g., WAITLIST_ONLY)
  - subscription/routine configuration
- Attach due tasks to the visit (bundling rule).

### Step E — Preserve LOCKED schedule exactly
- Do not remove/move LOCKED visits/tasks except for explicitly flagged exceptions (out of scope in Sprint 4).

### Step F — Write outputs + observability
- Store the updated plan for the horizon.
- Produce a plan run summary:
  - counts of locked visits, draft visits, tasks created/removed
  - number of properties affected by customer change effective dates
  - any constraint conflicts found

---

## 7) UX & user flows (premium + operationally calm)

### 7.1 Customer: routine change flow (effective date clarity)
**Where:** Customer Routine editor (existing) + Upcoming Visits view

**Flow**
1) Customer edits routine (add/remove tasks, change cadence, toggle preferences).
2) Before confirming, show:
   - “Changes take effect on **{EffectiveDate}**.”
   - “Your next 7 days are already scheduled and won’t be changed.”
3) After saving:
   - The routine screen shows a small “Effective {EffectiveDate}” badge.
   - Upcoming Visits shows:
     - LOCKED visits (next 7 days) as **Scheduled**
     - DRAFT visits (days 8–14) as **Planned** (optional but recommended)
4) If the customer tries to “force” a change inside 7 days:
   - Provide a premium‑tone explanation and route to Support / “Request exception” (out of scope for automation).

**UX notes**
- Don’t make customers learn “LOCKED/DRAFT.” Use plain language:
  - “Scheduled” (committed)
  - “Planned” (subject to minor adjustments)

### 7.2 Customer: category not available (state gating)
When a category is WAITLIST_ONLY or CLOSED:
- Customer should not see it as selectable in routine (or it shows “Join waitlist”).
- If a previously selected category becomes unavailable:
  - Existing LOCKED tasks remain (unless ops cancels manually).
  - Future DRAFT tasks are not generated.
  - Customer sees a calm message: “This service is temporarily paused in your area. We’ll notify you when it returns.”

### 7.3 Provider: no new UI required in Sprint 4
Sprint 4 doesn’t assign providers yet; providers should not be exposed to draft routing.
However, providers should experience increased predictability as LOCKED schedules remain stable once Sprint 5/6 land.

### 7.4 Admin: Planner health + “What changed last night”
Add an Admin surface that answers:
- Did the plan run succeed?
- What changed?
- Were any constraints violated?

**Minimum Admin views**
1) **Plan Runs list**
   - timestamp, status, duration
   - high level counts (locked visits, draft visits, deltas)
2) **Plan Run details**
   - changes by zone/category
   - list of “conflicts” (e.g., properties without confirmed service day)
3) **Manual run controls**
   - “Run planner now” (guard‑railed)
   - “Rebuild DRAFT only” option (safer than touching LOCKED)

**UX tone**
- This should feel like an ops cockpit, not a developer console.

---

## 8) Failure modes & guardrails

### 8.1 Properties without confirmed Service Day
If a property doesn’t have a confirmed Service Day:
- Do not generate visits/tasks.
- Surface it in Admin conflicts and trigger the existing Service Day flow.

### 8.2 Partial data / missing cadence anchor
If the system cannot determine a stable cadence offset:
- Default to an offset that preserves consistency (e.g., align to next service day),
- and record a warning for ops review.
(Do not let tasks “jump around” silently.)

### 8.3 Planner idempotency
If the planner runs twice for the same boundary:
- Output should be identical (no duplicate visits/tasks).
- Differences should only occur if inputs changed.

---

## 9) Acceptance criteria (Definition of Done)

### Functional
1) **14‑day plan exists** for active properties with a confirmed Service Day.
2) **7‑day freeze** is enforced: planner does not modify LOCKED.
3) **Nightly promotion:** each run advances windows correctly (day 8 becomes locked; new day 14 is draft).
4) **Customer routine change effective date:** routine edits made today first affect the schedule **≥ 8 days out**.
5) **State changes apply at nightly boundary:** admin‑approved zone/category state changes become effective only at the next plan run and impact DRAFT generation.

### UX
6) Customers see **EffectiveDate** clearly when editing routines.
7) Customers see “Scheduled vs Planned” (or equivalent language) in upcoming visits.
8) Admin can view plan run health and a digest of changes.

### Reliability
9) Planner is safe to re‑run (idempotent behavior).
10) Planner produces a run summary and flags conflicts.

---

## 10) Test scenarios (must pass)

1) **Routine change today**
- Customer removes a task on Monday.
- Verify the next 7 days stay unchanged.
- Verify the task is removed starting the first DRAFT day.

2) **Nightly boundary state change**
- Admin approves zone/category state from OPEN → WAITLIST_ONLY.
- Verify customer catalog gating changes immediately in UI (Sprint 3 behavior),
  but planner only stops generating future tasks at the next nightly run.

3) **Service day missing**
- New subscriber without confirmed service day.
- Planner flags conflict; no visits generated.

4) **Cadence stability**
- Biweekly task appears every other service day consistently across multiple nightly runs.

5) **Idempotency**
- Run planner twice without input changes; output schedule is unchanged.

---

## 11) Out of scope (explicitly not in Sprint 4)
- Provider assignment optimization (Sprint 5)
- Route sequencing / stop order optimization (Sprint 6)
- Home-required appointment windows + “best 3 options” (Sprint 7)
- Weather/no-show disruption replanning (Sprint 8)
- Preference pricing / scarcity pricing (Sprint 8)

---

## 12) Notes for Lovable (implementation freedom, but clear intent)
- Keep planning logic **deterministic** and explainable (ops must trust it).
- Prefer “diff‑based updates” over rebuilding everything nightly; stability matters.
- Treat the nightly boundary as the single source of truth for changes becoming effective.

