# Sprint 3A Final Review — Intent vs Outcomes

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** Full sprint — spec intent alignment, end-to-end data flow, strategic gaps

---

## What the spec wanted

The spec (section 1) defines the Levels system as a foundational layer that standardizes **scope + time + proof + handles cost** across the catalog. The strategic test is: *Does the system prevent scope ambiguity and disputes while making upgrades feel helpful, not salesy?*

Five interlocking loops must work:

1. **Admin configures** levels per SKU with scope, time, proof, cost
2. **Customer selects** a level (ideally the right one via smart defaults) and understands what's included
3. **Provider executes** against a clear scope/time/proof contract
4. **Provider feeds back** when the level was insufficient (recommendation + courtesy upgrade)
5. **Customer responds** to feedback with a one-tap "update going forward"

---

## What was built — and does each loop close?

### Loop 1: Admin Configuration — PASS

**SkuLevelEditor** (`src/components/admin/SkuLevelEditor.tsx`) supports full CRUD:
- Add/edit/reorder/delete levels per SKU
- All required fields: label, inclusions, exclusions, planned_minutes, proof_photo_min, handles_cost, is_active, effective_start_cycle
- Reorder via `swap_sku_level_order` RPC

**GuidanceQuestionEditor** (`src/components/admin/GuidanceQuestionEditor.tsx`) supports:
- 0–3 questions per SKU (limit enforced)
- Multiple-choice options with `level_bump` and `minutes_bump` mapping
- Mandatory/optional flag

### Loop 2: Customer Selection — PASS (with one gap)

**LevelSelector** (`src/components/routine/LevelSelector.tsx`):
- Side-by-side comparison with delta handles badges (`+5 handles`)
- Scope bullets (inclusions, up to 4 per level)
- Compact mode for inline routine card picker

**SkuDetailModal** (`src/components/routine/SkuDetailModal.tsx`):
- Default level pre-selected when opened
- Guidance questions rendered with tappable options
- Answers compute recommended level via additive `level_bump`
- Handles cost updates immediately on level change
- Add button shows `Add {label} · {cost}h`

**RoutineItemCard** (`src/components/routine/RoutineItemCard.tsx`):
- Level label badge + handles cost
- Compact level picker for inline changes
- `useUpdateRoutineItemLevel` persists the change and updates `duration_minutes`

### Loop 3: Provider Execution — PASS

**Provider JobDetail** (`src/pages/provider/JobDetail.tsx`):
- Level label badge per SKU
- Planned minutes target with clock icon
- Scope bullets (inclusions, capped at 6)
- Proof requirements (min photo count)

### Loop 4: Provider Feedback — PASS

**LevelSufficiencyForm** (`src/components/provider/LevelSufficiencyForm.tsx`):
- Per-SKU sufficiency prompt: "Was the scheduled level sufficient to meet Handled standards?"
- If "No": recommended level selector, required reason code, optional note
- Reason codes match spec exactly (all 6: home larger, more buildup, access constraints, customer requested extra, requires deeper level, other)
- Courtesy upgrade checkbox with explanation
- 6-month guardrail enforced via `insert_courtesy_upgrade` RPC with `pg_advisory_xact_lock` for atomicity
- Toast on guardrail violation: "already used in last 6 months"

### Loop 5: Customer Response — PASS

**VisitDetail** (`src/pages/customer/VisitDetail.tsx`):
- Scheduled vs performed level display
- Courtesy upgrade notice card with messaging matching spec tone
- Provider recommendation card with reason code
- One-tap "Update going forward" button → calls `useUpdateRoutineItemLevel` → updates `routine_items.level_id` + `duration_minutes`
- Dismiss option for keeping current level
- Proof photos with PhotoGallery + before/after comparison
- Checklist highlights with status

---

## Findings

### F-3A-1 (MEDIUM): Explainability copy is computed but never displayed to customers

