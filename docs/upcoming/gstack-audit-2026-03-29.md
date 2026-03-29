# Handled Home — gstack Comprehensive Audit

> **Date:** 2026-03-29
> **Framework:** gstack by Garry Tan (YC) — Office Hours, CEO Review, Eng Review, Design Review, CSO Audit
> **Method:** 5 parallel analysis agents, each applying a different gstack lens
> **Scope:** All 6 core documents + UI/UX audit + codebase analysis + 106 authenticated screenshots

---

## Executive Summary

| Audit Lane | Grade | Verdict |
|------------|-------|---------|
| **Office Hours** (Garry Tan / Peter Thiel lens) | Conditional Pass | Strong strategy, zero demand evidence |
| **CEO Review** (Scope & 10-star product) | 7/10 architecture, 4/10 execution | Severely over-scoped for launch (400 features, needs ~150) |
| **Eng Review** (Architecture & scaling) | B- | Sound foundations, immature operational layer |
| **Design Review** (7-dimension scorecard) | C+ (4.6/10 → 7.1/10 post-fix) | Good spec, inconsistent execution |
| **CSO Security** (OWASP + STRIDE) | D+ | 3 critical findings require immediate remediation |

**The core insight across all 5 lanes:** This product has genuinely differentiated strategy and architecture — BYOC growth loop, handles currency, zone-density moat, routine builder — buried under premature complexity and broken execution at critical moments. The team that built the excellent Notifications, Billing, and Founding Partner screens can ship a great product. The question is whether they will simplify before launching or launch with 400 features and broken core loops.

---

## The 3 Things That Must Be True for This Business to Work

Every audit lane converged on the same three existential requirements:

### 1. The BYOC loop must work end-to-end
This is the company's asymmetric growth weapon. Provider sends invite → Customer activates → First service → Proof photo → Customer refers neighbor. **Currently broken:** link creation fails ("No enabled categories"), SMS scripts empty, BYOC Center gates providers with no next step. Every day this is broken is a Founding Partner Program day burning without converting.

### 2. Proof surfaces must deliver emotional value
The subscription is justified by proof — photos, receipts, service history, Home Health Score. **Currently broken:** Photo Timeline shows gray boxes. Activity screen is a bare text list missing stats pills, value card, and receipt highlight. A customer who can't see proof of value churns after month 2.

### 3. The first provider must have a reason to stay
A quality provider with 40 steady customers already has full routes and direct billing. **Currently unanswered:** What specific, measurable advantage does Handled Home offer that provider in the first 30 days that justifies migrating customers into a system where Handled Home takes a margin cut?

---

## Office Hours: The Six Forcing Questions

| Question | Verdict | Key Finding |
|----------|---------|-------------|
| **Demand Reality** — Evidence someone wants this? | NEEDS WORK | Zero demand evidence cited. No pilot data, no waitlist, no customer quotes. Strategy is built entirely from logic. |
| **Status Quo** — What do users do now? | PASS (with caveat) | Accurately described. Caveat: understates how functional "my guy I text" is for affluent homeowners. Missing: what is the triggering event that breaks the status quo? |
| **Desperate Specificity** — Name the human | FAIL | 5 marketing segments, not behavioral archetypes. "Busy Dual-Income Families" is not a person. Need: "Sarah Chen, 38, VP Marketing, spent 4 hours replacing a pest control provider last month." |
| **Narrowest Wedge** — Smallest payable version? | NEEDS WORK | Launch strategy is focused (one metro, anchor services). But the built product is 400 features — 2-3x the necessary scope. Handles currency adds abstraction at the moment the first sale needs simplicity. |
| **Observation & Surprise** — Watched someone use it? | FAIL | No user observation data anywhere. 106 screens exist but no record of a real user completing a real task. Product designed from logic, not discovered from behavior. |
| **Future-Fit** — More essential in 3 years? | CONDITIONAL PASS | Moat thesis is structurally sound (switching costs, density, bundle expansion). Contingent on density actually being achieved before a better-funded competitor copies the model. |

