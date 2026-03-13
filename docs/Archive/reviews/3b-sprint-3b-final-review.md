# Sprint 3B Final Review — Intent vs Outcomes

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** Full sprint — spec intent alignment, end-to-end data flow, strategic gaps

---

## What the spec wanted

The spec's executive summary (section 0) defines 3B as the "household intelligence layer" that makes the app feel like an operating system, not a catalog. Three things must work:

1. **Coverage Map** → "What's already handled at this home?" → suppresses irrelevant services
2. **Property Sizing** → "How big is the job?" → smarter level defaults
3. **Personalization Signals** → normalized API powering both of the above

The strategic test: *Does the system feel intelligent rather than generic?*

---

## What was built — and does it work end-to-end?

### Data Collection → Storage: PASS

Both collection flows work correctly:
- Coverage Map (`/customer/coverage-map`) saves to `property_coverage` via `usePropertyCoverage`
- Property Sizing (`/customer/property-sizing`) saves to `property_signals` via `usePropertySignals`
- Both support `?return=` navigation with path validation
- Both are editable from More → Property → Home Setup
- Progressive completion card (`HomeSetupCard`) renders on dashboard when incomplete

### Storage → API: PASS

`get_property_profile_context` RPC correctly reads both tables and computes:
- `suppressed_categories` (NA)
- `eligible_categories` (NONE + SELF/high-pain + PROVIDER/switch-intent)
- `high_confidence_upsells` (NONE + SELF/high-pain)
- `switch_candidates` (PROVIDER + OPEN_NOW/OPEN_LATER)

### API → UI Behavior: PARTIAL

This is where the gaps are. The RPC computes rich signals but the frontend only consumes one of them.

---

## Findings

### F-FINAL-1 (HIGH): `eligible_categories` computed but never used — SELF/PROVIDER filtering is not what the spec describes

**Spec section 5.1:**
> - If coverage = **SELF** → suggest only "high-pain chores" categories
> - If coverage = **PROVIDER** → allow suggestions only as soft switch prompts, not aggressive

**What actually happens:**

The RPC computes `eligible_categories` and `suppressed_categories` as separate lists. The frontend (`useCategoryEligibility` → `AddServicesSheet`) only checks `suppressed_categories` (NA). This means:

| Coverage Status | High-Pain? | In `eligible`? | In `suppressed`? | Shown in AddServices? | Spec says |
|----------------|-----------|----------------|-------------------|----------------------|-----------|
| NA | any | no | **yes** | **no** | correct — never suggest |
| NONE | any | yes | no | yes | correct — strongest suggestion |
| SELF | yes | yes | no | yes | correct — suggest high-pain |
| SELF | **no** | **no** | **no** | **yes** | **WRONG — should suppress non-high-pain SELF** |
| PROVIDER | switch=OPEN | yes | no | yes | partially correct (no "soft" UX) |
| PROVIDER | switch=NOT_OPEN | **no** | **no** | **yes** | **WRONG — should not suggest** |
| PROVIDER | switch=null | **no** | **no** | **yes** | **WRONG — should not suggest** |

The RPC does the hard work of computing eligible vs suppressed, but the frontend ignores `eligible_categories` and only uses `suppressed_categories` as a blocklist. Categories that are *neither* eligible *nor* suppressed (SELF/non-high-pain, PROVIDER/NOT_OPEN) slip through.

**Fix:** The AddServicesSheet filter should use `eligible_categories` as an allowlist (when coverage data exists) rather than only using `suppressed_categories` as a blocklist. Or: the RPC should add non-eligible, non-suppressed categories to the suppressed list. The allowlist approach is more correct since categories without coverage data should still be shown.

**Impact:** A customer who marks "House Cleaning" as SELF (i.e., "I do it myself, it's not high-pain") still sees house cleaning SKUs in AddServices. A customer who marks "Lawn" as PROVIDER with switch_intent = NOT_OPEN still sees lawn SKUs. This directly contradicts the spec's "don't show irrelevant services" intent.

---

### F-FINAL-2 (HIGH): Onboarding integration (3B-05) is not implemented — the primary capture mode is missing

**Spec section 4.1:**
> **Mode A — Onboarding (preferred):**
> After property profile is created, show a 2-step "Make recommendations smarter" flow:
> 1. What's already handled? (Coverage Map)
> 2. Home size basics (Sizing)

**Status:** 3B-05 is the only unchecked item in tasks.md. The `OnboardingWizard` steps are: property → zone_check → plan → subscribe → service_day → routine → complete. Coverage Map and Property Sizing are not in this flow.

**What exists instead:** Mode B (progressive completion) works — the `HomeSetupCard` shows on the dashboard. But Mode A was marked as "preferred" in the spec because:
- Onboarding is the highest-intent moment
- Completion rates drop dramatically after onboarding
- Personalization signals collected during onboarding immediately influence the first AddServices experience

**This is a P0 task that was never done.** The infrastructure is ready (both screens exist, hooks work, return-navigation works). The missing piece is adding two steps to `ONBOARDING_STEPS` in `OnboardingWizard.tsx` and creating the corresponding step components.

---

### F-FINAL-3 (MEDIUM): `eligible_categories`, `switchCandidates`, and `highConfidenceUpsells` are exported from `useCategoryEligibility` but consumed nowhere

`useCategoryEligibility.ts:25-27`:
```ts
eligibleCategories: context?.computed?.eligible_categories ?? [],
switchCandidates: context?.computed?.switch_candidates ?? [],
highConfidenceUpsells: context?.computed?.high_confidence_upsells ?? [],
```

These are returned from the hook but no component destructures or uses them. The spec envisions these powering:
- Prioritized ordering in the add-service drawer (section 5.1)
- "Soft switch prompts" for PROVIDER categories (section 5.1)
- "Start here" emphasis for NONE categories (section 5.1)

