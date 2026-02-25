# Round 2B — Automation Engine (Expanded Spec + Decisions)

This document expands **Round 2B** (Automation Engine) into a build-ready, Lovable-friendly spec. It also includes the latest strategic decisions about **provider structure**, **territory**, and **competition model** so the implementation aligns with an Uber-scale business model (but optimized for recurring logistics + density).

---

## Round 2B Decisions (Source of Truth)

### D1) Provider structure: **Primary + Backup** (franchise-style), not open competition
**Decision:** Start with a **Primary Provider Org** per **zone + category** (default), with a **Backup Pool** (1–3 orgs) to handle overflow, no-shows, and quality dips.

**Why:** Density is the business model. Splitting a micro-zone across many competing providers destroys route efficiency, increases drive time, and makes quality inconsistent. A franchise-like structure creates predictable income for providers and predictable service for customers.

**Implementation implications:**
- Assignment engine defaults to Primary.
- Backup pool activates automatically for:
  - capacity overflow
  - no-show / late-start risk
  - weather-mode congestion
  - repeated SLA failures
- “Competition” is a **configuration slider**, not a separate system (see D3).

---

### D2) Positioning: **Exclusive territory that is earned**
**Decision:** Provider relationship should feel like **exclusive territory / franchise rights**, not “open gig competition.”

**Provider-facing language ideas (pick one later):**
- “Founding Partner Territory”
- “Primary Provider Rights”
- “Protected Route”

**Guardrails (must exist):**
- Exclusivity is **revocable** based on measurable SLA performance.
- The system auto-throttles assignments and increases overflow share when performance drops.
- Replacement of a Primary is a defined process, not ad hoc.

---

### D3) Competition model as a maturity slider (future-proof)
**Decision:** Treat “multi-provider competition” as a staged capability, not day-one complexity.

**Levels:**
1. **Level 1 — Primary only**
2. **Level 2 — Primary + Backup/Overflow** ✅ (Round 2B target)
3. **Level 3 — Balanced Multi-Provider within zone** (only when density supports it)
4. **Level 4 — Full marketplace** (bidding, surge, dynamic pricing, etc.)

**Rule:** Do not move beyond Level 2 until a zone’s density reliably supports it without harming service quality.

---

### D4) Default exclusivity scope: **Per zone + category**
**Decision (default):** Exclusivity should be granted **per category within a zone** (e.g., mowing may have a different primary than cleaning), because categories require different skills, equipment, and staffing.

**Implementation implications:**
- Provider org capabilities are category-specific.
- Zone health state can be category-specific.
- Capacity, SLA, and scheduling may differ per category.

---

## Design principles for Round 2B
- **Automation is the default; humans are the exception.** Every manual action must (a) be rare, (b) be logged, and (c) create data the system uses to avoid that exception next time.
- **Explainability is a product feature.** When something is auto-assigned, rescheduled, held, or paused, users must see *why* in one sentence.
- **Quality and trust > raw growth.** The system should automatically throttle growth (and even close zones) to protect customer retention.
- **No silent failures.** Every automation must have: audit log, retry strategy, alerting thresholds, and safe fallback state.

---

## Job Assignment & Routing

### **2B-01 — Auto-assign jobs to providers (P0 | XL)**
**Objective:** Automatically assign every job to the best provider org with near-zero admin involvement, while preserving fairness, SLA reliability, and unit economics.

**Core inputs:**
- Job: zone, category/SKU, location (geohash), scheduled window, required certifications, expected duration.
- Provider org: coverage zones, SKU capabilities, capacity by day, current load, reliability score, last-assigned timestamps, “home base” (optional), tier (Bronze/Silver/Gold/Platinum).
- System: zone health state (OPEN / PROTECT_QUALITY / WAITLIST), max drive-time per day target, minimum SLA thresholds.
- **Provider model:** Primary + Backup Pool per zone+category (Round 2B decision D1/D4).

**Matching logic (suggested scoring model):**
- **Eligibility gate (hard fail):**
  - Provider must cover zone
  - Provider must be authorized for category/SKU (and certified if required)
  - Provider must have available capacity for that service day/time
  - Provider must not be restricted/suspended
- **Ranking score (soft):**
  - Distance score (home base or last stop → job)
  - Current route density (more clustered = better)
  - Provider reliability score (on-time %, redo rate, photo compliance)
  - Fairness/rotation (avoid starving newer providers, but don’t harm quality)
  - Load balancing (avoid overloading one org)
  - Customer-proximity preference (optional: repeat provider bias if customer loves them)