### Zero to One Analysis

- **10x improvement?** Mixed. 10x for a new homeowner with zero recurring services. 2-3x for someone who already has "a lawn guy and a pest guy."
- **The secret:** "Discovery is solved. Nobody solved what happens after you find someone." Angi helps you find; Handled Home makes you stop managing.
- **Monopoly play?** Aspires to monopoly via zone density. Currently entering a competitive market.
- **Contrarian truth:** "Most people believe consumers want choice in home services. The truth is they want the decision removed entirely."

### The Uncomfortable Question
> "Who is the first provider who will migrate their best customers into your platform, and why would they — when their current setup already works?"

---

## CEO Review: Scope & Product-Market Fit

### Scope Verdict: SEVERELY OVER-SCOPED

| Category | Features Built | Needed at Launch |
|----------|---------------|-----------------|
| Core customer experience | ~80 | ~70 |
| Provider workflow | ~50 | ~40 |
| Admin ops | ~40 | ~20 |
| Routing/scheduling engine (PRD-300) | 65 | ~10 |
| AI intelligence layer | 6 | 2 |
| SOPs, automation governance | ~40 | 0 |
| Design system, infra | ~30 | ~25 |
| **Total** | **~400** | **~150-180** |

### The Kill List (Defer, Don't Ship)

1. **PRD-300 Routing Engine (65 features, 9 sprints)** — VRPTW solver, rolling horizon planner, break-freeze policies, familiarity scoring. At 3 providers in one zone, the nearest-neighbor optimizer is sufficient. This engine is the single largest operational liability.
2. **Auto-governance features** — Auto-suspend providers, auto-promote backups, auto-resolve disputes. At launch, the ops team makes these calls manually. Automated provider demotion at low job volumes erodes trust.
3. **AI dispute resolution** — Uncalibrated model at zero dispute history produces incorrect resolutions. Human-review until 200+ resolved disputes provide calibration data.
4. **5-step automated dunning** — At 50 customers, a founder phone call recovers more than automated escalation.
5. **Referral fraud controls** — Velocity caps, suspicious IP detection at 50 customers = more false positives than actual fraud.
6. **Loss-leader review tabs, KPI definitions page, 6 SOPs** — Internal ops tooling, not user features.

### The Missing List (Build Before Launch)

1. **Social proof** — "X neighbors in your area already use Handled." Not shown anywhere. Most powerful trust signal for home services.
2. **Working BYOC loop** — Link creation, SMS scripts, pre-approval UX. Currently broken.
3. **Photo Timeline + Activity screen** — Core proof surfaces. Currently gray boxes and bare text.
4. **Referral code auto-fill on auth screen** — Provider sends invite, customer arrives at generic form. No connection shown.
5. **Network effect visibility** — Density is a backend optimization with zero customer-facing signal.
6. **Post-cancellation win-back loop** — No re-engagement sequence after churn.

### The 10-Star Moment
> A customer shows their neighbor their phone: "I haven't thought about my gutters, lawn, or windows in 14 months." They show the photo timeline of every service visit. The neighbor taps "Invite a Neighbor" and is set up in 90 seconds using the same provider.

**This moment is already architecturally possible. It needs 6 execution fixes and the removal of everything that distracts from it.**

---

## Eng Review: Architecture & Scaling

### Architecture Grade: B-

| Dimension | Grade | Issue |
|-----------|-------|-------|
| Stack choice (Supabase + React + Edge Functions) | A- | Correct for stage |
| Data model (schema, RLS, idempotency) | B+ | 183 migrations, sound fundamentals |
| Edge Function architecture | C+ | 27 JWT bypasses, no shared layer, version drift |
| Frontend bundle | C | No code splitting on 142-page app |
| Test coverage | D | Zero tests on billing, payments, handles |
| Operational readiness | C+ | No cron monitoring, no error observability |
| Security posture | C | CORS wildcard, JWT bypass on financial functions |

### Scaling Bottlenecks

