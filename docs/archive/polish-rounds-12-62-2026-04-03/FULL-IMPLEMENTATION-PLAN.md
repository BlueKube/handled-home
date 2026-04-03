# Full Implementation Plan: Round 62 — Feature Completion & Hardening

> **Created:** 2026-04-02
> **Purpose:** Bring all remaining 7/10-and-below features to 9/10. Fold SOPs into Academy. Fix admin mobile menu. Harden edge function security. Defer confusion detector (feature #84).
> **Review tier:** Bumped up one level from default (Medium→Large for multi-file, Small→Medium for single-file). New features need more redundant review.

---

## Execution Protocol

### Branch Strategy
Single branch for this round: `claude/polish-planned-features-l9XIY` (continuing current branch).

### Review Tier Override
Per user instruction, all batches bump up one review tier:
- **Micro → Small** (1 combined reviewer + 1 synthesis)
- **Small → Medium** (3 parallel lanes + 1 synthesis)
- **Medium → Large** (3 parallel lanes + 1 synthesis + 1 Haiku second opinion)

### What This Round Does
- Implements missing functionality for features at 5-7/10
- Folds 6 SOP features into existing Academy training modules
- Fixes admin mobile menu/logout bug
- Fixes edge function auth gaps (security)
- Removes standalone SOP section from feature list

### What This Round Does NOT Do
- Feature #84 (confusion detector) — DEFERRED per human decision
- Feature #247 (admin change requests at 5/10) — complex workflow, defer unless simple
- New features not already in the feature list

---

## Phase 1: Admin Mobile Menu & Security (Quick Wins)

### Batch 1: Admin mobile hamburger menu + logout
**Size:** Small → Medium review
**Problem:** On mobile, admin has no way to open sidebar or log out. The `SidebarProvider` + `SidebarTrigger` works on desktop but the sidebar slides off-screen on mobile with no visible hamburger trigger.
**Fix:**
- Add mobile-visible hamburger trigger in `AdminCommandBar`
- Add logout button + role switcher to bottom of `AdminSidebar`
- Ensure sidebar overlays on mobile (Sheet pattern) vs persistent on desktop
**Files:** `src/components/admin/AdminShell.tsx`

### Batch 2: Edge function auth hardening
**Size:** Small → Medium review
**Problem:** 4 edge functions have auth gaps logged in TODO.md:
- `offer-appointment-windows`: NO auth at all
- `backfill-property-zones`, `commit-zones`, `generate-zones`: JWT validated but no admin role check
**Fix:** Add `requireUserJwt`/`requireAdminJwt` from `_shared/auth.ts`
**Files:** 4 files in `supabase/functions/`

---

## Phase 2: Support & Dispute Resolution Engine

### Batch 3: Guided Resolver flow (#150, #152, #155)
**Size:** Medium → Large review
**Problem:** Self-resolution, guided resolver, and evidence replay are at 7/10 — the flows exist but have gaps in category-specific resolution logic and evidence presentation.
**Audit first, then fix:**
- #150: Self-resolution target — check if the auto-resolve path is wired end-to-end
- #152: Guided Resolver — verify category → evidence → offer → accept flow completeness
- #155: Evidence replay — ensure photos + checklist + time-on-site render correctly
**Files:** `src/pages/customer/SupportNew.tsx`, `src/components/customer/GuidedResolver.tsx`, evidence components

### Batch 4: Policy engine + duplicate suppression + chargeback (#153, #156, #157)
**Size:** Medium → Large review
- #153: Policy engine 5-level precedence — verify cascade logic
- #156: Chargeback intercept at 6/10 — add proof display + credit off-ramps
- #157: Duplicate ticket suppression — verify second-attempt linking
**Files:** Support hooks, policy components, ticket creation flow

---

## Phase 3: Automation Engine Gaps

### Batch 5: Auto-assign + no-show detection (#250, #251)
**Size:** Small → Medium review
- #250: Auto-assign jobs — verify primary→backup fallback + explainability
- #251: No-show detection — verify hourly check + auto-reassign + notification
**Files:** Edge functions or hooks in `src/hooks/useAssignment*`

### Batch 6: SLA enforcement + auto-flag/suspend (#254, #255)
**Size:** Small → Medium review
- #254: SLA enforcement — verify 4-level ladder + action generation
- #255: Auto-flag/suspend — verify RED status detection + suspension trigger
**Files:** Automation hooks, admin provider pages

### Batch 7: Auto-promote backup + weather mode (#256, #257)
**Size:** Small → Medium review
- #256: Auto-promote at 5/10 — may need new implementation
- #257: Weather mode at 5/10 — verify WeatherAPI integration + admin approval flow
**Files:** Edge functions, admin controls

---

## Phase 4: Billing Automation Gaps

### Batch 8: Invoice generation + dunning + payout runs (#261, #262, #266)
**Size:** Medium → Large review
- #261: Automated invoice generation at 7/10 — verify cycle-based idempotency
- #262: Automated dunning at 6/10 — verify 5-step escalation
- #266: Weekly payout runs at 6/10 — verify threshold + rollover
**Files:** Edge functions in `supabase/functions/`, admin billing pages

### Batch 9: Customer credits (#119)
**Size:** Small → Medium review
- #119: Customer credits at 7/10 — verify tier system + auto-application
**Files:** Credit components, billing hooks

---

## Phase 5: Ops Cockpit & Analytics Gaps

### Batch 10: Business health gauges + risk alerts (#235, #239, #240)
**Size:** Medium → Large review
- #235: Business Health gauges at 7/10 — verify threshold indicators
- #239: Risk Alerts at 7/10 — verify severity + deep links
- #240: Loss Leader review at 6/10 — verify profitability table + cohort cards
**Files:** `src/pages/admin/OpsCockpit.tsx`, `src/pages/admin/Reports.tsx`

---

## Phase 6: SOPs → Academy Consolidation

### Batch 11: Fold SOPs into Academy + remove standalone section
**Size:** Small → Medium review
**Problem:** 6 SOP features (#275-#280) at 3/10 are stub playbooks. The Academy already has an "SOPs & Playbooks" training module. Fold the SOP content into enriched Academy modules and remove the standalone Playbooks page.
**Fix:**
- Enrich `src/constants/academy/sops-playbooks.ts` with the 6 SOP procedures as interactive training content
- Remove or redirect `/admin/playbooks` route
- Remove Playbooks nav item from AdminShell
- Update feature list: mark SOPs as consolidated into Academy
**Files:** `sops-playbooks.ts`, `AdminShell.tsx`, `App.tsx`

---

## Phase 7: Remaining Polish

### Batch 12: Push notifications (#167)
**Size:** Small → Medium review
- #167: Push notification pipeline at 7/10 — verify Capacitor + FCM/APNs integration
**Files:** `src/hooks/useDeviceToken.ts`, notification edge functions

### Batch 13: WCAG AA accessibility + admin city launch (#287, #402)
**Size:** Small → Medium review
- #287: WCAG AA at 6/10 — audit focus states, contrast ratios, semantic headings
- #402: Admin city launch at 6/10 — verify Launch Readiness → zone creation flow timing
**Files:** Global CSS, launch readiness components

### Batch 14: Deno integration tests (#274)
**Size:** Micro → Small review
- #274: Billing edge function tests at 7/10 — expand test coverage
**Files:** `supabase/functions/**/test*`

---

## Deferred Features (Not in Scope)
- **#84**: Confusion detector (1/10) — deferred per human decision
- **#247**: Admin change request system (5/10) — complex workflow, defer to future round
- **#395, #399**: No calendar browsing / One CTA per screen (7/10) — design principles, not code features
- **#422**: Provider Experience Auto-Evaluator (7/10) — scoring harness, defer to quality round

---

## Success Criteria
1. All features at 7/10 or below (except deferred) reach 9/10
2. SOPs folded into Academy; standalone Playbooks page removed
3. Admin mobile menu works (hamburger + logout)
4. Edge function auth gaps closed
5. `npm run build` zero warnings from application code
6. `npx tsc --noEmit` zero errors