This is partially expected — section 8 says the API "becomes the backbone for 3C" — but the data is already available and the AddServicesSheet already renders SKUs in groups. The switch candidates and upsell signals could at minimum influence sort order within groups.

**Recommendation:** Acceptable to defer to 3C, but document that the data is ready for consumption. If 3C is far off, consider at least sorting `eligible_categories` to the top of the AddServicesSheet.

---

### F-FINAL-4 (MEDIUM): Admin "last updated timestamps" still missing (carried from P6-F1)

Spec section 7.1 and 10.3 both require timestamps. Both tables have `updated_at`. The admin hook doesn't fetch it and the card doesn't show it. Noted in Phase 6 review but not addressed.

---

### F-FINAL-5 (LOW): No "setup completion" prompt card from More tab (spec section 4.4 Mode B)

Spec section 4.1 Mode B:
> A checklist card on **Home or More → Property**: "Complete Home Setup (30 seconds)"

The `HomeSetupCard` appears on the Dashboard (Home). It does NOT appear on the More tab or the Property page itself. The Property page has the `HomeSetupSection` (Phase 4) which shows links with checkmarks, but that's a permanent section — not a dismissible prompt card that disappears when complete. This partially satisfies the spec but the More tab has no prompt.

Minor gap — the dashboard card covers the main use case.

---

## End-to-End Data Flow Verification

| Flow | Status | Notes |
|------|--------|-------|
| Customer fills Coverage Map → `property_coverage` | PASS | Upsert with validation trigger |
| Customer fills Property Sizing → `property_signals` | PASS | Upsert with tier validation |
| Save → `personalization_events` logged | PASS | completed/updated distinction with completion_pct |
| `get_property_profile_context` reads both tables | PASS | Computes eligible/suppressed/upsells/switch |
| `usePropertyProfileContext` → `useCategoryEligibility` | PASS | 5-min staleTime, memoized Set |
| `useCategoryEligibility` → `AddServicesSheet` filtering | **PARTIAL** | Only uses suppressed (NA), ignores eligible (F-FINAL-1) |
| `usePropertyProfileContext` → `useLevelDefault` | PASS | Reads sizing tiers, bumps levels |
| `useLevelDefault` → `AddServicesSheet` level selection | PASS | Returns default_level_id with reason |
| Admin → `useAdminPropertyProfile` → `AdminPropertyProfileCard` | PASS | Direct table queries, no timestamps |
| Coverage/Sizing → Dashboard `HomeSetupCard` | PASS | Shows incomplete steps |
| Coverage/Sizing → Onboarding flow | **FAIL** | 3B-05 not implemented |

---

## Spec Acceptance Criteria Status

### 10.1 Customer

| Criteria | Status |
|----------|--------|
| Customer can complete Coverage Map in < 60 seconds | PASS — segmented controls, no extra screens |
| Customer can complete Property Sizing in < 30 seconds | PASS — 4 tier selectors, single save |
| Customer can edit later from More → Property → Home Setup | PASS — HomeSetupSection with links |
| If customer sets Pool=NA, pool services are suppressed in eligible list | **PARTIAL** — suppressed in RPC's `suppressed_categories`, but SELF non-high-pain and PROVIDER/NOT_OPEN categories leak through (F-FINAL-1). Pool=NA specifically works because it's NA. |

### 10.2 System / Integration

| Criteria | Status |
|----------|--------|
| `get_property_profile_context` returns consistent payload | PASS |
| Level default engine accesses sizing tiers | PASS |
| Level default engine returns default level + reason string | PASS |
| Data is saved per property and isolated correctly by RLS | PASS — owner + admin policies on both tables |

### 10.3 Admin/Ops

| Criteria | Status |
|----------|--------|
| Admin can view property coverage + sizing on property detail | PASS — AdminPropertyProfileCard on JobDetail |
| Audit trail exists for updates (timestamps) | **PARTIAL** — timestamps exist in DB, not surfaced in UI |

---

## Summary Table

| ID | Severity | Issue |
|----|----------|-------|
| F-FINAL-1 | HIGH | Frontend only uses `suppressed_categories` (NA). SELF/non-high-pain and PROVIDER/NOT_OPEN categories not filtered — contradicts spec section 5.1 |
| F-FINAL-2 | HIGH | 3B-05 (onboarding integration) not implemented — the spec's "preferred" capture mode is missing |
| F-FINAL-3 | MEDIUM | `eligibleCategories`, `switchCandidates`, `highConfidenceUpsells` exported but never consumed |
| F-FINAL-4 | MEDIUM | Admin card doesn't show `updated_at` timestamps (spec 7.1, 10.3) |
| F-FINAL-5 | LOW | No progressive completion prompt on More tab (spec 4.1 Mode B) |

---

## Strategic Assessment

The sprint built the **infrastructure** correctly — tables, RPC, hooks, UI screens. The data model is sound and the RPC's eligibility logic matches the spec's rules. The gap is in the **last mile of consumption**:

1. The RPC computes rich eligibility signals. The frontend only uses the simplest one (suppressed = NA).
2. The onboarding flow — the highest-leverage moment for data collection — doesn't include coverage/sizing.

If these two gaps are closed, the system delivers on the spec's promise: "the app feels personalized to my home, not generic." Without them, the intelligence layer is built but not fully activated.

**Recommendation:** Fix F-FINAL-1 (filter logic) and F-FINAL-2 (onboarding integration) before considering 3B complete. F-FINAL-1 is a frontend-only change (use `eligible_categories` as allowlist when coverage data exists). F-FINAL-2 requires adding two steps to the onboarding wizard but the screens already exist.