**Primary + Backup assignment behavior (Decision D1):**
- Default assignment goes to **Primary** if eligible.
- If Primary fails eligibility or falls below thresholds, system automatically uses Backup Pool ranked by score.
- Backup providers can be designated “overflow-only” or “full eligible” per zone+category.

**Assignment timing:**
- Triggered when:
  - Service Day locks / routine becomes effective
  - New customer subscribes
  - Reschedule creates new instances
  - Provider drops/declines/unavailable event

**User experience requirements:**
- Provider sees:
  - “Assigned” jobs appear instantly with “why” chips: `Near your route`, `You’re top-rated`, `You have capacity`, `Overflow assist`
- Customer sees:
  - “Your pro is scheduled” (not necessarily named yet) + confidence messaging:
    - “We’ve assigned a vetted local pro for your Service Day”
- Admin sees:
  - Assignment log, reasons, override controls, and “primary health” indicators.

**Admin controls (rare but necessary):**
- “Lock provider for this customer” (VIP or special needs)
- “Exclude provider from this customer” (bad fit)
- “Override assignment” (requires reason)
- “Set Primary / Backup Pool for zone+category”

**Safety & anti-gaming:**
- Photo compliance validated
- Issue rate comes from customer receipts + disputes
- Decline patterns reduce assignment probability (anti-cherry-picking)
- Performance dips automatically shift share to backups (soft pressure)

**KPIs / success metrics:**
- % jobs auto-assigned without admin intervention (target: >98%)
- Provider utilization (time working vs driving)
- On-time completion rate
- Customer satisfaction / issue rate

**Acceptance criteria:**
- 100% of eligible jobs assigned within X minutes of trigger
- Assignments are deterministic (same inputs → same result) unless fairness rotation intentionally changes it
- Every assignment has an audit entry: `job_id, provider_org_id, score breakdown, reason`

---

### **2B-02 — Route optimization (P1 | XL)**
**Objective:** Minimize provider drive time and maximize stops/day while keeping predictable windows and respecting constraints.

**Routing constraints:**
- Jobs must stay within the assigned service day window(s)
- Some SKUs may require ordering constraints (e.g., “waste pickup before lawn mow”)
- Max drive-time per route threshold (e.g., don’t exceed 45 min total drive)
- “Hard appointments” (if ever introduced) must be fixed in place

**Approach (start simple, scale later):**
- **MVP:** Sort by geohash proximity + nearest neighbor heuristic from home base
- **V2:** Add estimated duration + traffic + time windows
- **V3:** Full optimization (VRP) only when density is high enough to justify complexity

**UX requirements:**
- Provider sees:
  - A daily route list with an optional map view
  - “Start route” CTA that creates the day plan
  - Suggested next stop with ability to reorder
- Customer sees:
  - Only coarse ETA windows (avoid promising precise arrival unless you can deliver)

**Safety:**
- Re-optimization should not cause whiplash:
  - Don’t reorder after provider starts unless necessary
- Log route changes and why they occurred

**KPIs:**
- Avg drive minutes per job
- Stops/day
- Route stability (how often it changes after starting)

**Acceptance criteria:**
- Provider daily jobs ordered automatically
- Manual reorder allowed (tracked + used for learning)
- Route plan persists for the day once “started”

---

### **2B-03 — Overflow handling (P1 | L)**
**Objective:** When capacity is exceeded, the system resolves it automatically without harming customer trust.

**Overflow scenarios:**
- Too many jobs for a service day in a zone/category
- Primary provider capacity drop (sick, equipment failure)
- Weather reschedules pile up

**Resolution ladder (automatic):**
1) Rebalance within Primary if possible
2) Pull from **Backup Pool** (pre-approved)
3) Offer customer an alternate day (with a benefit)
4) If none possible: auto-flag for admin intervention (rare)

**Customer UX:**
- Provide confident message + options:
  - “We’re moving your service to the next best day due to high demand. Choose: Tue or Wed.”
  - Optional goodwill credit if you want to reinforce trust

**Provider UX:**
- Backup providers see “Overflow opportunity” (opt-in or auto-assigned depending on policy)

**Admin UX:**
- Overflow dashboard: zone/category, reason, proposed fix, one-tap approve/override

**Acceptance criteria:**
- Overflow jobs never sit unassigned silently
- Customers receive a clear next step within minutes

---

### **2B-04 — Provider no-show detection + auto-reassign (P1 | M)**
**Objective:** Detect and resolve no-shows early enough that customers still feel taken care of.

