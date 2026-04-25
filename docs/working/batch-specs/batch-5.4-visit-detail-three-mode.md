# Batch 5.4 — VisitDetail three-mode rewrite

> **Round:** 64 · **Phase:** 5 · **Size:** Large
> **Review:** Quality — 5 agents (3 parallel Sonnet lanes + Sonnet synthesis + Haiku second-opinion)
> **Testing tiers:** T1 ✅ · T2 (visitMode pure helper) · T3 (component renders) · T4 (mode-routing E2E spec) · T5 (auto)
> **Branch:** `feat/round-64-phase-5-batch-5.4-visit-detail-three-mode`

---

## Problem

`src/pages/customer/VisitDetail.tsx` (430 lines) is built as a single "completed receipt" page. The Round 64 redesign needs the same route to serve three temporally-distinct modes:

- **Preview** — visit is scheduled and >24h out. User wants to know what's coming.
- **Live** — visit is in-progress (or starting within 1h). User wants real-time status.
- **Complete** — receipt + proof. Today's behavior.

Today the page renders the receipt UI regardless of `job.status` — preview/live look broken (empty receipt). The component is also over the 300-line decompose threshold (`CLAUDE.md` §13).

## Goals

- Same URL (`/customer/visits/:jobId`) renders three distinct UIs based on `job.status` + `job.scheduled_date`.
- Mode detection is a pure function with unit tests.
- VisitDetail.tsx becomes a thin mode-router; each mode lives in its own ≤ 300-line file.
- Type chips (Included / Snap / Bundle / Credits) appear inline on each task in preview/live modes — design + variants land now; real classification logic deferred (see Out of scope).
- Live mode displays an ETA countdown + a mini-map placeholder + progress checklist with current task highlighted + Snap prompt CTA.
- Preview mode displays a hero (date / time-window / provider TBD) + task list with chips + Reschedule + Add-a-Snap CTAs.
- Complete mode preserves all current receipt behavior — pure refactor.
- `screen-flows.md` documents Preview + Live sections.

## Scope (files)

### New
1. **`src/lib/visitMode.ts`** — pure helper:
   - `type VisitMode = "preview" | "live" | "complete"`
   - `getVisitMode(job: { status, scheduled_date }, now = new Date()): VisitMode`
   - Logic:
     - `status === "COMPLETED"` → `"complete"`
     - `status === "IN_PROGRESS"` → `"live"`
     - `status === "SCHEDULED"` AND `scheduled_date <= now + 1h` → `"live"`
     - Otherwise → `"preview"`
   - All other statuses (CANCELLED, etc.) fall through to `"complete"` (closest-existing semantics; document in code).
2. **`src/lib/visitMode.test.ts`** — Vitest table-driven test covering 6+ cases (each branch + a boundary).
3. **`src/components/customer/VisitTypeChip.tsx`** — small inline chip component:
   - 4 variants: `included` (good-soft), `snap` (warm-soft), `bundle` (gold-soft), `credits` (gold-soft).
   - Color tokens via existing semantic palette; no raw Tailwind colors.
   - Props: `type: "included" | "snap" | "bundle" | "credits"`, `className?`.
4. **`src/lib/visitChipType.ts`** — classifier stub:
   - `getChipType(jobSku, context): VisitChipType`
   - Stub: returns `"included"` for everything until backend signals exist.
   - In-code comment links to the open follow-up batch.
5. **`src/components/customer/LiveMiniMap.tsx`** — static placeholder:
   - Bordered card with a simple SVG showing a route line + "Provider en route" pin + house pin.
   - Caption: "Real-time tracking coming soon."
   - No Mapbox / no real GPS data.
6. **`src/pages/customer/VisitDetailPreview.tsx`** — preview-mode component (target ≤ 250 lines).
7. **`src/pages/customer/VisitDetailLive.tsx`** — live-mode component (target ≤ 250 lines).
8. **`src/pages/customer/VisitDetailComplete.tsx`** — complete-mode component (refactor of existing 430-line receipt; target ≤ 300 lines after clean-up).

