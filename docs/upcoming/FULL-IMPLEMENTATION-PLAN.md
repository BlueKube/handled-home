# Full Implementation Plan: Rounds 12–61 — Feature Polish to 9/10 Maturity

> **Created:** 2026-04-02
> **Purpose:** Take all 482 features from their current 8/10 maturity to 9/10 or 10/10. No new features. Fix gaps, dead ends, dead code, incorrect math, inconsistent patterns, missing error/loading/empty states, and dark-mode issues. 10 features per round, 50 rounds total.
> **Expected duration:** Multiple days of continuous autonomous execution across many sessions.

---

## Execution Protocol

### Branch Strategy
Each round gets its own branch, chained sequentially:
- Round 12: `polish/round-12-auth-identity`
- Round 13: `polish/round-13-property-profiles`
- ...
- Round 61: `polish/round-61-final-sweep`

**CRITICAL:** Each branch bases off the PREVIOUS round's branch, NOT main.
```
Round 12 branch → created from current HEAD
Round 13 branch → created from Round 12's branch
Round 14 branch → created from Round 13's branch
...
```

At session start: `git fetch origin && git checkout <previous-round-branch> && git pull`
Then: `git checkout -b polish/round-<N>-<name>`

### Session Management
- Each session runs until **actual** context reaches 60%. Use `/context` command — do NOT estimate.
- If a round completes before 60%, start the next round in the same session.
- If 60% is reached mid-round, finish the current batch, push, update Session Handoff, and exit.
- The next session reads Session Handoff and resumes exactly where work stopped.

### Per-Round Workflow
Each round follows the standard workflow from CLAUDE.md:
1. **Read** the round's feature list from this plan
2. **Audit** each feature: read the actual implementation code, not just the feature description
3. **Write batch spec** listing all issues found
4. **Fix** issues in small batches (S size, 1-3 files per batch)
5. **Review** each batch with the standard review system (Small tier: 1 combined reviewer + 1 synthesis)
6. **Push** after every commit
7. **Update** plan.md progress table
8. **Doc sync** if any behavior changed

### What "Polish to 9/10" Means Per Feature
For each feature, verify ALL of the following:
- [ ] Implementation matches the feature description exactly
- [ ] Error states handled (network failure, empty data, auth failure)
- [ ] Loading states present (skeleton or spinner)
- [ ] Empty states present (icon + message when no data)
- [ ] Dark-mode colors correct (no light-mode Tailwind values)
- [ ] No dead code, unused imports, stale comments
- [ ] Component under 300 lines (extract if over)
- [ ] Math/calculations verified against business rules
- [ ] `as any` casts documented or replaced where possible
- [ ] Consistent patterns with similar features elsewhere
- [ ] Accessibility basics (labels, aria attributes on interactive elements)
- [ ] Mobile-responsive (no overflow, no text truncation at standard sizes)

### What NOT To Do
- Do NOT add new features
- Do NOT refactor working patterns into different patterns
- Do NOT add speculative abstractions
- Do NOT change the database schema unless fixing a real bug
- Do NOT touch files outside the round's scope

---

## Round Schedule

### Auth & Identity (Rounds 12–13)

#### Round 12: Authentication & Identity (Features 1–8)
**Branch:** `polish/round-12-auth-identity`
**Features:**
1. Email/password signup and login with session persistence
2. Automatic profile creation and default customer role assignment
3. Multi-role support (customer, provider, admin simultaneously)
4. One-tap role switching without logout
5. Admin Preview Mode (view as any role)
6. "Account Not Configured" safety screen
7. Role-based route protection
8. Bootstrap RPC for partial signup repair

**Polish focus:** Auth edge cases (expired sessions, concurrent logins, role switching with stale cache), error messages, redirect loops, session persistence across app restarts.

#### Round 13: Phone Identity & Account Management (Features 436–441 + account deletion)
**Branch:** `polish/round-13-phone-identity`
**Features:**
436. Phone column on provider_leads
437. Browse page phone field
438. Admin phone display
439. Lead-to-application phone matching trigger
440. Referral attribution phone matching
441. Application flow phone collection
+ Account deletion flow (feature from Round 7)
+ Password reset flow

