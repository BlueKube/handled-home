# Sprint 3 PRD — Market / Zone + Category States Integration (Non-Prescriptive)

## Executive summary
Sprint 3 wires **operational “market states”** at the *(zone, category)* level into the product so the business can scale safely:
- Customers only see / buy what we can reliably fulfill.
- Demand can be captured via waitlists when supply is not ready.
- Providers see clear “opportunity” signals where we are recruiting.
- Admin has a single control surface (a zone-category matrix) with audit trails and guardrails.

This sprint is intentionally **about governance**, not routing optimization. Routing gets smarter later; **Sprint 3 prevents brand damage while you ramp**.

---

## Strategic intent (why this sprint matters)
Handled Home wins by being the “calm, predictable” way to run recurring home services. That breaks instantly if we:
- sell subscriptions in a zone/category where we can’t staff visits,
- overfill capacity and create chronic late arrivals / reschedules,
- or don’t have a clean way to capture demand while recruiting.

Zone/category states are the “circuit breaker” for quality, a “demand capture” tool for growth, and a “provider recruiting” funnel for supply.

---

## Goals
1) **Consistent gating**: use *(zone, category)* states to govern:
   - customer catalog visibility / subscribe eligibility
   - waitlist availability and messaging
   - provider opportunity surfaces
   - admin control UI
2) **Approval-gated recommendations (v1)**:
   - system computes state **recommendations** + reasons
   - admins **approve/reject/snooze** changes
   - full audit log for any change decision
3) **Guardrails**:
   - prevent accidental OPEN when supply is clearly insufficient
   - avoid “state flapping” via hysteresis / minimum time-in-state
4) **Category-level waitlist**:
   - users can join a waitlist per *(zone, category)* with an address.

---

## Non-goals (Sprint 3 explicitly does NOT do)
- Full routing/assignment optimization (later sprint).
- Real-time provider tracking or dynamic re-routing.
- Complex drive-time feasibility modeling (we’ll start with simple proxies; refine later).
- Paid preference pricing experiments (handled in later routing/value sprints).
- Provider payout negotiation logic (separate module).

---

## Key definitions
- **Zone**: an operational service area (computed in Sprint 2).
- **Category**: top-level service family (e.g., mowing, cleaning, handyman).
- **SKU / Service**: specific service task units (already exist).
- **Zone-Category State**: the operating mode for selling and fulfilling a category inside a zone.
- **Recommendation**: system-suggested state change with metrics + reasons (approval-gated in v1).
- **Hysteresis**: different thresholds to enter vs exit a state to prevent daily thrash.

---

## State model (v1)
The system must support these states at minimum:

### 1) CLOSED
**Meaning:** Not offered in this zone (legal/geo constraints or intentionally not launched).  
**Customer:** hidden or “not available”.  
**Provider:** no recruiting signal (unless explicitly desired).  
**Admin:** manual-only state, not recommended automatically unless configured.

### 2) WAITLIST_ONLY
**Meaning:** Capture demand, make **no fulfillment promises**.  
**Customer:** category appears as “Coming soon” with a waitlist CTA.  
**Provider:** optional recruiting prompt (“Demand exists here”).

### 3) PROVIDER_RECRUITING
**Meaning:** We want providers; demand exists or is expected, but supply is not ready for broad selling.  
**Customer:** usually waitlist (or limited browse) with messaging “We’re recruiting pros.”  
**Provider:** strong opportunity surfaces + incentives messaging.

### 4) SOFT_LAUNCH
**Meaning:** Controlled intake; limited new customers per week/day, used for early quality tuning.  
**Customer:** category is purchasable but may require invite, cap, or “limited availability” banner.  
**Provider:** opportunity surfaces remain visible (we’re still building bench depth).

### 5) OPEN
**Meaning:** Normal selling allowed, within healthy utilization buffers.  
**Customer:** normal catalog + subscribe flows.  
**Provider:** normal opportunities based on skills/availability; recruiting not emphasized.

### 6) PROTECT_QUALITY
**Meaning:** Stop new intake and focus on service reliability (automatic circuit breaker).  
**Customer:** existing subscribers continue; new subscribers blocked or waitlisted.  
**Provider:** optional recruiting continues; internal ops focus.

> Note: If you want to keep Sprint 3 lean, you can ship the first 4 (CLOSED, WAITLIST_ONLY, PROVIDER_RECRUITING, OPEN) and add SOFT_LAUNCH + PROTECT_QUALITY behind feature flags. The UI should still anticipate them so you don’t redesign later.

