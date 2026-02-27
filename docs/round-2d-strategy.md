# Round 2D — Customer Experience Polish & Retention (Strategy)

> Strategic decisions document. See tasks.md for implementation plan.

---

## 1) Packaging & Pricing Strategy

### 1.1 Default model: Membership-first (tiered subscription)
Primary onboarding path is **membership-first** with simple tiers (e.g., Essential / Plus / Premium).
Aligns with density flywheel, reduces price comparison, supports habit formation.

### 1.2 Handles/Credits: use "handles" under the hood, keep surface simple
**Handles** are the internal unit of value and scheduling fairness. Customer-facing UX stays simple:
- Always show handles with a simple usage bar: **Used / Remaining**
- When a task is selected: "Costs 3 handles" (optionally "≈ $49 value")
- Avoid complex conversions or "points-style" confusion

### 1.3 A-la-carte: allowed, but positioned as add-ons
Offer a-la-carte as add-ons, not as the primary mental model.
Use cases: seasonal services, one-off "desperation" moments, prep for events.

---

## 2) Add-ons Strategy: "Relief Buttons" (contextual, not a store)

### 2.1 Moment-based, surfaced contextually
Don't present a huge menu. Surface 3–6 relevant add-ons based on seasonality and customer signals.
Examples: "Company coming" → quick reset, seasonal: holiday prep, spring refresh.

### 2.2 Priced in $ and in handles (for members)
Members can pay either $ price or handles (if sufficient balance).
**Gate:** Add-ons only surfaced after first completed visit (or user-initiated browse), to avoid early upsell spam.

---

## 3) "Home Assistant" (Micro-Task Category)

### 3.1 Positioning: scheduled help, not instant dispatch
"Book as soon as tomorrow (or within 2–3 days depending on your area)."
Clear time-boxed sessions: 30 / 60 / 90 minutes. Clear boundaries and prep rules.

### 3.2 Scope: inside-the-home tasks only (v1)
Lower liability, more repeatable, proofable work.
Excluded (v1): shopping/purchases, errands involving driving, handling valuables/paperwork.

### 3.3 Provider model: separate provider category
Different economics, schedule pattern, and trust profile. Higher in-home trust requirements.

### 3.4 SKU design: time-boxed with tight boundaries
Every Home Assistant SKU: time box (30/60/90), allowed actions checklist, not-included list, customer prep requirements, privacy-safe proof rules.

Starter SKUs: Kitchen Reset, Laundry Folding Sprint, Quick Tidy Sprint, Post-Party Reset, Bed + Bath Reset.

### 3.5 Availability: members-only first

---

## 4) Referrals: reward with handles (not discounts)
Two-sided referral rewards using handles. Award only after first paid invoice clears.
Monthly cap + duplicate address/device checks.
Optional future: "Neighbor boosts" (3 neighbors join → everyone gets bonus handles).
**Implementation deferred to Round 2F.**

---

## 5) Scheduling Strategy: Density-first, customer constraints respected

### 5.1 Density is provider-side, not customer-side
Service Day density = clustering many homes for a provider org. Multiple provider categories may serve one customer on different days.

### 5.2 Scheduling rule hierarchy
1. Hard constraints (must-be-home windows, access constraints, provider category constraints)
2. Operational optimization (best density/service day per provider org, route optimization)
3. Customer preference (soft: "prefer same day", "prefer mornings/afternoons")

### 5.3 Customer-facing UX
App proposes "best plan" with efficiency framing. If customer wants alignment: "Try to align days" toggle with tradeoff messaging. When alignment isn't possible, show one-sentence explanation.

### 5.4 "Must be home" toggle
Explicit toggle per visit or per category, off by default. When enabled: shows available windows, may increase handle cost or reduce availability.

---

## 6) Handles Policy Details

### Spending
- Handles are spent at booking/confirmation time (not at service completion)
- Each SKU has a `handle_cost` (integer)

### Refunds
- System/provider cancellations refund handles preserving original expiry date
- Customer-initiated cancellations: refund only if >24h before scheduled service

### Rollover
- Unused handles roll over with a cap (e.g., 1.5x monthly allocation)
- Handles above rollover cap expire at cycle end

### Plan changes
- Changes take effect next billing cycle by default
- Downgrades always next-cycle
- "Upgrade now" is a future P2 enhancement
- Handles balance carries over (no proration)

---

## Open Decisions (not blocking implementation)
1. Naming: "Handles" vs "Credits" vs "Assist Points" (cosmetic, one constant change)
2. Tier sizing: handles_per_cycle per tier and target attach rate
3. Home Assistant trust tier requirements and vetting
4. Whether "align days" costs extra handles

*Last updated: 2026-02-27*
