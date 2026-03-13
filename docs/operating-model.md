# Handled Home — Operating Model & Unit Economics

This document defines how Handled Home makes money, prices services, pays providers, and designs plans. It is the tactical companion to `masterplan.md` — the masterplan says *why we exist*, this document says *how we sustain the business*.

Developers building pricing, plan selection, payout, admin, or bundle-related features should reference this document directly.

---

## The Core Margin Philosophy

**Handled Home wins by making the whole household profitable over time, not by squeezing maximum margin out of each individual job on day one.**

The unit of value is the **household**, not the individual service. A single lawn mow or window-cleaning job is not where the business makes its money. The business makes money from:

- recurring subscription revenue across a growing basket of services
- attach rate expanding over time as customers add more to their plan
- route density improving provider cost-per-stop
- reduced admin and selling burden lowering provider churn
- packaging low-frequency services into high-perceived-value plans
- retaining households long enough for the economics to compound

Profitability should be measured at the **household contribution margin** level — total plan revenue minus total provider payout minus support/ops cost minus payment/platform overhead — not at the individual SKU level.

---

## Revenue Engine: Subscription Spread

Handled Home monetizes through the **subscription spread** — the delta between what customers pay for their plan and what providers are paid per job.

### How it works

- Customers pay a fixed monthly subscription for a plan (e.g., $159/mo)
- Providers receive a fixed, predictable payout per job — set independently from customer pricing
- Neither side sees the other's pricing — the **handles abstraction layer** hides the spread
- Zone-based multipliers allow margin optimization per market without changing the customer or provider experience

### Why this model wins

1. **Margin is invisible.** Unlike a take-rate model where "platform takes 20%" is visible and resented, the plan abstraction obscures unit economics. Customers think about their plan level, not per-service cost breakdowns. Same psychology as Costco memberships.

2. **Density compounds margin.** As customers stack in zones, provider cost-per-stop drops (less drive time, more stops/day). Customer pricing stays the same. Margin widens automatically — without raising prices or cutting provider pay.

3. **Bundle expansion multiplies without friction.** When a customer adds pest to their lawn plan, incremental acquisition cost is ~$0. The 2nd, 3rd, 4th service margin is nearly pure profit after provider payout.

4. **Provider pay stays stable.** Flat, predictable payout per job. No surprises, no tip dependency. Provider retention improves, which improves density, which improves margin.

### Profit progression

| Phase | Density | Margin Profile |
|-------|---------|----------------|
| **Launch** | Sparse, seeding | Thin margins, possible subsidy. BYOC bonuses and launch incentives eat margin. Goal: density, not profit. |
| **Density** | 15–25 customers/zone | Provider cost/stop drops 15–20%. Customer price unchanged → margin widens. Attach rate grows → revenue per household rises. |
| **Scale** | 50+ customers/zone | Maximally dense routes. Gross margins hit 30–40%. Premium tier and seasonal add-ons are high-margin gravy. |

### Revenue streams (priority order)

1. **Subscription spread** — primary margin engine (plan price minus blended provider payout cost)
2. **Bundle expansion** — near-zero incremental CAC per added service; margin grows with attach rate
3. **Tier upgrades** — Plus and Premium tiers have higher absolute margins
4. **Add-on handles** — one-time seasonal/add-on purchases at immediate charge
5. **Zone pricing multipliers** — high-cost markets command higher customer prices with independent provider payouts

---

## Bundle Design: The Margin Lever

This is one of the most important economic concepts in the business.

A plan can include:
- **anchor services** that happen often and create recurring habit
- **low-frequency services** that sound valuable but don't hit cost every month
- **high-margin add-ons** that feel like natural extensions
- **route-efficient services** that stack well with existing stops

The result: the plan feels like *"Wow, this includes a lot"* without forcing expensive monthly fulfillment on every line item.

### Low-frequency, high-perceived-value items

These items increase the perceived completeness and value of a plan without creating monthly labor cost:

| Service | Typical frequency | Why it works |
|---------|-------------------|--------------|
| Gutter cleaning | 1–2× / year | Sounds important, infrequent cost |
| Dryer vent cleaning | 1× / year | Safety-adjacent, memorable |
| Water heater inspection/flush | 1× / year | Preventive, feels responsible |
| Irrigation tune-up | 1–2× / year | Seasonal, easy to forget |
| HVAC coordination/check reminders | 2× / year | High perceived value |
| Exterior window cleaning | 2× / year | Visible improvement |
| Pressure washing | 1× / year | Dramatic result, low frequency |

### Bundle design principles

1. **Anchor with a recurring service** — lawn, pest, or pool creates the habit and the relationship.
2. **Layer in low-frequency items** — they make the plan feel complete without monthly cost pressure.
3. **Frame plans by outcome, not line items** — the customer buys "managed home maintenance," not a checklist.
4. **Design for perceived value at the plan level** — each tier should feel like it obviously includes more, even if the marginal fulfillment cost is small.
5. **Reserve the highest-frequency, highest-cost items for higher tiers** — this creates natural upgrade pressure.