---

## Customer experience requirements

### A) Catalog gating rules (high level)
Given a customer address, determine their zone (from Sprint 2 zone mapping). For each category:

- **OPEN**: show fully, purchasable.
- **SOFT_LAUNCH**: show purchasable, but may display “Limited slots” and enforce caps.
- **PROTECT_QUALITY**: show as “Limited” (existing only) or “Join waitlist”; block new subscriptions.
- **PROVIDER_RECRUITING**: show “Coming soon” with waitlist CTA (default).
- **WAITLIST_ONLY**: show “Coming soon” with waitlist CTA.
- **CLOSED**: hide, or show as “Not available in your area” (product decision; default hide).

### B) Subscribe eligibility (hard block)
At checkout (or before plan purchase), validate:
- *(zone, category)* is in an allowed selling state (OPEN or SOFT_LAUNCH).
- If not allowed, the user is routed to waitlist flow (one-tap “join” + optional info).

### C) Waitlist flow (per zone, category)
**UI goals:** one-screen, minimal friction, premium vibe.

**Suggested UI:**
- Title: “We’re not live here yet”
- 2 lines of reassurance:
  - “We only launch when we can guarantee reliability.”
  - “Join the list and we’ll invite you first.”
- Fields:
  - address (or confirm)
  - email + phone (optional but recommended)
  - preferred frequency (optional)
  - “What’s most important?” quick chips (Reliability, Familiar provider, Lowest price, Earliest launch)
- Submit confirmation:
  - “You’re in. We’ll notify you when [Category] launches in your area.”

**Business strategy reason:** waitlists are demand proof for recruiting, and a warm start for SOFT_LAUNCH.

### D) Customer messaging by state (copy intent)
- WAITLIST_ONLY: “Coming soon — join early access.”
- PROVIDER_RECRUITING: “We’re recruiting pros — join early access.”
- SOFT_LAUNCH: “Limited availability — early access slots.”
- PROTECT_QUALITY: “Temporarily limited to protect service reliability.”

---

## Provider experience requirements

### A) Opportunity surfaces (provider app / portal)
Providers should see:
- A **market heat signal** for nearby zones/categories where we’re recruiting:
  - “High demand” / “Launching soon” badges
  - “Apply to offer [Category] in [Zone]”
- In PROVIDER_RECRUITING:
  - stronger positioning: “Get in early, build recurring route density”
  - optional founding partner incentives (copy only; payouts are separate)

### B) Provider onboarding tie-in
If a provider selects a category that is in PROVIDER_RECRUITING in nearby zones, reinforce:
- “You’re early. We’ll prioritize you when we launch.”
- Encourage completion of onboarding steps that matter for trust: insurance/license upload, background checks, equipment kits.

---

## Admin experience requirements

### A) Zone x Category matrix (core screen)
**Purpose:** single place to see, control, and understand market readiness.

**Table layout:**
- Rows: zones
- Columns: categories
- Each cell shows:
  - Current state (badge)
  - Recommended state (small badge when exists)
  - Small metrics “at a glance” (e.g., Utilization %, ProviderCount, WaitlistCount)

**Interactions:**
- Click a cell → side panel with:
  - current state + last changed by + timestamp
  - recommended state + confidence + reasons
  - metrics snapshot
  - actions: Approve change, Set manually, Reject, Snooze
  - audit log link

**Filtering:**
- by state (show only WAITLIST_ONLY zones)
- by category
- by confidence level
- by “urgent” (recommend PROTECT_QUALITY or capacity risk)

### B) Recommendations inbox (queue)
A dedicated admin page listing recommendations needing attention:
- default sort: urgency + confidence
- bulk actions:
  - approve all in a filtered set (restricted to superuser)
  - snooze all (e.g., 7 days)
- each card shows diff:
  - “SOFT_LAUNCH → OPEN”
  - reasons + metrics

### C) Threshold dials page (admin-configurable)
Admins must be able to edit starter thresholds (with audit log):
- utilization thresholds (enter/exit)
- coverage risk thresholds
- minimum provider count
- soft launch intake cap settings (optional)
- minimum time-in-state (e.g., 7 days) before non-emergency change
- emergency quality trigger thresholds (late rate, reschedule rate) (optional)

> These are “starter defaults,” not truth. The system must be safe even if defaults are imperfect.

### D) Audit log
Any state change decision must record:
- who (admin identity)
- what changed (prev → new)
- when
- why (note + reason codes)
- metrics snapshot at time of decision
- whether it was “approved recommendation” vs “manual override”