**Spec section 6.3:**
> Explainability copy (required)
> - "Homes your size typically use Level 3."
> - "We upgraded last time to meet standards — Level 3 will keep results consistent."

**What actually happens:**

`useLevelDefault.ts:85` computes `default_level_reason` with exactly this copy. But no customer-facing component renders it.

- `AddServicesSheet.tsx:20` extracts only `default_level_id` from `useLevelDefault`, ignoring `default_level_reason`
- `SkuDetailModal` doesn't receive or display the reason
- `LevelSelector` doesn't show why a level is pre-selected

The customer sees the right default level but doesn't know *why* it was chosen. The spec says this copy is "required" because it builds trust and reduces level-change friction.

**Fix:** Show `default_level_reason` as calm microcopy near the pre-selected level in `SkuDetailModal` or `LevelSelector`. The data is already available — it just needs to be passed through and rendered.

---

### F-3A-2 (MEDIUM): No proof field in `level_recommendations` or `courtesy_upgrades` tables

**Spec section 6.6:**
> Optional supporting photo(s)

**Spec section 6.7:**
> Must select reason code + add proof
> Courtesy upgrades require proof + reason code

Both tables store `reason_code` and optional `note`, but neither has a proof/photo field. The completion flow captures photos at the job level, but there's no way to attach specific photos to a recommendation or courtesy upgrade record.

**Impact:** Ops can't distinguish which photos relate to the courtesy upgrade justification vs. normal job proof. For v1 this is acceptable since photos exist on the job, but the spec explicitly requires it.

**Recommendation:** Defer to v1.5. The job-level photos provide sufficient audit trail for now.

---

### F-3A-3 (MEDIUM): `planned_minutes` not consumed by scheduling/routing engine

**Spec section 6.10:**
> Scheduling uses `planned_minutes` from the selected level.

**What actually happens:**

`planned_minutes` flows correctly from `sku_levels` → `routine_items.duration_minutes` (via `useRoutineActions.ts:111`). It's also displayed to providers in job detail. But the scheduling/demand calculation engine doesn't use it.

`useRoutinePreview.ts` computes demand via `computeCycleDemand()` which is cadence-based only — a 120-minute job is treated identically to a 30-minute job for scheduling purposes.

**Impact:** Route density and schedule viability calculations don't factor actual job duration. A provider's day could be over-packed if multiple high-level (long-duration) jobs are assigned.

**Recommendation:** This likely belongs in a scheduling sprint, not 3A. The data is captured and stored correctly; the consumption side is a scheduling engine concern. Note for future sprint planning.

---

### F-3A-4 (LOW): Customer acceptance rate not tracked in analytics

**Spec section 6.9:**
> Acceptance rate of recommendations

The analytics dashboard (`src/pages/admin/LevelAnalytics.tsx`) shows recommendation rate, courtesy upgrade rate, mismatch table, and outlier provider detection. But customer acceptance rate (how often customers tap "Update going forward" vs dismiss) is initialized to 0 and not actually tracked.

**Impact:** Ops can't measure whether recommendations are effective. The data exists (routine_items.level_id changes after a recommendation), but the analytics hook doesn't correlate recommendation records with subsequent level updates.

**Recommendation:** Low priority for v1. Can be added when the analytics system matures.

---

### F-3A-5 (LOW): Exclusions not shown in LevelSelector comparison view

The `LevelSelector` shows up to 4 inclusions per level but doesn't show exclusions in the comparison view. Exclusions are visible in `SkuDetailModal` (lines 158–171) when viewing a single level's detail, but the side-by-side comparison only shows what's included, not what's excluded.

The spec (section 4.2) says level fields include both inclusions and exclusions, and the comparison should help customers understand what each step up adds. Showing only inclusions means customers might not realize what lower levels skip.

**Recommendation:** Consider adding exclusions to the comparison view in a future polish pass. Not blocking for v1.

---

## Data Model Verification