**Polish focus:** Phone validation, trigger matching correctness, profile phone display consistency, deletion flow completeness.

---

### Property & Home Intelligence (Rounds 14–16)

#### Round 14: Property Profiles (Features 9–16)
**Branch:** `polish/round-14-property-profiles`
**Features:**
9. Property profile (address, access notes, gate codes, pets, parking)
10. Real-time zone coverage indicator
11. Property gate for new customers
12. Coverage Map (10-category self-assessment)
13. Property Sizing Tiers (sqft, yard, windows, stories)
14. Progressive "Complete Home Setup" card
15. `get_property_profile_context` RPC
16. Personalization event logging

**Polish focus:** Form validation, missing field handling, RPC accuracy, coverage map edge cases (all N/A, all "have someone").

#### Round 15: Household Members (Features 442–448)
**Branch:** `polish/round-15-household-members`
**Features:**
442. household_members table
443. Auto-insert owner trigger
444. RLS with SECURITY DEFINER helpers
445. accept_household_invites RPC
446. useHouseholdInvites hook
447. PropertyGate household extension
448. Settings Household section

**Polish focus:** Invite edge cases (user already has account, email mismatch, multiple properties), member removal, owner protection, query key consistency.

#### Round 16: Moving Wizard & Customer Leads (Features 449–463)
**Branch:** `polish/round-16-moving-wizard`
**Features:**
449–456: Moving wizard (transitions table, customer_leads, 4-step wizard, zone check, cancel intercept, Settings button)
457–463: Pipeline completion (auto-cancel cron, customer lead notify, handoff function, admin tab)

**Polish focus:** Zone coverage check accuracy, move date edge cases, customer lead dedup, handoff function error handling, admin display.

---

### Zones & Capacity (Rounds 17–18)

#### Round 17: Zone Management (Features 17–23)
**Branch:** `polish/round-17-zone-management`
**Features:**
17. Region hierarchy
18. ZIP-code-based zone definitions
19. Per-zone capacity settings
20. Zone Health Score (Green/Yellow/Red)
21. Smart adjacent-ZIP suggestions
22. Expansion Signal Dashboard
23. Primary + Backup provider model

**Polish focus:** Zone health calculation accuracy, capacity math, ZIP overlap handling, health score thresholds.

#### Round 18: Zone State Machine & Market Launch (Features 24–26 + 193–197)
**Branch:** `polish/round-18-zone-state-machine`
**Features:**
24–26: Zone state transitions, capacity governance
193–197: Growth autopilot, surface configuration, zone launch readiness

**Polish focus:** State machine transition rules, zone launch checklist accuracy, growth surface config validation.

---

### Service Catalog & SKUs (Rounds 19–21)

#### Round 19: SKU System Core (Features 27–35d)
**Branch:** `polish/round-19-sku-core`
**Features:** SKU definitions, admin CRUD, categories, SKU-zone assignments, descriptions, photos, seasonal flags, admin SKU page, market simulator SKU integration.

**Polish focus:** SKU data integrity, admin form validation, category consistency.

#### Round 20: SKU Levels & Variants (Features 36–43f)
**Branch:** `polish/round-20-sku-levels`
**Features:** Level definitions (L1/L2/L3), handle costs, time estimates, proof requirements, level selection UI, micro-questions, admin Level editor, level analytics, schema enhancements.

**Polish focus:** Level inheritance (NULL = inherit), handle cost calculations, time estimate accuracy, proof requirement enforcement.

#### Round 21: Add-ons, Home Assistant & Seasonal (Features 129–138 + 198–200)
**Branch:** `polish/round-21-addons-seasonal`
**Features:** Add-on drawer, contextual suggestions, one-tap add, Home Assistant category, seasonal service rotation.

**Polish focus:** Add-on eligibility logic, suggestion relevance, seasonal rotation timing.

---

### Subscription & Billing (Rounds 22–26)

#### Round 22: Subscription Engine (Features 44–51)
**Branch:** `polish/round-22-subscription-engine`
**Features:** Plan selection, subscription creation, plan tiers, entitlements, plan changes, subscription status display, Stripe integration.

**Polish focus:** Plan change proration, entitlement calculation, Stripe sync, subscription state machine.