---

## Recommendation engine (approval-gated in v1)

### Overview
A nightly job produces recommendations per *(zone, category)* using a small set of metrics and conservative thresholds. Admin approves changes.

### Metrics to compute (per zone, category)
Compute over the next planning horizon window (initially 7–14 days; can be a simple weekly proxy in v1).

1) **DemandMinutes**
Total projected minutes of work required in the zone/category for the horizon.
- v1 proxy: `active_customers_in_zone_category × avg_minutes_per_customer_per_week × (horizon_days / 7)`
- if you have SKU-level planning: sum of task durations for planned visits.

2) **SupplyMinutes**
Total minutes providers can supply for that category in that zone for the horizon.
- v1: sum of `(provider_capacity_minutes_per_week × availability_factor)` for qualified providers associated with the zone/category.

3) **Utilization**
`Utilization = DemandMinutes / max(SupplyMinutes, ε)`
- Use a small epsilon to avoid division by zero.

4) **QualifiedProviderCount**
Count of providers qualified for the category and eligible to serve that zone.

5) **CoverageRisk (v1 proxy)**
A conservative proxy for feasibility. Two acceptable v1 options:
- **Option A (simple):** coverage risk high when QualifiedProviderCount < MinProviders.
- **Option B (better):** for each demand cluster (or sample of customer points), check if any qualified provider’s home base is within an allowed drive radius; compute percent of demand points uncovered.
  - `CoverageRisk = uncovered_points / total_points`
  - If only using minutes: weight points by estimated minutes.

6) **QualityRisk (optional v1)**
Derived from recent service performance in that zone/category:
- `LateRate = late_visits / total_visits`
- `RescheduleRate = reschedules / total_visits`
- `NoShowRate = no_shows / total_visits`
This can be added later; if not available, omit in v1.

### Starter defaults (v1 thresholds)
These are conservative and intended to be editable dials:

- **MinProvidersToOpen** = 2
- **OpenUtilizationEnter** ≤ 0.75
- **OpenUtilizationExit** > 0.80 (hysteresis)
- **ProtectQualityEnter** ≥ 0.85
- **ProtectQualityExit** ≤ 0.75
- **ProviderRecruitingTrigger**:
  - Utilization would exceed 0.95 if opened, OR
  - QualifiedProviderCount < MinProvidersToOpen, OR
  - CoverageRisk > 0.20
- **WaitlistOnlyTrigger**:
  - SupplyMinutes ≈ 0, OR
  - CoverageRisk > 0.40

### State recommendation logic (deterministic, explainable)
For each *(zone, category)*:

1) If manually locked CLOSED → recommend nothing (unless admin enables “recommend reopen”).
2) If `SupplyMinutes` is near zero OR `QualifiedProviderCount == 0`:
   - Recommend WAITLIST_ONLY
   - Reasons: “No qualified supply”
3) Else if `CoverageRisk > 0.40`:
   - Recommend WAITLIST_ONLY
   - Reasons: “Coverage risk high”
4) Else if `QualityRisk` triggers (if enabled) OR `Utilization >= ProtectQualityEnter`:
   - Recommend PROTECT_QUALITY
   - Reasons: “Utilization high” (+ quality KPI if applicable)
5) Else if `QualifiedProviderCount < MinProvidersToOpen` OR `CoverageRisk > 0.20` OR `Utilization > 0.95`:
   - Recommend PROVIDER_RECRUITING (or SOFT_LAUNCH if you prefer controlled intake)
   - Reasons: “Insufficient bench depth”
6) Else if `Utilization between 0.75 and 0.95`:
   - Recommend SOFT_LAUNCH
   - Reasons: “Near capacity — controlled intake”
7) Else:
   - Recommend OPEN
   - Reasons: “Healthy buffer”

### Confidence scoring (simple but useful)
Confidence is an output used for admin prioritization, not a model claim:
- **High**: metrics are stable and far from thresholds (e.g., Utilization ≤ 0.60, provider count well above minimum)
- **Medium**: near thresholds (within ±10%), or coverage proxy is simple
- **Low**: sparse data (very few customers or providers), or conflicting signals

### Hysteresis & anti-flap rules (required)
- Use enter/exit thresholds for OPEN and PROTECT_QUALITY.
- Add **MinimumTimeInState** (default 7 days) before moving between growth states (WAITLIST/RECRUITING/SOFT_LAUNCH/OPEN), unless emergency quality triggers fire.
- Recommendations should only be created when:
  - the recommended state differs from current state **and**
  - the difference passes hysteresis rules.