| Scale | What Breaks |
|-------|-------------|
| **100 customers** | Nothing architectural. Operational gap: no alerting when Edge Functions fail. |
| **1,000 customers** | Nightly planner hits 150s Edge Function timeout. QueryClient with no staleTime exhausts DB connections. Photo storage costs grow linearly. |
| **10,000 customers** | Single Postgres instance is the entire backend (no read replica, no cache). 36 independent Edge Functions become unmanageable. O(n²) route optimization produces suboptimal routes. |

### Top 7 Recommended Changes (Priority Order)

1. **Create shared Edge Function utilities** (`_shared/auth.ts`, `cors.ts`, `deps.ts`) — 1-2 days, eliminates JWT bypass risk
2. **Add React.lazy code splitting** to App.tsx — 1 day, 60-70% initial bundle reduction
3. **Configure QueryClient staleTime** — 2 hours, dramatically reduces DB load
4. **Replace nightly planner with zone-parallel fan-out** — 3-5 days, eliminates timeout at scale
5. **Add job failure alerting** for 11 scheduled functions — 1 day
6. **Move pg_cron config into migrations** — half day
7. **Add payment flow unit tests** — ongoing, critical for billing accuracy

---

## Design Review: 7-Dimension Scorecard

| Dimension | Before | After (projected) |
|-----------|--------|-------------------|
| Information Architecture | 5.0 | 7.5 |
| Interaction States | 3.5 | 7.0 |
| User Journey / Emotional Arc | 4.5 | 7.0 |
| AI Slop Risk | 5.5 | 7.5 |
| Design System Consistency | 5.0 | 7.5 |
| Responsive & Accessibility | 4.0 | 6.5 |
| Unresolved Decisions | 4.5 | 7.0 |
| **Average** | **4.6** | **7.1** |

### Spec Compliance: ~55%
The spec is thorough and well-written. Implementation has significant divergences:
- Services catalog exists as standalone page (spec says remove it)
- Dashboard shows cumulative counts (spec says Handle Balance Bar + Next Service)
- Activity screen missing entire top section (stats pills, value card, receipt)
- Cancel button is full-width red (spec says ghost/destructive)
- Provider greeting uses email (spec says first name)

### Top 3 Design Fixes
1. **Rebuild Activity screen** from spec — subscription value reinforcement surface
2. **Remove standalone Services catalog** — biggest product rule violation and AI slop surface
3. **Add CTAs to 5 provider empty states** — lowest effort, highest impact for provider onboarding

---

## CSO Security Audit: Critical Findings

### Grade: D+

### 3 Critical Findings (Fix Before Production)

**1. Stripe Webhook Signature is Optional (Critical, 10/10 confidence)**
If `STRIPE_WEBHOOK_SECRET` is not set, the webhook silently accepts any POST body as a Stripe event. A forged `checkout.session.completed` creates a real subscription with no payment. **Fix:** Throw if secret is absent. Never fall through to `JSON.parse(body)`.

**2. 19 Edge Functions Have Zero Authentication (Critical, 10/10 confidence)**
Including `run-dunning`, `run-billing-automation`, `send-email`, `run-nightly-planner`, `assign-jobs`. `send-email` is an open relay — any caller can send arbitrary HTML email from Handled Home's domain. `run-dunning` can be triggered externally to harass all customers. **Fix:** Require `CRON_SECRET` on all scheduled functions. Restrict `send-email` to service-role only.

**3. Billing Automation Auth Bypass via Anon Key (Critical, 10/10 confidence)**
`run-billing-automation` checks if the auth header "includes" the anon key — which is a public value in every browser bundle. Any user can trigger billing automation including `release_eligible_earning_holds`. **Fix:** Require admin JWT or CRON_SECRET. Remove anon-key passthrough.

### 7 Additional High/Medium Findings