**Signals for “no-show risk”:**
- Job not started by “latest start” threshold
- Provider not “en route” by a cutoff
- Provider has repeated late starts recently

**Automation actions:**
- Step 1: Ping provider (“Confirm you’re on track”)
- Step 2: If no response within X minutes → reassign to Backup Pool
- Step 3: Customer notified with calm framing:
  - “We’re sending a different pro to keep your Service Day on track.”

**Provider consequences:**
- Reliability score hit
- Temporary assignment throttling if repeated

**Acceptance criteria:**
- No-show jobs trigger automated intervention without admin
- Every action creates audit log and provider health update

---

## Quality Enforcement

### **2B-05 — SLA enforcement automation (P0 | L)**
**Objective:** Keep quality high with automated thresholds that coach, warn, restrict, and ultimately protect customers.

**SLA metrics (minimum set):**
- On-time arrival %
- Completion success rate
- Photo compliance rate
- Issue rate per 100 jobs
- Redo rate
- Proof integrity (no missing required shots)

**Threshold ladder (example):**
- **Green:** normal assignment eligibility
- **Yellow:** warning + coaching checklist
- **Orange:** restricted new assignments + mandatory training refresh
- **Red:** suspension pending review + replacement candidate search

**Provider UX:**
- Clear “Performance status” page:
  - “You’re Yellow because photo compliance dropped to 82%”
  - “Fix this by completing 10 compliant jobs this week”
- Make it feel like a game they can win, not a punishment

**Admin UX:**
- Auto-generated weekly provider report
- “Exceptions only” queue: only the worst 1–2% should require humans

**Acceptance criteria:**
- SLA health updates automatically (daily or weekly)
- Enforcement actions are automated and logged
- Providers receive actionable instructions

---

### **2B-06 — Auto-flag low-quality providers (P1 | L)**
**Objective:** Prevent repeated bad customer experiences by automatically reducing exposure to low performers.

**Rules:**
- If provider is below threshold for 2+ weeks (or X jobs), trigger:
  - assignment throttle OR
  - restrict to simpler SKUs OR
  - move to overflow-only status
- If Primary is underperforming: gradually shift % of assignments to backups, then replace Primary if sustained.

**Customer protection:**
- Do not assign “Red” providers to new customers
- Optional: repeat-customer exception only if that customer rates them highly

**Acceptance criteria:**
- Low-quality providers stop receiving fresh demand automatically
- System stabilizes without admin babysitting

---

### **2B-07 — Photo quality validation (P1 | M)**
**Objective:** Ensure proof photos are usable and trustworthy with lightweight validation.

**MVP validation checks:**
- Not blurry (basic sharpness score)
- Not too dark / too bright
- Not identical to previous photo (hash similarity)
- Correct orientation / aspect ratio
- Minimum number of required photos per SKU

**Escalation:**
- If fails: ask provider to retake before completion
- If repeated failures: affects SLA photo compliance

**Acceptance criteria:**
- Provider cannot submit junk proof undetected
- Validation is fast enough to not annoy providers

---

## Billing Automation

### **2B-08 — Automated dunning sequence (P0 | L)**
**Objective:** Recover failed payments automatically while preserving goodwill and preventing service abuse.

**Dunning timeline (example):**
- Day 1: retry + notification/email
- Day 3: retry + “Fix payment method” CTA
- Day 7: retry + warning about pausing service
- Day 10: pause service scheduling (no new obligations)
- Day 14: cancel subscription (with reactivation path)

**UX requirements:**
- Banner: “Action needed: update payment to keep Service Day active”
- One-tap fix flow
- Calm messaging: “We couldn’t process your payment. Update your card to keep things running smoothly.”

**System rules:**
- Don’t surprise-cancel without multiple warnings
- Don’t generate new jobs if account is paused
- Preserve receipts/history even if canceled

**Acceptance criteria:**
- Dunning runs automatically
- Every step produces event log + message record + subscription state update

---

### **2B-09 — Auto-apply earned referral credits (P1 | M)**
**Objective:** Make referral value feel instant and effortless.

**Rules:**
- Credits automatically apply to next invoice
- Caps + expiration enforced
- Credits never create negative invoices unless explicitly allowed

**Acceptance criteria:**
- Credits apply without customer contacting support
- Clear ledger-style explanation of where the credit went

---

### **2B-10 — Auto-release provider earning holds (P1 | M)**
**Objective:** Remove admin work and improve provider trust by automatically releasing holds.

**Hold reasons (examples):**
- New provider probation
- Dispute open
- Photo compliance issues
- Chargeback risk window

