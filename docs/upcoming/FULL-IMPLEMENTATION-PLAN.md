# Full Implementation Plan — Security & Core Loops

> **Created:** 2026-03-29
> **Source:** gstack Comprehensive Audit + UI/UX Audit (2026-03-29)
> **Execution mode:** Quality (default)
> **Branch strategy:** One feature branch per PRD

---

## Strategic Context

Two audits identified the critical path to a launchable product:

1. **gstack Audit** — 5-lane analysis (Office Hours, CEO Review, Eng Review, Design Review, CSO Security) found: 3 critical security vulnerabilities, broken core growth loops, 2-3x over-scoping, and zero demand evidence.
2. **UI/UX Audit** — 4-lane visual analysis across 106 authenticated screenshots found: 6 critical findings, broken proof surfaces, provider empty-state CTA gaps, and marketplace-feel violations.

This plan addresses the audit findings in dependency order: **security first → infrastructure → core loops → proof surfaces → growth → polish.**

---

## PRD Sequence

### Phase 1: Security (Must fix before any user touches production)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 001 | Edge Function Security Hardening | Fix 3 critical vulns: Stripe webhook signature enforcement, CRON_SECRET on 19 unauthed functions, billing automation anon-key bypass. Fix send-email open relay. Create shared `_shared/` auth utilities. Fix BYOC invite link enumeration. Remove intended_role from auth bootstrap. Separate seed data from migrations. | Large | None |

### Phase 2: Infrastructure (Foundation for everything that follows)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 002 | Frontend Performance & Observability | React.lazy code splitting on 142-page App.tsx. Configure QueryClient staleTime defaults. Add job failure alerting for 11 scheduled Edge Functions. Move pg_cron config into migrations. Remove CORS wildcard from webhook endpoints. | Medium | 001 |

### Phase 3: Core Growth Loop (The BYOC flywheel — the company's primary growth engine)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 003 | BYOC Flow End-to-End Fix | Fix "No enabled categories found" on link creation. Write and deploy SMS invite scripts. Design BYOC Center pre-approval waiting state. Add referral code auto-fill + provider name on auth screen. Fix provider empty states (Organization, Support, My Jobs, Job History — add CTAs). | Large | 001 |

### Phase 4: Proof Surfaces (What justifies the subscription month after month)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 004 | Photo Timeline & Proof System | Fix Photo Timeline empty/loading/loaded states. Implement before/after labels on photo tiles. Add tap-to-expand interaction. Implement proper empty state messaging. Add loading skeletons. | Medium | 002 |
| 005 | Activity Screen Rebuild | Add stats summary pills (total services / photos / member months). Add value card ("Your home has received X services since [date]"). Add recent receipt highlight with photo thumbnail. Enrich timeline rows with photo thumbnails and service badges. | Medium | 004 |

### Phase 5: Customer Experience Polish (Audit-identified critical UX fixes)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 006 | Customer Dashboard & Subscription UX | Replace "25 Upcoming" with "Next Service: [Date]". Implement Handle Balance Bar. Remove "Get the app" banner on mobile. Add Home Team card. Demote Cancel Subscription to ghost/destructive. Add Pause confirm button. Add Change Plan CTA. Demote Sign Out to ghost/destructive across all settings pages. | Medium | 005 |
| 007 | Services Catalog Redesign | Remove standalone Services catalog page. Surface services contextually within Routine Builder via "+ Add Services" sheet. Add plan context badges (Included / Add-on / Not in zone). Replace photo tiles with icon-based cards matching design system. | Large | 006 |

### Phase 6: Provider Experience (New provider first-day experience)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 008 | Provider Dashboard & Onboarding Polish | Fix email-as-greeting → first name. Collapse zero-state tiles to single placeholder card. Make BYOC invite the sole primary CTA on empty dashboard. Add capacity warning CTA ("Adjust Availability"). Redesign Performance/Score screen (lead with SLA Status, consolidate metrics, add primary CTA). Fix null state consistency (0 vs —). | Medium | 003 |

### Phase 7: Admin Operational Readiness (Ops team can actually work)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 009 | Admin Data Display & Navigation Fixes | Fix Subscriptions screen — surface real customer names, plan names, sortable columns. Fix Payouts screen — add provider identity, zone, filters. Rebuild Exceptions screen (add history, filters, remove party emoji). Add Reporting, Growth, Notification Health, Cron Health to sidebar nav. Standardize tab filter styles. Rebuild Cron Health to match Notification Health layout. | Large | 002 |

### Phase 8: Growth Surfaces (Viral mechanics that drive acquisition)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 010 | Social Proof & Referral Polish | Add "X neighbors in your area" counter to auth screen and dashboard. Animate referral milestone celebrations with shareable cards. Consolidate duplicate referral code copy mechanisms. Fix referral tier label truncation. Add sharing friction reduction (pre-written text, direct iMessage/WhatsApp). | Medium | 003, 006 |