---

## Plan Tier Structure

Plans should feel **outcome-based**, not line-item-based. The customer is buying a level of coverage, not counting individual services.

### Essential

Core recurring maintenance for the most common needs.

Typical inclusions:
- 1 anchor recurring service (e.g., lawn or pest)
- plan management and reminders
- 1–2 low-frequency annual or semiannual services
- proof-of-work receipts for all visits

Positioning: *"The basics, handled."*

### Plus

Broader recurring care for busy households.

Typical inclusions:
- 2 anchor recurring services
- more preventive/seasonal items
- stronger annual/semiannual inclusions
- easier bundled add-ons at plan pricing

Positioning: *"More covered, less to think about."*

### Premium

A more complete "take it off my plate" plan.

Typical inclusions:
- multiple recurring services
- more annual/semiannual items
- higher-touch coordination
- priority scheduling/support
- the fullest feeling of "everything handled"

Positioning: *"Your home, fully handled."*

### Tier design principle

The smart part is that higher tiers can include many things that feel important without every item creating proportionally higher monthly labor cost. The perceived jump in value should exceed the actual jump in fulfillment cost.

---

## Loss Leader Strategy

Some services can be used as loss leaders or near-break-even entry services if they reliably create downstream profit.

### What makes a good loss leader

A service qualifies as a loss leader when it:
- is easy for the customer to say yes to
- happens regularly enough to create habit and app engagement
- gives Handled Home permission to manage more of the home
- leads to profitable add-ons later
- helps build density in a zone

### Possible loss leader candidates

- Basic lawn mowing (low barrier, high frequency)
- Entry-tier pest service (recurring, easy to standardize)
- Introductory exterior window cleaning (visible result)
- Initial home setup / first bundled maintenance visit (onboarding hook)

### The rule

**Only keep a loss leader if it improves acquisition, retention, attach rate, density, or downstream contribution margin.**

If a loss-leader service stays unprofitable and does not unlock bigger household value later, it should not remain a core offer. Review loss leaders quarterly against household-level contribution margin data.

---

## Pricing & Negotiation Policy

### Default: standardized pricing

Handled Home sets payout by **SKU + Level + zone**. Providers choose to accept or not.

No constant one-off negotiation. Standardized pricing is the default because it enables:
- cleaner margins and easier forecasting
- faster provider onboarding
- fewer special cases in billing/payout systems
- apples-to-apples provider comparison
- simpler admin operations

### When exceptions are allowed

Exceptions can make sense for:

| Scenario | Rationale |
|----------|-----------|
| **BYOC providers** bringing existing customers | They are seeding demand and density; transition-friendly terms are justified |
| **BYOP situations** where keeping a trusted incumbent wins the household | Preserving the relationship at similar pricing reduces switching friction |
| **Hard-to-fill zones** | Supply scarcity may require temporary payout premiums |
| **Specialty services** not yet standardized | Pilot pricing until volume justifies standardization |
| **Temporary launch pilots** | Time-limited incentives to prove a new market |

### Exception rules

All pricing exceptions must be:
- **Documented** — recorded in admin with reason code and expiration
- **Strategic** — tied to a clear acquisition, density, or retention goal
- **Limited** — time-bound or volume-bound, not permanent
- **Not the default** — the standard payout model must remain the norm

---

## BYOC & BYOP Transition Economics

### BYOC (provider brings their customers)

When a provider migrates existing customers into Handled Home:
- Preserve current economics temporarily (transition payout terms)
- Or offer BYOC bonus incentives during the migration window
- Accept thin margin at entry because the provider is seeding demand and density at near-zero CAC

The path to profitability: the migrated household adds services over time. A customer who entered for lawn-only becomes profitable when they add pest, gutters, or windows.

### BYOP (customer brings their provider)

When a homeowner wants to keep a trusted provider:
- Preserve that customer-provider relationship at similar pricing initially
- Reduce switching friction to win the household into the app
- Accept thin margin on the incumbent service

The path to profitability: the household is now in the system. Even if the original provider relationship runs at weak margin, the household becomes profitable when additional services are added through Handled Home's curated network.

### The shared principle

**Thin margin at entry is acceptable if the total household becomes profitable over the relationship lifetime.**

You may inherit one relationship at weak margin and still win if you later add 2–4 additional services at standard margin.

---

## Example Unit Economics (Directional)

These are illustrative examples, not final locked numbers. They show how the margin model works in practice.

### Example 1: Core household

A customer subscribes to a plan that includes:
- biweekly lawn care
- quarterly pest control
- annual gutter cleaning
- annual dryer vent cleaning

