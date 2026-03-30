# Full Implementation Plan — Session 2: Calibration & Launch Readiness

> **Created:** 2026-03-29 (end of Session 1)
> **Context:** Session 1 completed security hardening, core loop fixes, UI/UX audit corrections, launch playbook, and market simulation tool. The product is architecturally ready. The next phase is calibrating the system with real data and preparing for pilot launch.
> **Branch:** claude/add-documentation-workflow-OppGZ

---

## Strategic Context

Session 1 proved the codebase is more mature than audits suggested (~7.5/10 avg feature maturity). Security is hardened (6 vulnerabilities closed). Core loops work. The simulation tool reveals that a 4-zone Austin launch at $129/$179/$279 pricing with $45/job provider payout reaches near break-even by month 14 with ~$21K total investment.

**The remaining gap is not code — it's calibration and validation.** Seed data needs to be replaced with real provider-interviewed values. The simulation needs seasonal and multi-category modeling. And the product needs a few targeted fixes to close the remaining audit items.

---

## PRD Sequence

### Phase 1: Data Cleanup & Accuracy (First — quick wins that fix stale data)

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 013 | Feature List Maturity Ratings | Apply 1-10 ratings to all 400 features in feature-list.md. Remove "DONE" labels. Flag features that don't exist (confusion detector = 1/10, policy simulator = 2/10, SOPs = 3/10). Agent investigation already completed — just needs the file written. | S | 30 min |
| 014 | Seed Data Audit & Cleanup | Audit all seed data in migrations: SKU durations, handle costs, plan entitlements, zone configs, notification templates. Document which values are calibrated vs. guessed. Create a `docs/seed-data-audit.md` showing every assumed value and its source (or "needs provider interview"). | M | 1-2 hrs |

### Phase 2: Admin Tooling for Provider Onboarding (Unblocks real pilot)

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 015 | SKU Calibration Workflow | Admin page or enhancement to existing SKU editor: show current seed values, input provider-reported values, highlight deltas > 20%, approve calibrated values. Per-property-size-tier duration inputs. Export calibration report. | M | 2-3 hrs |
| 016 | Provider Interview Data Entry | Admin form to capture structured provider interview data: service durations by property size, equipment lists, cost expectations, pain points, growth goals. Store in a `provider_interviews` table or structured JSON. Map responses to SKU parameters automatically. | M | 2-3 hrs |

### Phase 3: Simulation Tool Enhancements (Better decision-making)

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 017 | Seasonal Revenue Modeling | Add month-by-month seasonal multipliers to the simulation: lawn revenue drops 40% Nov-Feb in Austin, pest control steady year-round, window cleaning seasonal peaks spring/fall. Update both simulate.ts and UI. | M | 1-2 hrs |
| 018 | Multi-Category Economics | Model each service category separately: lawn ($45-65/job), pest ($50-75/visit), windows ($150-300/visit). Different cadences, different margins. Show per-category P&L alongside combined. | M | 2-3 hrs |
| 019 | Provider Acquisition Funnel | Model the funnel: providers contacted → responded → interviewed → onboarded → active. How many do you need to contact to get 3 active providers per zone? Based on typical response rates from cold outreach vs. Thumbtack/Angi sourcing. | S | 1-2 hrs |
| 020 | Census Data Integration | Add real Austin Census/ACS data as default inputs: actual home counts per ZIP, home ownership rates, median income by block group. Replace guessed values with real demographics. Data sourced from Census API or pre-downloaded CSVs. | M | 2-3 hrs |

### Phase 4: Remaining Code Fixes (From audit findings)

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 021 | Services Catalog Plan Context | Add plan context to ServiceCard component: "Included in your plan" / "Add-on (3 handles)" / "Not in your zone" badges. Requires joining useSkus with customer subscription data. The audit's #2 critical finding — addressed without removing the page. | M | 2-3 hrs |
| 022 | Design System Alignment | Create shared EmptyState component (already exists but standardize usage). Fix WCAG AA contrast on muted text (borderline 4.2:1). Standardize back navigation. Remove previewRole from localStorage. Single sticky Save on settings pages. | M | 2-3 hrs |
| 023 | Payment & Billing Test Coverage | Unit tests for: run-billing-automation (cycle creation, idempotency, handle grant), process-payout (admin auth, threshold), run-dunning (5-step ladder), recalc_handles_balance (rollover, expiry), create-checkout-session (email derivation from JWT — CSO Finding 5). | L | 3-4 hrs |

### Phase 5: Launch Readiness (Final prep)