### Modified
9. **`src/pages/customer/VisitDetail.tsx`** — slim router (≤ 80 lines):
   - Loading + error + not-found states stay here.
   - Calls `getVisitMode(data.job)` and renders the appropriate sub-component.
10. **`docs/screen-flows.md`** — add Preview + Live sections under §11.3 (or as new §11.3a/b).
11. **`docs/working/plan.md`** — flip 5.4 row 🟡 in progress, then ✅ at end.

## Acceptance criteria

- [ ] `getVisitMode` unit test exercises all four branches with explicit boundary timestamps.
- [ ] VisitDetail.tsx reduces from 430 lines to ≤ 80 (router only).
- [ ] Each mode sub-component is ≤ 300 lines.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
- [ ] Existing complete-mode behavior preserved end-to-end (any QuickFeedback / PrivateReview / Share / Referral / ReceiptSuggestions still renders for completed jobs).
- [ ] Preview mode renders without errors when given a SCHEDULED job >24h out (no photos / no checklist / no completed_at).
- [ ] Live mode renders without errors when given an IN_PROGRESS job (no completed_at, possibly no photos yet).
- [ ] All 4 chip variants render correctly (test by manually invoking with each `type` value).
- [ ] LiveMiniMap renders without external deps and with the correct caption.

## Out of scope (explicit deferrals)

- **Real GPS / live ETA backend feed** — `[OVERRIDE: live ETA + mini-map are static placeholders; real provider-location feed deferred to Phase 7 provider tooling]`.
- **Real type-chip classification** — `[OVERRIDE: classifier stub returns "included" for all SKUs; real heuristic — snap_request_id linkage, bundle membership, credit-paid detection — deferred to a backend follow-up batch]`.
- **Inline rating widget refactor (replaces modal)** — `[OVERRIDE: keeps existing PrivateReviewCard pattern in complete mode; inline rating refactor deferred to 5.4.1 follow-up to keep this batch reviewable]`.
- **4-category issue flow** — Batch 5.5 (separate batch per phase plan).
- **Reschedule flow** — uses existing `/customer/appointment/:visitId` route; no changes to that flow.
- **Add-a-Snap CTA** — opens existing SnapSheet via the FAB pattern from Batch 5.1; no changes to SnapSheet itself.

## Risk / blast radius

- High-traffic page; complete-mode behavior must be preserved bit-for-bit. Mitigation: `VisitDetailComplete.tsx` is a near-direct port of the current code.
- Mode detection is pure-function; unit tests catch regression.
- Type chips ship visually but classify-as-Included for everything — this is a deliberate stub. The backlog item ensures we don't forget the real classifier.
- Live mode placeholder must clearly say "coming soon" so users don't expect real tracking.

## Review setup

- **Lane 1 (Sonnet) — Spec Completeness**: every acceptance-criterion item present in the diff.
- **Lane 2 (Sonnet) — Bug Scan**: pure code review on the diff alone. Watch for: leaked complete-mode behavior in preview/live, missing null-safety on `scheduled_date`, time-zone bugs in `getVisitMode`, accessibility on the mini-map SVG.
- **Lane 3 (Sonnet) — Historical Context**: this is the FIRST batch to touch VisitDetail.tsx in many phases — git blame + lessons-learned for prior receipt behavior. Confirm we don't revert any prior fix (e.g., the courtesy-upgrade-update-going-forward button, the PropertyGate behavior).
- **Lane 4 (Sonnet) — Synthesis**: cross-validate; resolve contradictions; produce final scored report.
- **Lane 5 (Haiku) — Second opinion** on Lane 4's output (Large-tier-only).

## Override notes

- Migration bootstrap-chain not relevant (no migrations).
- Mini-map placeholder + chip stub deferrals are documented in the Out-of-scope block above and as `[OVERRIDE]` tags in the relevant commits.