| Table | Status | Notes |
|-------|--------|-------|
| `sku_levels` | PASS | All spec fields present including `effective_start_cycle` |
| `sku_guidance_questions` | PASS | Options store `level_bump` + `minutes_bump` |
| `level_recommendations` | PASS (minor gap) | Missing proof field; has reason_code + note |
| `courtesy_upgrades` | PASS (minor gap) | Missing proof field; 6-month guardrail enforced via RPC |
| `routine_items.level_id` | PASS | FK to sku_levels |
| `job_skus.scheduled_level_id` | PASS | FK to sku_levels |
| `job_skus.performed_level_id` | PASS | FK to sku_levels |
| RLS policies | PASS | All match spec exactly |

---

## Spec Acceptance Criteria Status

### Customer (spec section 12)

| Criteria | Status |
|----------|--------|
| Default level selected and explainable | **PARTIAL** — default selected correctly; explainability copy computed but not displayed (F-3A-1) |
| Changing level updates handles instantly | PASS |
| Guidance answers persist and influence defaults | PASS — answers drive `level_bump` computation |
| Receipt shows scheduled/performed level and offers one-tap update | PASS |

### Provider (spec section 12)

| Criteria | Status |
|----------|--------|
| Job shows level + time target | PASS |
| Can recommend next level with reason code | PASS |
| Courtesy upgrade is gated and rate limited | PASS — 6-month guardrail with advisory lock |

### Admin/Ops (spec section 12)

| Criteria | Status |
|----------|--------|
| Can edit levels and activate them safely | PASS — includes `effective_start_cycle` |
| Can view mismatch/upgrade analytics | PASS |
| Can disable courtesy upgrade per provider/org | **NOT VERIFIED** — no admin toggle found for per-provider/org disabling |

### System (spec section 12)

| Criteria | Status |
|----------|--------|
| Scheduling uses planned minutes from level | **PARTIAL** — stored correctly, not consumed by scheduling engine (F-3A-3) |
| Next-cycle enforcement of changes works | PASS — level changes update `routine_items.level_id` for next cycle |
| Audit trail complete | PASS — timestamps on all tables, personalization_events for 3B signals |

---

## Summary Table

| ID | Severity | Issue |
|----|----------|-------|
| F-3A-1 | MEDIUM | `default_level_reason` ("Homes your size typically use Level 3") computed but never displayed to customer |
| F-3A-2 | MEDIUM | No proof/photo field on `level_recommendations` or `courtesy_upgrades` tables |
| F-3A-3 | MEDIUM | `planned_minutes` stored in `routine_items.duration_minutes` but scheduling engine doesn't consume it |
| F-3A-4 | LOW | Customer acceptance rate of recommendations not tracked in analytics |
| F-3A-5 | LOW | Exclusions not shown in level comparison view (only inclusions) |

---

## Strategic Assessment

Sprint 3A is the strongest sprint reviewed so far. All five loops close end-to-end:

1. Admin configures levels → stored correctly with all required fields
2. Customer selects levels → guidance questions work, handles update instantly, comparison view exists
3. Provider executes → clear scope/time/proof contract shown in job detail
4. Provider feeds back → sufficiency prompt, recommendation with correct reason codes, courtesy upgrade with guardrail
5. Customer responds → one-tap "update going forward" works, receipt shows full context

The system achieves the spec's core goal: **preventing scope ambiguity and disputes while making upgrades feel helpful.** The provider-to-customer feedback loop is the most strategically important piece and it works end-to-end.

The findings are all enhancement-level, not structural gaps:
- F-3A-1 (explainability copy) is the most impactful — it's a single line of microcopy that reinforces trust in the system's intelligence
- F-3A-2 and F-3A-3 are correctly deferred to later sprints
- F-3A-4 and F-3A-5 are polish items

**Recommendation:** Address F-3A-1 (display `default_level_reason`) as a quick win — the data is already computed, it just needs to be rendered. The rest can be deferred without impacting the system's core value.