| PRD | Title | Scope | Size | Est. Time |
|-----|-------|-------|------|-----------|
| 024 | Provider Outreach Materials | Build provider-facing landing page or PDF: value prop, earnings projection, BYOC explanation, FAQ. Could be a standalone page at `/provider/apply` (already exists) enhanced with the interview-derived economics. | M | 2-3 hrs |
| 025 | Zone Builder Calibration | Use real Austin data to configure 3-4 pilot zones in the H3 zone builder. Set actual ZIP codes, capacity limits, and provider coverage. Verify the zone builder wizard works end-to-end with real geography. | M | 2-3 hrs |
| 026 | Pre-Launch Checklist & Smoke Test | Build a `/admin/launch-readiness` page or checklist document: Stripe webhooks verified, CRON_SECRET set, pg_cron running, zones configured, SKUs calibrated, 3+ providers onboarded, BYOC links working, email delivery confirmed. Green/red status for each. | M | 2-3 hrs |

---

## Dependency Graph

```
PRD-013 (Feature ratings) ──┐
PRD-014 (Seed data audit) ──┼──→ PRD-015 (SKU calibration)
                            │         │
                            │         ▼
                            ├──→ PRD-016 (Interview data entry) ──→ PRD-025 (Zone builder)
                            │                                            │
                            │                                            ▼
                            │                                      PRD-026 (Launch checklist)
                            │
PRD-017 (Seasonal) ─────────┤
PRD-018 (Multi-category) ───┼──→ standalone simulation enhancements
PRD-019 (Provider funnel) ──┤
PRD-020 (Census data) ──────┘

PRD-021 (Plan context) ─────┐
PRD-022 (Design system) ────┼──→ code fixes (independent of calibration)
PRD-023 (Payment tests) ────┘

PRD-024 (Outreach materials) → depends on PRD-015 + PRD-016 (need real economics)
```

### Parallelization Opportunities

- **PRD-013 + PRD-014** — Both are data audits, can run in parallel
- **PRD-017 + PRD-018 + PRD-019** — All simulation enhancements, independent
- **PRD-021 + PRD-022** — Both are code fixes, independent pages
- **PRD-023** — Tests can run alongside any other PRD

---

## Estimated Session Plan

Assuming the same productivity as Session 1 (~12 PRDs addressed, mix of implementation and investigation):

| Block | PRDs | Time | Notes |
|-------|------|------|-------|
| **Start** | Read plan, re-anchor, pull changes | 10 min | |
| **Block 1** | 013 + 014 (parallel) | 1 hr | Quick data cleanup |
| **Block 2** | 015 + 016 | 3 hrs | Admin tooling for provider onboarding |
| **Block 3** | 017 + 018 + 019 | 3 hrs | Simulation enhancements (parallel) |
| **Block 4** | 021 + 022 | 2 hrs | Code fixes from audit |
| **Block 5** | 023 | 2 hrs | Payment test coverage |
| **Block 6** | 024 + 025 + 026 | 3 hrs | Launch readiness |
| **Cleanup** | Archive, doc sync, lessons learned | 30 min | |
| **Total** | 14 PRDs | ~15 hrs | |

If context runs low, prioritize: 013 → 014 → 015 → 017 → 021 → 023 → 026

---

## Success Criteria

This plan is complete when:

1. Feature list has accurate maturity ratings (not all "DONE")
2. Every seed data value has a documented source or "needs interview" flag
3. Admin can enter provider interview data and it calibrates SKU parameters
4. Simulation models seasonal variation and multi-category economics
5. Services catalog shows plan context badges
6. Payment critical paths have unit test coverage
7. A pre-launch checklist exists with green/red status for each requirement
8. 3-4 Austin pilot zones are configured with real ZIP codes

When these conditions hold, the product is ready for real provider outreach.

---

## What This Plan Does NOT Cover

Deferred to Session 3 or beyond:

- **Actual provider interviews** (human task — use the interview guide from the launch playbook)
- **Real-world BYOC testing** (requires onboarded providers)
- **App Store submission** (requires Apple/Google developer accounts)
- **Marketing materials** beyond the provider outreach page
- **Advanced simulation features** (Monte Carlo, geographic visualization)
- **PRD-300 Routing Engine optimization** (65 features, deferred until density demands it)
- **Provider-refers-provider growth loop** (prove BYOC first)
- **Post-cancellation win-back sequences** (need churn data first)

---

## Key Strategic Notes from Session 1

Carry these forward:

1. **Do NOT remove features for MVP.** Fix and harden existing features. AI coding velocity makes completeness feasible.
2. **Investigate before implementing.** Reading actual code before writing PRD fixes saved ~5 PRDs of unnecessary work in Session 1.
3. **The codebase is more mature than audits suggest.** ~5 of 12 "critical" UI/UX findings were data-state artifacts, not code deficiencies.
4. **Provider payout is the #1 economic lever.** The $45-$65/job range is where the negotiation happens.
5. **Single zones don't break even.** Multi-zone amortization is required. Plan for 4 zones minimum.
6. **The uncomfortable question remains:** "Who is the first provider who will migrate their best customers?" The answer is a mid-career landscaper in Austin who spends 30% of their week on admin.