#### Round 23: Handles Currency (Features 52–58)
**Branch:** `polish/round-23-handles-currency`
**Features:** Handle balance, transactions, rollover, consumption tracking, balance display, add-on purchase.

**Polish focus:** Rollover cap (1.5×), balance math, transaction ledger accuracy, negative balance prevention.

#### Round 24: Billing & Payments (Features 105–111)
**Branch:** `polish/round-24-billing-payments`
**Features:** Billing dashboard, payment methods, invoice history, receipt detail, Stripe Elements integration.

**Polish focus:** Payment method CRUD, invoice generation, receipt accuracy, Stripe webhook handling.

#### Round 25: Provider Payouts (Features 112–118)
**Branch:** `polish/round-25-provider-payouts`
**Features:** Payout dashboard, earnings breakdown, period selector, Stripe Connect, payout history.

**Polish focus:** Earnings calculation accuracy, payout timing, Stripe Connect onboarding flow, held earnings display.

#### Round 26: Dunning, Plan Self-Service & Billing Automation (Features 119–128 + 233–237b)
**Branch:** `polish/round-26-dunning-automation`
**Features:** Dunning ladder (5-step), payment recovery, plan self-service (pause/resume/cancel), billing automation (renewal, proration, credit).

**Polish focus:** Dunning step timing, retry logic, pause/resume subscription state, billing cycle edge cases.

---

### Scheduling & Routing (Rounds 27–33)

#### Round 27: Service Day System (Features 59–67)
**Branch:** `polish/round-27-service-days`
**Features:** Service Day assignment, day-of-week patterns, customer preferences, provider schedules.

**Polish focus:** Day assignment algorithm, preference conflicts, schedule display accuracy.

#### Round 28: Routine & Bundle Builder (Features 68–77)
**Branch:** `polish/round-28-routine-builder`
**Features:** Routine draft/activate, bundle recommendations, routine review, 4-week preview.

**Polish focus:** Bundle pricing math, routine activation flow, preview accuracy.

#### Round 29: Routing Engine Sprint 1–3 (Features 261–285)
**Branch:** `polish/round-29-routing-sprint-1-3`
**Features:** Geo-optimization, zone partitioning, drive-time estimation, route sequencing core.

**Polish focus:** Algorithm correctness, coordinate handling, drive-time accuracy.

#### Round 30: Routing Engine Sprint 4–6 (Features 286–305)
**Branch:** `polish/round-30-routing-sprint-4-6`
**Features:** Provider assignment, capacity balancing, multi-zone routing, schedule optimization.

**Polish focus:** Assignment fairness, capacity overflow handling, cross-zone routing.

#### Round 31: Routing Engine Sprint 7–9 (Features 306–325)
**Branch:** `polish/round-31-routing-sprint-7-9`
**Features:** Route visualization, admin controls, exception handling, performance monitoring.

**Polish focus:** Map rendering, admin override flows, scheduling exception recovery.

#### Round 32: Route Optimization & Scheduling Exceptions (Features 95–98 + scheduling exceptions)
**Branch:** `polish/round-32-route-optimization`
**Features:** Route optimization display, provider route cards, scheduling exception handling.

**Polish focus:** Route card accuracy, exception recovery flows.

#### Round 33: Automation Engine (Features 224–232)
**Branch:** `polish/round-33-automation-engine`
**Features:** Job assignment automation, visit scheduling, capacity management, auto-dispatch.

**Polish focus:** Automation rule evaluation, edge cases in auto-dispatch.

---

### Jobs & Provider Workflow (Rounds 34–37)

#### Round 34: Job Execution (Features 83–90)
**Branch:** `polish/round-34-job-execution`
**Features:** Job list, job detail, check-in/out, scope display, time targets, job status tracking.

**Polish focus:** Job state machine, check-in validation, scope display accuracy.

#### Round 35: Provider Day & Route (Features 91–94)
**Branch:** `polish/round-35-provider-day`
**Features:** Today's route card, next stop navigation, stop counter, daily earnings recap.

**Polish focus:** Route progress tracking, earnings calculation, navigation links.

#### Round 36: Photo Proof & Receipts (Features 99–104)
**Branch:** `polish/round-36-photo-proof`
**Features:** Photo capture, before/after, checklist items, Handled Receipt, proof compliance.

