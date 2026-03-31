# Handled Home — gstack Comprehensive Audit (Updated 2026-03-29)

> **Original audit:** 2026-03-29 (5 parallel agents: Office Hours, CEO, Eng, Design, CSO)
> **Updated:** 2026-03-29 post-implementation — corrected with findings from PRD-001 through PRD-012
> **Important:** Security findings have been remediated. Design/UX findings were largely data artifacts.

---

## Executive Summary (Updated)

| Audit Lane | Original Grade | Updated Grade | What Changed |
|------------|---------------|---------------|-------------|
| **Office Hours** | Conditional Pass | Conditional Pass | Unchanged — demand evidence still needed |
| **CEO Review** | 4/10 execution | 7/10 execution | Codebase is more mature than audit suggested. Most features work correctly. |
| **Eng Review** | B- | B+ | Shared auth layer created, code splitting done, QueryClient configured, pg_cron documented |
| **Design Review** | C+ (4.6/10) | B (7.0/10) | Most "missing" features were data artifacts. Real fixes applied. |
| **CSO Security** | D+ | B | 7 of 10 findings remediated. 3 remaining are low-priority. |

---

## The 3 Things That Must Be True (Updated Status)

### 1. The BYOC loop must work end-to-end
**Original:** Broken at multiple points.
**Updated:** Partially fixed. Link creation UX improved (helpful CTA when no categories enabled). SMS scripts seeded (3 tones). BYOC Center pre-approval gate shows progress. Auth page shows invite context. **Remaining:** The "no enabled categories" is a data state (provider must complete capability onboarding) — the UX now guides them, but the data requirement remains.

### 2. Proof surfaces must deliver emotional value
**Original:** Photo Timeline shows gray boxes. Activity screen is bare text.
**Updated:** Both were already correctly implemented. Photo Timeline has proper empty state, loading skeletons, grouped layout, tap-to-expand, and signed URL loading. Activity screen has stats pills, value card, receipt highlight, and month-grouped timeline. **The audit saw empty seed data, not broken code.**

### 3. The first provider must have a reason to stay
**Status:** Unchanged — this is a business question, not a code question. The product is architecturally ready to deliver value; the question is whether a specific provider in a specific market will adopt it.

---

## Office Hours: The Six Forcing Questions (Unchanged)