### Approval gating (v1)
- Recommendations never change the live state automatically.
- Admin action:
  - Approve → apply immediately OR schedule at next planning boundary (product choice; see below)
  - Reject → store rejection + reason; optionally suppress similar recommendations for N days
  - Snooze → do not re-surface until snooze expires (still recompute internally)

---

## Timing: when a state change takes effect
Sprint 3 must support a clear rule:

### Option 1 (simpler): Immediate effect
- As soon as approved, gating changes apply to catalog/checkout.

### Option 2 (more predictable): Effective at planning boundary
- Approved change becomes “effective” at the next nightly plan run (recommended if you want strict predictability).
- Still blocks new purchases immediately if moving to PROTECT_QUALITY.

**Recommendation:** Use Option 1 for CLOSED/WAITLIST/RECRUITING/OPEN gating (it’s about selling), but treat PROTECT_QUALITY as immediate when approved (brand protection).

---

## Edge cases & guardrails
1) **Existing subscribers in a category that becomes non-OPEN**
- They keep service; only new subscriptions are blocked.
- Admin can optionally force a “pause new intake only” mode.

2) **Manual override**
- Superuser can set any state with a required reason note.
- System should still show “This violates recommended guardrails” warning if thresholds indicate risk.

3) **Category partially available**
- If a category has multiple SKUs, gating is by category in Sprint 3.
- Later you can add SKU-level states; not required now.

4) **Zone mapping uncertainty**
- If an address cannot be mapped to a zone, default to WAITLIST or “not available” to avoid overpromising.

---

## Analytics & reporting (minimal but necessary)
Track events for learning and later automation:
- recommendation_created (zone, category, from_state, to_state, confidence, reasons, metrics snapshot)
- recommendation_approved / rejected / snoozed (admin, note)
- state_changed (effective timestamp, source: approved/manual/auto in future)
- waitlist_joined (zone, category, address hash, contact method)
- subscribe_blocked_by_state (zone, category, attempted_state)

Admin dashboard widgets (optional but helpful):
- Waitlist counts by zone/category
- Provider count by zone/category
- State distribution (how many OPEN vs RECRUITING etc.)
- “Quality protection” activations over time

---

## Acceptance criteria (Sprint 3 is done when…)
1) **Customer gating works**
- A customer cannot subscribe in a zone/category unless the state allows it.
- When blocked, the UI offers a waitlist path that successfully records interest.

2) **Provider opportunity surfaces respond to state**
- PROVIDER_RECRUITING zones/categories are discoverable to providers and have clear copy.

3) **Admin matrix exists**
- Admin can view current state for every zone/category and change it (with required reason + audit).

4) **Recommendations + approval gating exist**
- System generates recommendations with reasons and confidence.
- Admin can approve/reject/snooze.
- Approved changes apply according to the chosen effective-timing rule.
- All decisions are audit logged.

5) **Guardrails reduce flapping**
- Hysteresis is present for OPEN/protect transitions.
- Minimum time-in-state prevents daily churn between growth states.

---

## QA / test scenarios (high-signal)
1) Category = WAITLIST_ONLY → customer sees “Coming soon” and can join waitlist; checkout is blocked.
2) Category transitions WAITLIST_ONLY → OPEN (approved) → customer can subscribe immediately.
3) Category transitions OPEN → PROTECT_QUALITY (approved) → new subscribe blocked; existing subscribers unaffected.
4) Provider sees recruiting signal when state = PROVIDER_RECRUITING.
5) Recommendations appear only when crossing hysteresis boundaries; snoozed recommendations do not reappear until expiry.

---

## Rollout plan (recommended)
- Start with one pilot market + 1–2 categories.
- Run recommendations in “shadow mode” for a week (compute + show, do not approve) to calibrate.
- Then enable approvals by superuser only.
- After 4–8 weeks of stable ops metrics, enable AUTO_CHANGE for low-risk transitions (e.g., SOFT_LAUNCH ↔ OPEN) while keeping PROTECT_QUALITY approval-gated.

---

## Open questions (for next iteration)
- Do we want CLOSED to be fully hidden or visible as “Not in your area”? answer: visible
- Should SOFT_LAUNCH require invite codes, caps only, or both? answer: do your recommendation
- What’s the initial allowed drive footprint for CoverageRisk Option B (minutes vs miles)? answer: do your recommendation
- Should provider recruiting incentives be displayed in-app or handled externally at first? answer: in-app