**Why this works:**
- Lawn anchors the relationship with regular visits
- Pest adds recurring value at good margin
- Gutters + dryer vent increase perceived plan completeness
- The annual items make the plan feel richer than the monthly cost profile suggests
- Household contribution margin is healthy from month 1

### Example 2: BYOC migrated customer

A lawn provider brings an existing customer at roughly current lawn economics.

**At entry:** Margin is thin — the provider payout preserves their existing rate.

**Over time:** The household adds pest, gutter cleaning, pressure washing, and window cleaning through the platform.

**Result:** Total household revenue grows significantly while the original lawn payout stays flat. The household becomes much more profitable than the original lawn-only relationship.

### Example 3: Loss-leader anchor

Handled Home uses a sharp lawn or pest entry offer to get the app installed and the household activated.

**At entry:** The first service may be low-margin or break-even.

**Over time:** The customer sees recommendations, receives seasonal prompts, and adds services. Attach rate drives the household into profitability.

**Rule:** If a loss-leader cohort does not show meaningful attach within 90 days, re-evaluate the offer.

---

## Zone & Density Mechanics

### How density creates margin

As more households activate in a zone:
1. Provider drive time between stops decreases
2. More jobs fit into a single Service Day
3. Provider cost-per-stop drops
4. Customer pricing stays the same
5. The spread widens automatically

This is one of the most important long-term margin levers. It requires no pricing changes — it happens organically as density grows.

### Zone-level controls

Admins can independently adjust per zone:
- **Customer price multipliers** — higher-cost markets can command higher plan prices
- **Provider payout rates** — set by SKU + Level + zone
- **Capacity caps** — prevent overselling before density supports quality delivery
- **Service Day patterns** — optimize routing and scheduling efficiency

These controls allow per-market margin optimization without changing the customer or provider experience in other zones.

### Density thresholds (directional)

| Threshold | What changes |
|-----------|-------------|
| 5–10 households/zone | Minimum viable route; likely subsidy phase |
| 15–25 households/zone | Route efficiency kicks in; margin begins widening |
| 25–40 households/zone | Strong density; provider retention improves significantly |
| 50+ households/zone | Maximum route efficiency; gross margins peak |

---

## Provider Payout Logic

### Why providers accept standardized payouts

A provider may accept a somewhat lower per-job payout than their independent rate if:
- they get **more jobs per week** (fuller schedule)
- the jobs are **closer together** (less drive time)
- **payment is automatic** (no invoicing, no collections)
- their **calendar is consistently full** (less selling required)
- they spend **more time doing paid work** and less on admin

This is a real economic advantage. A provider earning $45/job independently but spending 30% of the week on non-billable work may net less than a provider earning $38/job through Handled Home with 90% billable time.

### Payout structure

- Payouts are **per job**, set by SKU + Level + zone
- Payouts are **guaranteed and predictable** — no tip dependency, no surge pricing
- Providers **never see customer pricing** — they see only their payout
- Payouts are **reviewed periodically** based on market data, density, and provider feedback

### Provider economics flywheel

More density → denser routes → more stops/day → better provider earnings/hour → better provider retention → better service quality → better customer retention → more density

---

## Key Pricing Principles (Summary)

1. **Never expose per-handle or per-service economics to customers** — frame plans as managed coverage, not itemized costs
2. **Providers never see customer pricing** — they see only their guaranteed payout per job
3. **Zone-by-zone margin control** — admin can adjust customer price multipliers and provider payouts independently
4. **Generous first-month experience** — slightly over-deliver early to build trust
5. **Rollover feels generous** — 1.5× monthly cap; show "12 handles rolled over!" as a positive signal
6. **Tier upgrades feel natural** — "You're getting great value — unlock more flexibility" not "You're running out"
7. **Judge profitability at the household level** — a single service can run thin if the household contributes healthy margin overall
8. **Standardized pricing by default** — exceptions are documented, strategic, limited, and never the norm
9. **Thin entry margin is acceptable** — if BYOC, BYOP, or loss-leader acquisition leads to profitable households over time
10. **Review loss leaders quarterly** — kill anything that stays unprofitable without driving attach, density, or retention

---

## How This Document Relates to Other Docs

| Document | Relationship |
|----------|-------------|
| `masterplan.md` | Strategy + vision. This doc provides the tactical margin/pricing layer underneath. |
| `global-system-architecture.md` | Canonical schema, enums, and rules engine. Pricing/payout rules are enforced server-side per that doc's rules engine boundary. |
| `feature-list.md` | Implementation inventory. Features related to pricing, plans, payouts, and bundles should reference this doc for business logic. |
| `ai-growth-operating-plan.md` | Growth programs and automation. Program E (Profitability & Autopilot Controls) operationalizes the margin levers defined here. |