**Polish focus:** Photo upload reliability, checklist completion validation, receipt generation.

#### Round 37: Provider Insights & Quality (Features 163–170 + 171–173 + 216–218)
**Branch:** `polish/round-37-provider-quality`
**Features:** Quality score, performance metrics, rating display, trend history, coaching cues, provider insights.

**Polish focus:** Score calculation accuracy, trend visualization, coaching cue relevance.

---

### Onboarding (Rounds 38–39)

#### Round 38: Customer Onboarding Wizard (Features 78–82)
**Branch:** `polish/round-38-customer-onboarding`
**Features:** Multi-step onboarding, property setup, plan selection, payment, first service.

**Polish focus:** Step validation, back-navigation, payment integration, edge cases (no zones available, no plans).

#### Round 39: Provider Onboarding & BYOC Wizard (Features 326–342 + provider onboarding)
**Branch:** `polish/round-39-provider-onboarding`
**Features:** Provider 6-step onboarding, BYOC wizard, invite link creation, activation tracking.

**Polish focus:** Onboarding step validation, BYOC invite flow, activation attribution.

---

### Growth & Referrals (Rounds 40–43)

#### Round 40: Referrals & Attribution (Features 178–183)
**Branch:** `polish/round-40-referrals`
**Features:** Referral code generation, share links, attribution tracking, reward tiers, referral dashboard.

**Polish focus:** Attribution accuracy, reward calculation, share link generation.

#### Round 41: BYOC & Founding Partners (Features 184–192)
**Branch:** `polish/round-41-byoc-founding`
**Features:** BYOC invite links, activation tracking, bonus ledger, Founding Partner program.

**Polish focus:** Bonus calculation accuracy, activation flow, ledger reconciliation.

#### Round 42: BYOP & Provider Browse (Features 198b–198i + 411–425)
**Branch:** `polish/round-42-byop-browse`
**Features:** BYOP recommendations, provider browse page, lead capture, admin lead pipeline, zone notifications.

**Polish focus:** BYOP workflow, browse page conversion, lead dedup, notification accuracy.

#### Round 43: Provider Funnel Hardening (Features 426–435)
**Branch:** `polish/round-43-funnel-hardening`
**Features:** Unique email constraint, lead-application linking, category gaps RPC, auto-notify trigger, referral attribution, progressive recognition.

**Polish focus:** Trigger reliability, RPC accuracy, matching correctness.

---

### Support & Notifications (Rounds 44–46)

#### Round 44: Support & Disputes (Features 139–149)
**Branch:** `polish/round-44-support-disputes`
**Features:** Ticket creation, ticket detail, SLA timers, dispute evidence, support policies, macros.

**Polish focus:** SLA calculation, evidence spine display, macro application, ticket state machine.

#### Round 45: Notifications & Messaging (Features 150–162)
**Branch:** `polish/round-45-notifications`
**Features:** Push notifications, in-app inbox, notification preferences, event bus, template system, APNs integration.

**Polish focus:** Delivery reliability, preference enforcement, template rendering, APNs token handling.

#### Round 46: AI Intelligence & Property Health (Features 174–177 + 201–206)
**Branch:** `polish/round-46-ai-property-health`
**Features:** Property health score, maintenance recommendations, AI suggestions, smart defaults.

**Polish focus:** Score calculation, recommendation relevance, suggestion timing.

---

### Admin & Ops (Rounds 47–51)

#### Round 47: Ops Cockpit & Analytics (Features 207–217b)
**Branch:** `polish/round-47-ops-cockpit`
**Features:** Ops dashboard, capacity heatmap, proof compliance, issue rate, KPI cards, health scoring.

**Polish focus:** KPI calculation accuracy, heatmap rendering, threshold calibration.

#### Round 48: Admin Controls & Governance (Features 219–223b + 238–240)
**Branch:** `polish/round-48-admin-governance`
**Features:** Audit log, feature toggles, admin settings, exception management, control room.

**Polish focus:** Audit log completeness, toggle behavior, exception workflow.

#### Round 49: SOPs & Playbooks (Features 244–249b)
**Branch:** `polish/round-49-sops-playbooks`
**Features:** Interactive SOP runner, step checkoff, playbook library, decision trees.