These remain valid. They are strategic/business questions, not code issues:
- **Demand Reality:** Still needs real customer evidence
- **Status Quo:** Still understates how functional current workarounds are
- **Desperate Specificity:** Still needs vivid behavioral personas, not marketing segments
- **Narrowest Wedge:** Product scope is broad but AI coding velocity makes this manageable (founder's strategic choice)
- **Observation & Surprise:** Still needs user observation data
- **Future-Fit:** Moat thesis unchanged

### The Uncomfortable Question (Still Valid)
> "Who is the first provider who will migrate their best customers into your platform, and why would they?"

---

## CEO Review: Scope (Updated)

### Original Verdict: "Severely over-scoped" → Updated: "Broad but functional"

The CEO Review recommended cutting to ~150 features. The founder's strategic decision: **keep all features, fix and harden them.** AI coding velocity makes the cost of completeness low; the cost of re-building removed features later is higher. The real risk is not feature count but operational complexity requiring humans — and the product is designed with intelligence built in to reduce human ops burden.

**The "Kill List" is reframed as "Features to monitor for operational burden."** If a feature creates more support tickets than it solves, disable it. But don't pre-emptively remove features that might work.

### The 10-Star Moment (Still Valid)
> A customer shows their neighbor their phone: "I haven't thought about my gutters, lawn, or windows in 14 months."

This moment is architecturally possible today. The Photo Timeline, Activity screen, BYOC invite flow, and referral system are all built and functional.

---

## Eng Review: Architecture (Updated)

### Updated Grade: B+

| Dimension | Original | Updated | What Changed |
|-----------|----------|---------|-------------|
| Stack choice | A- | A- | Unchanged |
| Data model | B+ | B+ | Unchanged |
| Edge Function architecture | C+ | B+ | Shared `_shared/` auth layer created (PRD-001) |
| Frontend bundle | C | B+ | React.lazy code splitting + QueryClient staleTime (PRD-002) |
| Test coverage | D | C | Security regression tests added (PRD-012). Payment unit tests still needed. |
| Operational readiness | C+ | B- | pg_cron documented with SQL examples. CRON_SECRET configured. |
| Security posture | C | B+ | 7 of 10 CSO findings remediated |

### Recommended Changes Status

| # | Recommendation | Status |
|---|---------------|--------|
| 1 | Create shared Edge Function utilities | ✅ Done (PRD-001) |
| 2 | Add React.lazy code splitting | ✅ Done (PRD-002) |
| 3 | Configure QueryClient staleTime | ✅ Done (PRD-002) |
| 4 | Zone-parallel fan-out for nightly planner | Open (future work) |
| 5 | Add job failure alerting | Open (future work) |
| 6 | Move pg_cron config into migrations | Partially done (documented in DEPLOYMENT.md) |
| 7 | Add payment flow unit tests | Partially done (security regression tests) |

---

## Design Review: 7-Dimension Scorecard (Updated)

| Dimension | Original | Post-Implementation |
|-----------|----------|-------------------|
| Information Architecture | 5.0 | 7.5 |
| Interaction States | 3.5 | 7.5 (most states were already implemented) |
| User Journey / Emotional Arc | 4.5 | 7.0 |
| AI Slop Risk | 5.5 | 7.0 |
| Design System Consistency | 5.0 | 7.0 |
| Responsive & Accessibility | 4.0 | 5.5 (WCAG contrast borderline, needs design owner) |
| Unresolved Decisions | 4.5 | 6.5 |
| **Average** | **4.6** | **7.0** |

### Spec Compliance: ~~55%~~ → ~80%
Most "divergences" were data artifacts:
- ~~Dashboard shows cumulative counts~~ → Dashboard uses dynamic counts + Handle Balance Bar exists ✅
- ~~Activity screen missing top section~~ → Activity has stats pills, value card, receipt highlight ✅
- ~~Cancel button is full-width red~~ → Cancel uses outline/destructive variant ✅
- ~~Provider greeting uses email~~ → Greeting uses first name from profile ✅
- Services catalog lacks plan context badges → Still open (needs data layer work)

---

## CSO Security Audit (Updated)

### Updated Grade: B

| # | Finding | Original Severity | Status |
|---|---------|-------------------|--------|
| 1 | Stripe webhook signature bypass | Critical | ✅ FIXED (PRD-001 B2) |
| 2 | 19 Edge Functions with no auth | Critical | ✅ FIXED (PRD-001 B3) |
| 3 | Billing automation anon-key bypass | Critical | ✅ FIXED (PRD-001 B3) |
| 4 | send-email open relay | High | ✅ FIXED (PRD-001 B4) |
| 5 | create-checkout-session email spoofing | High | Open (needs server-side email derivation) |
| 6 | bootstrap_new_user role self-assignment | High | ✅ FIXED (PRD-001 B5) |
| 7 | BYOC invite link enumeration | High | ✅ FIXED (PRD-001 B5) |
| 8 | CORS wildcard on webhook | Medium | ✅ FIXED (PRD-001 B2 — noCorsHeaders) |
| 9 | previewRole in localStorage | Medium | ✅ FIXED (PRD-011) |
| 10 | Test users in production migrations | Medium | Open (complex extraction, deferred) |

### Remaining Security Work
- **Finding 5** (create-checkout-session email): Derive customer_email from JWT instead of request body
- **Finding 10** (seed data): Extract test users from migration to supabase/seed.sql

---

## Remaining Priority Items

### Still Open (Future Work)

| Item | Priority | Source | Notes |
|------|----------|--------|-------|
| Social proof counter ("X neighbors") | Medium | Growth audit | Needs backend zone density query |
| Services catalog plan context badges | Medium | Design audit | Needs useSkus → subscription data join |
| Provider-refers-provider growth loop | Low | Growth audit | Not built. Prove BYOC first. |
| Zone-parallel fan-out for nightly planner | Medium | Eng audit | Scaling concern at 1000+ customers |
| Job failure alerting for scheduled functions | Medium | Eng audit | Operational observability gap |
| Payment flow unit tests | Medium | Eng audit | Billing, dunning, handle balance |
| Seed data extraction from migration | Low | CSO audit | Complex 1400-line migration |
| Checkout email derivation from JWT | Medium | CSO audit | Security hardening |
| WCAG AA muted text contrast | Low | Design audit | Borderline 4.2:1, needs design owner |

### Demand Validation (Business, Not Code)

These questions from the Office Hours audit remain unanswered and are the most important items for the business:

1. **How many providers have invited customers via BYOC, and what was the activation rate?**
2. **What does a customer cohort's 60-day retention look like?**
3. **What is the actual CAC in the launch market?**

---

## Investment Thesis (Updated)

**Conditional Pass → Pass with Conditions.**

The product is significantly more mature than the original audit suggested. The security layer is now hardened. The UX is spec-compliant across most surfaces. The BYOC growth loop UX is improved. The infrastructure has proper code splitting and query caching.

The remaining condition is the same as before: **demand evidence.** The code is ready for a pilot. The question is whether a real provider will use it and whether real customers will pay.

**Bottom line:** The product is ready to test with real users. Get one BYOC provider to migrate 20 customers. That data point determines everything.