**Rules:**
- Holds include `hold_until` and/or `hold_reason`
- Scheduled job releases holds nightly
- Disputes can reapply holds automatically

**Provider UX:**
- “Your payout is held until X because Y”
- Countdown + what to do to avoid future holds

**Acceptance criteria:**
- Holds release automatically at the right time
- Holds never silently persist beyond `hold_until`

---

## Weather & Scheduling

### **2B-11 — Weather mode (admin-triggered) (P0 | L)**
**Objective:** Handle storms/heat/wind events gracefully and automatically to preserve trust.

**Admin triggers:**
- Toggle weather mode for a zone + category + date range
- Choose strategy:
  - Shift all to next available day
  - Skip this week + credit
  - Customer chooses alternate day

**System behavior:**
- Recompute service day instances safely
- Avoid capacity explosions: use overflow handling
- Send customer comms immediately
- Providers get updated route plans

**Customer UX:**
- “Weather adjustment” card with clear new plan + options (if any)

**Acceptance criteria:**
- Admin can resolve a weather week in < 5 minutes
- Customers never wonder what’s happening

---

### **2B-12 — Auto-weather detection (P1 | L)**
**Objective:** Reduce admin involvement by auto-detecting severe weather and recommending or triggering weather mode.

**Approach:**
- Integrate a weather API
- Monitor forecasts per zone geofence
- Trigger levels:
  - Advisory → recommend to admin
  - Severe → auto-trigger with admin override window

**Safeguards:**
- Don’t reschedule on low-confidence forecasts
- Support manual reversal if forecast changes

**Acceptance criteria:**
- System identifies zones at risk 24–72 hours ahead
- Admin receives clear recommended action

---

### **2B-13 — Holiday calendar (P1 | M)**
**Objective:** Stop service disruptions and support tickets caused by holidays.

**Features:**
- Zone-level holiday rules
- Default major holidays pre-seeded
- Auto-shift logic (earlier vs later) while avoiding job stacking

**Acceptance criteria:**
- No jobs scheduled on blocked holidays
- Preview timeline always matches reality

---

## Zone Expansion

### **2B-14 — Capacity-based zone expansion triggers (P1 | L)**
**Objective:** Grow deliberately where unit economics will be strong and quality can be maintained.

**Signals:**
- Capacity utilization >80% sustained
- Rising waitlist in adjacent ZIPs
- Provider drive-time creeping up
- Support tickets rising (warning sign)

**Automation behavior:**
- System produces an “Expansion suggestion” packet:
  - Proposed zone boundaries
  - Expected jobs/week
  - Provider coverage gap
  - Recommended action: split zone / recruit provider / raise price / protect quality

**Acceptance criteria:**
- Recommendations are explainable + backed by metrics
- Admin gets actions, not vanity charts

---

### **2B-15 — Waitlist system (P1 | M)**
**Objective:** Turn “not available” into a demand asset and early growth engine.

**Customer UX:**
- “We’re not in your neighborhood yet. Join the waitlist.”
- Show proximity: “Next area over is active.”
- Optional: referral boost to launch faster

**Admin UX:**
- Waitlist dashboard by ZIP/zone
- Funnel tracking: waitlist → launch notified → subscribed

**Acceptance criteria:**
- Waitlist signup < 15 seconds
- Auto-notify at launch
- Waitlist data feeds expansion triggers

---

### **2B-16 — Auto-zone creation (draft) (P2 | L)**
**Objective:** Reduce friction to launch new zones while keeping humans in the loop for safety.

**Automation behavior:**
- When waitlist hits threshold AND provider availability exists:
  - Create a new zone in DRAFT
  - Pre-fill boundaries, capacity settings, available categories, recommended service days
- Admin reviews:
  - Approve → SOFT_OPEN → OPEN
  - Reject → keep accumulating data

**Safeguards:**
- Draft zones never go live without approval
- Must pass readiness checklist:
  - provider coverage confirmed
  - operational capacity confirmed
  - pricing sanity check

**Acceptance criteria:**
- New zone creation goes from hours to minutes
- Launches happen with fewer mistakes

---

## Cross-cutting requirement for ALL Round 2B automations
Every automation must implement:
- **Audit log entry** (who/what/why)
- **Retry strategy + idempotency**
- **Safe fallback state**
- **User-facing explanation string**
- **Admin override with reason**

---

## Implementation note for Lovable
Round 2B is designed to be built incrementally:
- **Ship Level 2 (Primary + Backup) first**, then upgrade the slider only after density and quality are proven.
- Avoid premature complexity (full marketplace routing/competition) until unit economics demand it.