**Polish focus:** SOP step completion, branching logic, timing tracking.

#### Round 50: Admin Academy (Features 392–410)
**Branch:** `polish/round-50-academy`
**Features:** 16 training modules, module navigation, progress tracking.

**Polish focus:** Content accuracy (cross-reference against actual codebase), navigation flow, module completeness.

#### Round 51: Market Simulator & Calibration (Features 348b–348e + calibration)
**Branch:** `polish/round-51-simulator`
**Features:** Market simulator, scenario presets, SKU calibration, validation tools.

**Polish focus:** Simulation math accuracy, preset values, calibration UI.

---

### Infrastructure & Platform (Rounds 52–55)

#### Round 52: Edge Functions & Cron (Features 241–243b + 37 edge functions)
**Branch:** `polish/round-52-edge-functions`
**Features:** All edge functions, CORS, auth patterns, cron health.

**Polish focus:** Auth guard consistency, error handling, CORS headers, function-by-function audit.

#### Round 53: Platform Infrastructure (Features 250–260)
**Branch:** `polish/round-53-platform-infra`
**Features:** Code splitting, query optimization, Capacitor config, iOS project, deep links.

**Polish focus:** Bundle size, lazy loading coverage, build warnings, iOS config.

#### Round 54: E2E Testing & Synthetic Review (Features 340–348)
**Branch:** `polish/round-54-testing`
**Features:** Test infrastructure, synthetic UX review, mock setup.

**Polish focus:** Test coverage gaps, mock accuracy, test reliability.

#### Round 55: App Store & Legal (Features from Round 7)
**Branch:** `polish/round-55-appstore-legal`
**Features:** Privacy policy, terms of service, account deletion, browse-first experience.

**Polish focus:** Legal content accuracy, deletion flow completeness, public page accessibility.

---

### Design & UX (Rounds 56–60)

#### Round 56: Simplicity by Design (Features 349–358)
**Branch:** `polish/round-56-simplicity`
**Features:** Navigation simplification, information density, progressive disclosure.

**Polish focus:** Navigation consistency, screen density on mobile, progressive disclosure patterns.

#### Round 57: UX Value Proposition (Features 359–366)
**Branch:** `polish/round-57-ux-value`
**Features:** Bundle savings display, first service celebration, provider visibility, home timeline, social proof.

**Polish focus:** Savings calculation accuracy, celebration trigger, timeline completeness.

#### Round 58: Design System Conformance (Features 367–375)
**Branch:** `polish/round-58-design-system`
**Features:** Color tokens, typography, spacing, component specs, accessibility.

**Polish focus:** Dark-mode audit (every screen), color token consistency, accessibility labels.

#### Round 59: Screen-Flows Gap Closure (Features 377–391)
**Branch:** `polish/round-59-gap-closure`
**Features:** Missing screens, incomplete flows, dead-end states.

**Polish focus:** Every screen has all states (loading, empty, error, data), no orphaned navigation.

#### Round 60: Cross-Cutting Polish (no specific features)
**Branch:** `polish/round-60-cross-cutting`
**Scope:** Global sweep for:
- Unused imports across all files
- Dead code (unreachable branches, commented-out code)
- Console.log statements left in production code
- Inconsistent error handling patterns
- Type safety improvements (reduce `as any` where possible)
- Component decomposition (extract >300 line components)

---

### Final (Round 61)

#### Round 61: Final Verification & Doc Sync
**Branch:** `polish/round-61-final-sweep`
**Scope:**
- Re-read entire feature list, verify every feature is 9/10 or 10/10
- Update feature-list.md with new maturity ratings
- Final doc sync across all 6 core docs
- Update lessons-learned.md
- Create final PR to main

---

## Success Criteria

1. Every feature in feature-list.md is rated 9/10 or 10/10
2. `npm run build` produces zero warnings from application code
3. `npx tsc --noEmit` passes with zero errors
4. No dead code, unused imports, or stale comments
5. All error/loading/empty states present on every screen
6. Dark-mode audit passes on every screen
7. All math verified (handles, billing, payouts, routing)
8. All `as any` casts documented with reason or replaced
9. All components under 300 lines
10. All academy content matches actual codebase behavior
