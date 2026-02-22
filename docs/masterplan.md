# masterplan.md

## 30-Second Elevator Pitch
Handled Home is a subscription-only, density-driven home services platform that turns maintenance into a predictable routine.
Homeowners receive an assigned recurring Service Day based on their zone and bundle standardized services (SKUs) for that cycle.
By clustering homes geographically, Handled Home creates route density — delivering lower cost, higher reliability, and predictable MRR rather than one-off transactional bookings.

It is a profit-first density engine for recurring home maintenance.

---

## Problem and Mission

### Problem
- Home maintenance is reactive and fragmented.
- Homeowners coordinate multiple vendors manually.
- Scheduling is unpredictable.
- Service quality is inconsistent.
- Providers lose margin to drive time and sales overhead.

### Mission
Make home upkeep automatic and predictable.

Core promise:
> "Your home is handled."

---

## Target Audience

### Primary
- Busy suburban homeowners
- Dual-income households
- Homeowners who value predictability over price shopping

### Secondary
- Light multi-property owners
- High-trust neighborhoods
- Service providers seeking consistent route density

---

## Business Model

### Revenue Model
- Subscription MRR from homeowners
- 10–15% take rate on provider payouts
- No payroll — providers are independent partners (initially)

### Density Flywheel

1. **Subscription creates predictable demand** — Customers commit to recurring Service Days.
2. **Zone stacking creates operational density** — Grouped jobs lower provider time per job.
3. **Density increases provider margin** — Providers tolerate lower take rate because utilization is high.
4. **Providers accept recurring flow** — Handled Home becomes embedded in their revenue stream.
5. **Recurring flow increases SKU adoption** — Customers add services they normally wouldn't call for.
6. **Higher ARPU + higher retention** — Long-term compounding.

### What We Optimize For
- MRR per household
- Gross margin per Service Day
- Density per zone per day
- Provider retention
- Subscription retention
- Support cost per job (must stay low — if support cost explodes, model dies)

### Strategic Bets (Explicit Decisions)

1. **Launch SKU count: 3–5 per zone** until density + proof compliance is stable. Every SKU adds edge cases + disputes.
2. **Default routine is the primary path.** Recommended routine and auto-fit are the main flow, not a side feature. Fastest path to density is not asking customers to design everything from scratch.
3. **Seasonal complexity boundary:** Window preference (early/mid/late month) only, no date-level scheduling. Seasonal is an ARPU lever, not a scheduling trap.

### What We Are NOT
- Not a gig marketplace
- Not a lead gen platform
- Not a CRM for contractors
- Not a discount club

---

## Strategic Approach

### Profit-First, Cash-Flow Disciplined
- Build a density business, not a growth-at-all-costs marketplace.
- Prove unit economics in 1 city before expanding.
- Zone-by-zone expansion, not city-wide blitz.

### Hybrid Scaling Path
1. Prove retention > 80% in launch market.
2. Prove attach rate (cross-SKU adoption) increases over time.
3. Prove density measurably reduces cost per job across 3–5 cities.
4. Then decide: continue cash-flowing or raise capital to accelerate.

Raising before proof puts you on a growth treadmill. Proving first gives leverage.

---

## Core Features

### Customer Experience
- Zone-based recurring Service Day assignment
- Controlled rejection flow (2–3 alternatives only)
- Subscription-first billing
- Bundle builder per cycle
- Standardized SKU transparency
- Before/after photo proof
- Line-item ratings
- Structured issue resolution

### Provider Experience
- Daily job list
- Checklist enforcement
- Required photo uploads
- Exception handling
- Performance metrics dashboard
- Earnings transparency

### Admin Experience
- Regions and zip-based zones
- Capacity guardrails (stops + minutes)
- SKU governance system
- Subscription plan configuration
- Provider onboarding + enforcement
- Support tooling (refunds, redos, impersonation)
- Analytics dashboards

---

## Tech Stack

### Frontend
- React + Vite + Tailwind CSS + TypeScript
- Capacitor for iOS/Android

### Backend
- Lovable Cloud (Supabase: Auth, Postgres, Storage, Edge Functions)

### Payments
- Stripe (payment rail only; entitlements managed in database)

### Infrastructure
- Supabase-managed hosting
- Supabase Storage for photo uploads
- Edge Functions for custom logic and webhooks

---

## Conceptual Data Model (ERD in Words)

- User (roles: Customer, ProviderMember, Admin)
- Household → has many Users
- Property → belongs to Household and Zone
- Zone → has default Service Days + capacity caps
- Subscription → belongs to Household
- SKU → governed service definition
- Bundle → per-cycle service selection
- Job → provider execution unit
- ChecklistResponse + PhotoEvidence
- ProviderOrg + ProviderMembers
- SupportTicket
- Payout
- AuditLog

---

## UI Principles

- One visible promise at all times
- No open calendar browsing
- Clear scope definitions
- Calm defaults
- Design for forgiveness
- Reduce cognitive load

---

## Security Notes

- TLS everywhere
- Role-based access control
- Encrypted sensitive data
- Signed photo URLs
- Immutable audit logs
- Stripe tokenization only

---

## Roadmap

### MVP — Completed
- **Modules 01–11:** Auth & Roles, Property Profiles, Zones & Capacity, SKU Catalog, Subscription Engine, Service Day System, Bundle Builder, Provider Onboarding, Job Execution, Customer Dashboard & Proof, Billing & Payouts
- 1 city, 3–5 SKUs, zone density proof, manual admin oversight

### Current Focus
- **Module 12:** Support and Disputes — deflection-first design, structured resolution, admin triage

### Remaining
- **Module 13:** Referrals and Incentives — growth lever, activate after retention is proven
- **Module 14:** Reporting and Analytics — proves unit economics for scaling decisions

### V1
- Utilization dashboards
- Enforcement automation
- Referral system
- Unit economics reporting

### V2
- Multi-city (3–5 cities, proving hybrid scaling path)
- Polygon zones
- Additional verticals (pest, pool)
- Managed crews in dense zones (hybrid model)

---

## Launch Scoreboard (Weekly Metrics)

These metrics prove the flywheel is working. Track weekly from day one:

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Service Day offer acceptance rate | >90% | Validates the assignment algorithm works |
| Offer expiry rate | Near zero | TTL cleanup should rarely fire if alternatives are good |
| Photo compliance % | ≥95% | Quality moat — proof-of-work must be non-negotiable |
| On-time completion % | ≥90% | Operational promise to customers |
| Redo rate | Baseline TBD | Leading indicator of provider quality issues |
| Support minutes per job | <3 min | If this rises, unit economics collapse |
| Zone density: stops/day | Trending up | Core operational efficiency metric |
| Zone density: minutes/stop | Trending down | Drive time efficiency improving with density |
| Gross margin per Service Day | Positive | Must be positive in launch zone before expanding |

---

## Risks and Mitigations

- Service debt → no rollover; unused service weeks expire at billing cycle end
- Quality variance → mandatory photo enforcement
- Density failure → geo focus strategy, zone-by-zone expansion
- Operational override creep → strict audit logging
- Weather volatility → weather mode
- Support cost creep → structured deflection, atomic SKUs, unambiguous scope
- Providers bypassing platform → embed in their revenue stream via recurring flow

---

## Future Expansion

- Property health score
- Predictive maintenance
- Insurance integrations
- Fleet optimization
- National scaling
- Vertical integration of high-margin SKUs in dense zones
