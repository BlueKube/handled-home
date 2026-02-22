

# Documentation Alignment Update — Profit-First Density Engine

## Why
The masterplan and implementation plan were written before development started and contain outdated tech stack references, a generic timeline, and no articulation of the business model mechanics. The strategic conversation with ChatGPT surfaced key concepts (density flywheel, profit-first strategy, hybrid scaling path) that should be captured so every future module stays aligned.

The global system architecture doc needs one small fix (no-rollover policy).

---

## Change 1: `docs/masterplan.md` — Major Rewrite

### What changes

**Elevator Pitch** -- Add explicit "density engine" language and profit-first framing.

**New section: "Business Model"** -- Insert after Target Audience:
- Revenue model: subscription MRR, 10-15% take rate, no payroll
- Density flywheel (subscription creates demand, zone stacking creates density, density increases provider margin, providers accept recurring flow, customers add SKUs, higher ARPU + retention)
- What we optimize for: MRR per household, gross margin per Service Day, density per zone per day, provider retention, subscription retention, support cost per job
- What we are NOT: not a gig marketplace, not lead gen, not a CRM for contractors, not a discount club

**New section: "Strategic Approach"** -- Insert after Business Model:
- Profit-first, cash-flow disciplined density business
- Prove unit economics in 1 city before expanding
- Hybrid scaling path: prove retention > 80%, attach rate increasing, density reduces cost measurably across 3-5 cities, then decide whether to raise capital or continue cash-flowing
- Zone-by-zone expansion, not city-wide blitz

**Tech Stack** -- Update to actual stack:
- Frontend: React + Vite + Tailwind + TypeScript, Capacitor for iOS/Android
- Backend: Lovable Cloud (Supabase: Auth, Postgres, Storage, Edge Functions)
- Payments: Stripe (payment rail only; entitlements in database)
- No Redis, no NestJS, no Next.js, no React Native

**Risks and Mitigations** -- Update:
- Remove "Service debt -> rollover caps + expiry" (no rollover policy)
- Add "Service debt -> no rollover; unused weeks expire at billing cycle end"
- Add "Support cost creep -> structured deflection, atomic SKUs, unambiguous scope"
- Add "Providers bypassing platform -> embed in their revenue stream via recurring flow"

**Roadmap** -- Update MVP to reflect actual progress:
- Modules 01-05 complete (Auth, Property, Zones, SKUs, Subscriptions with dual-clock billing)
- Current: Module 06 (Service Day System)
- MVP target: Modules 06-09 (Service Days, Bundle Builder, Provider Onboarding, Job Execution)

---

## Change 2: `docs/implementation-plan.md` — Rewrite to Reflect Reality

### What changes

Replace the generic 8-week timeline and team roles with:

**Completed Modules:**
- Module 01: Auth and Roles
- Module 02: Property Profiles
- Module 03: Zones and Capacity
- Module 04: SKU Catalog
- Module 05: Subscription Engine (upgraded: 28-day billing + weekly service weeks, no rollover)

**Current Focus:**
- Module 06: Service Day System

**Remaining MVP Modules (in order):**
- Module 07: Bundle Builder
- Module 08: Provider Onboarding
- Module 09: Job Execution

**Post-MVP Modules:**
- Module 10: Visit Tracking and Photos
- Module 11: Billing and Payouts
- Module 12: Support and Disputes (note: deflection-first design critical for unit economics)
- Module 13: Referrals and Incentives (growth lever, not MVP)
- Module 14: Reporting and Analytics (proves unit economics for scaling decisions)

**Launch Readiness Criteria** -- Keep existing criteria, add:
- Positive gross margin per Service Day in launch zone
- Support cost per job tracked and under threshold
- 12-month retention trajectory visible

**Remove:**
- Generic 8-week timeline (replaced by module sequence)
- Team roles section (not relevant to this build context)

---

## Change 3: `docs/global-system-architecture.md` — One Line Fix

### What changes

Line 201: Change "rollover caps/expiry" to "no-rollover enforcement (unused service weeks expire at billing cycle end)"

This aligns with the no-rollover policy implemented in Module 05.

---

## Files Impact
- `docs/masterplan.md` -- major update (new sections, tech stack, risks, roadmap)
- `docs/implementation-plan.md` -- rewrite (actual progress + module sequence)
- `docs/global-system-architecture.md` -- single line edit