### Phase 9: Design System Consistency (Cross-cutting fixes identified by both audits)

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 011 | Design System Alignment Pass | Create shared empty-state component (icon + message + CTA slot). Standardize destructive button treatment (ghost/destructive everywhere). Single sticky Save on all settings pages. Standardize back navigation (drill-down = back arrow, tab-level = no arrow). Fix WCAG AA contrast on muted text. Remove previewRole from localStorage (in-memory only). | Medium | 006, 008 |

### Phase 10: Testing & Validation

| PRD | Title | Scope | Size | Depends On |
|-----|-------|-------|------|-----------|
| 012 | Payment & Critical Path Test Coverage | Unit tests for: run-billing-automation (cycle creation, idempotency, handle grant), process-payout (admin auth, threshold, Stripe Connect), run-dunning (5-step escalation ladder), recalc_handles_balance (rollover, expiry, concurrent add-ons), create-checkout-session (plan entitlement, email derivation). E2E test for BYOC end-to-end flow. | Large | 001, 003 |

---

## Dependency Graph

```
PRD-001 (Security) ─────┬──→ PRD-002 (Infrastructure) ──→ PRD-004 (Photos) ──→ PRD-005 (Activity)
                         │                                                            │
                         │                                                            ▼
                         ├──→ PRD-003 (BYOC) ──→ PRD-008 (Provider UX) ──→ PRD-010 (Growth)
                         │                                                     │
                         │                                                     ▼
                         │                              PRD-006 (Customer UX) ──→ PRD-007 (Services)
                         │                                        │
                         │                                        ▼
                         │                              PRD-011 (Design System)
                         │
                         ├──→ PRD-009 (Admin)
                         │
                         └──→ PRD-012 (Tests) ← can start after 001+003
```

---

## Parallelization Opportunities

These PRD pairs can run in parallel if multiple sessions are available:

- **PRD-002 + PRD-003** — Infrastructure and BYOC fix different parts of the codebase
- **PRD-004 + PRD-009** — Photo Timeline (customer) and Admin fixes (admin) are independent
- **PRD-008 + PRD-006** — Provider UX and Customer UX are independent page sets
- **PRD-012** — Tests can be written alongside any PRD once 001 and 003 are complete

---

## Estimated Effort

| Phase | PRDs | Estimated Total |
|-------|------|-----------------|
| 1. Security | 001 | 3-4 days |
| 2. Infrastructure | 002 | 2-3 days |
| 3. Core Growth Loop | 003 | 3-4 days |
| 4. Proof Surfaces | 004, 005 | 3-4 days |
| 5. Customer UX | 006, 007 | 4-5 days |
| 6. Provider UX | 008 | 2-3 days |
| 7. Admin Ops | 009 | 3-4 days |
| 8. Growth Surfaces | 010 | 2-3 days |
| 9. Design System | 011 | 2-3 days |
| 10. Testing | 012 | 3-4 days |
| **Total** | **12 PRDs** | **~27-37 days** |

With parallelization, the critical path is approximately 18-22 days.

---

## What This Plan Does NOT Cover

These items were identified in the audits but are deferred until after the core loops are working and demand is validated:

- **PRD-300 Routing Engine (65 features)** — Defer until zone density demands it. Nearest-neighbor optimizer is sufficient at launch.
- **Auto-governance features** — Auto-suspend, auto-promote providers. Manual ops at launch.
- **AI dispute resolution** — Human-review until 200+ disputes calibrate the model.
- **Provider tier ladder** (Standard → Preferred → Elite) — Build after enough job volume for meaningful scores.
- **Provider-refers-provider growth loop** — Prove BYOC first, then add supply-side referrals.
- **"Gift a plan" mechanic** — After base subscription conversion works.
- **Post-cancellation win-back loop** — After churn data exists.
- **Weather mode integration** — Manual admin override at launch.
- **Loss-leader analytics, KPI definitions page, SOPs** — Internal tooling, not user features.

These deferred items can become a second FULL-IMPLEMENTATION-PLAN after the first plan ships and demand evidence is collected.

---

## Success Criteria

This plan is complete when:

1. All 3 critical security vulnerabilities are fixed and verified
2. A provider can create a BYOC invite link, send it via SMS, and a customer can activate it end-to-end
3. A customer can view their Photo Timeline with real photos and see their Activity screen with stats and value reinforcement
4. The admin can manage subscriptions and payouts with real customer/provider names
5. The frontend bundle is code-split and loads under 3 seconds on LTE
6. Payment critical paths have unit test coverage
7. All provider empty states have forward-action CTAs

When these 7 conditions hold, the product is ready for its first BYOC pilot with a real provider.