| # | Severity | Finding |
|---|----------|---------|
| 4 | High | `send-email` is unauthenticated email relay |
| 5 | High | `create-checkout-session` uses caller-supplied email for Stripe customer lookup |
| 6 | High | `bootstrap_new_user` accepts `intended_role` from user metadata (provider self-assignment) |
| 7 | High | BYOC invite links enumerable via anon SELECT policy (all active tokens exposed) |
| 8 | Medium | CORS wildcard on Stripe webhook endpoint |
| 9 | Medium | `previewRole` persisted in localStorage (XSS escalation path) |
| 10 | Medium | Test users with known password (`65406540`) in production migrations |

### Payment Security Assessment
- **Positive:** Webhook deduplication, payout amount from DB not caller, provider org verification for Connect
- **Critical gaps:** Webhook signature bypass, customer email spoofing in checkout, no plan entitlement validation

---

## Unified Priority Roadmap

### Before Production (Security — Do First)

| Priority | Fix | Effort | Lane |
|----------|-----|--------|------|
| P0 | Enforce Stripe webhook signature (throw if secret missing) | 1 hour | CSO |
| P0 | Add CRON_SECRET to all 19 unauthed Edge Functions | 1 day | CSO |
| P0 | Fix billing automation anon-key bypass | 1 hour | CSO |
| P0 | Restrict send-email to service-role callers | 1 hour | CSO |
| P0 | Separate seed data from production migrations | Half day | CSO |
| P0 | Remove intended_role from client auth bootstrap | 2 hours | CSO |
| P0 | Fix BYOC invite link enumeration (restrict anon SELECT) | 1 hour | CSO |

### Before Launch (Core Experience)

| Priority | Fix | Effort | Lane |
|----------|-----|--------|------|
| P1 | Fix BYOC link creation ("No enabled categories") | 1-2 days | Growth |
| P1 | Write and deploy SMS scripts for BYOC invites | Half day | Growth |
| P1 | Rebuild Photo Timeline with proper empty/loading states | 1-2 days | Design |
| P1 | Rebuild Activity screen (stats pills, value card, receipt) | 1-2 days | Design |
| P1 | Add CTAs to 5 provider empty states | Half day | Design |
| P1 | Create shared Edge Function utilities (_shared/) | 1-2 days | Eng |
| P1 | Add React.lazy code splitting to App.tsx | 1 day | Eng |
| P1 | Configure QueryClient staleTime defaults | 2 hours | Eng |

### Before Scale (Operational Readiness)

| Priority | Fix | Effort | Lane |
|----------|-----|--------|------|
| P2 | Add social proof counter ("X neighbors in your area") | 1-2 days | Growth |
| P2 | Remove standalone Services catalog | 3-5 days | Design |
| P2 | Demote Cancel/Sign Out to ghost/destructive | Half day | Design |
| P2 | Add job failure alerting for scheduled functions | 1 day | Eng |
| P2 | Move pg_cron config into migrations | Half day | Eng |
| P2 | Add payment flow unit tests | Ongoing | Eng |
| P2 | Zone-parallel fan-out for nightly planner | 3-5 days | Eng |
| P2 | Defer PRD-300 routing engine (65 features) | Decision | CEO |

---

## The Investment Thesis

**Conditional Pass.**

The strategy is one of the more thoughtful in the home services category. The problem is real, the moat mechanics are sound, and BYOC is genuinely original. The handles currency model is sophisticated margin management. The Routine Builder is the kind of feature customers build habits around.

The condition: **this is currently a well-built theory with zero external validation.** Before the next round of investment (time or capital), the founder needs three data points:

1. **How many providers have invited customers via BYOC, and what was the activation rate?**
2. **What does a customer cohort's 60-day retention look like on the anchor service?**
3. **What is the actual CAC in the launch market?**

The company is not building the wrong thing. It may be building the right thing without yet knowing if anyone will pay for it at the price and in the way the model requires.

**Bottom line:** Fix the 7 security criticals, fix the 6 broken core loops, defer the 65-feature routing engine, and get one BYOC provider to migrate 20 customers. That data point is worth more than the next 100 features.

---

*Report compiled from 5 parallel gstack audit agents. Each agent reviewed the codebase, documentation, and screenshots independently. Findings were cross-validated — items flagged by multiple agents received higher priority in the unified roadmap.*
