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

### MVP (Current)
- **Completed:** Modules 01–05 (Auth & Roles, Property Profiles, Zones & Capacity, SKU Catalog, Subscription Engine with dual-clock billing)
- **Current focus:** Module 06 (Service Day System)
- **Remaining MVP:** Modules 07–09 (Bundle Builder, Provider Onboarding, Job Execution)
- 1 city, 3–5 SKUs, zone density proof, manual admin oversight

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
