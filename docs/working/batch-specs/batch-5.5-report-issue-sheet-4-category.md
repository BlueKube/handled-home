# Batch 5.5 — ReportIssueSheet 4-category rewrite

> **Round:** 64 · **Phase:** 5 · **Size:** Medium
> **Review:** Quality — 3 lanes + Sonnet synthesis (Medium tier per CLAUDE.md §5)
> **Testing tiers:** T1 ✅ · T3 (Playwright auto) · T5 (Sarah auto via CI)
> **Branch:** `feat/round-64-phase-5-batch-5.5-report-issue-sheet`

---

## Problem

`src/components/customer/ReportIssueSheet.tsx` (174 lines) renders a 3-step wizard (reason → details → confirm) with four legacy `reason` values whose labels are vague and operator-confusing: `missed_something`, `damage_concern`, `not_satisfied`, `other`. The Round 64 redesign mandates four **fixed categories** with tailored micro-flows: **Fix didn't hold · Damage · Task skipped · Feedback**. Each category has different requirements (damage mandates a photo; feedback is private text-only to the Handled team, not visible to the provider).

## Goals

- Four top-level category buttons replace the 3-step wizard. One tap selects a category and routes to that category's micro-flow.
- Per-category micro-flows:
  - **Fix didn't hold** — description textarea + optional photo. "Our promise: if we can't fix it, credits come back to your balance."
  - **Damage** — description textarea + **required photo**. Explicit "include a photo of the damage" helper text.
  - **Task skipped** — description textarea + optional photo naming which task was skipped.
  - **Feedback** — private-text-only textarea. No photo field. Framed as "for the Handled team, not your provider — we review every note."
- "Our promise" footer renders at the bottom of the category picker (not per-flow) so users see the credits-back commitment before choosing.
- `customer_issues.category` new nullable column with CHECK constraint on the 4 new values (`fix_didnt_hold`, `damage`, `task_skipped`, `feedback`). Legacy `reason` column preserved and auto-populated from a category→reason mapping so existing consumers (admin dashboard, AI classifier) don't break.
- `support_tickets.category` (already free-form text) receives the new category value.
- Submitting still creates one `customer_issues` row + one linked `support_tickets` row, same shape as today.

## Scope (files)

### New
1. **`supabase/migrations/20260425020000_customer_issues_category.sql`** — one-line ALTER TABLE adding nullable `category text CHECK (category IN ('fix_didnt_hold','damage','task_skipped','feedback'))`. First line: `-- Previous migration: 20260422210000_assign_bkennington_test_user_roles.sql` per CLAUDE.md §11 bootstrap-chain rule.

### Modified
2. **`src/hooks/useCustomerIssues.ts`** — extend `useSubmitCustomerIssue` params to accept `category: VisitIssueCategory` (new exported type). Keep `reason` back-compat by deriving it via a `categoryToReason` helper. Write both `category` and `reason` on insert; pass `category` to the support_tickets row.
3. **`src/components/customer/ReportIssueSheet.tsx`** — full rewrite. 4 category buttons → per-category micro-flow → confirm.
4. **`src/integrations/supabase/types.ts`** — regenerate after migration lands to include the new column type. (Sandbox doesn't have Supabase access token; fall back to `as any` cast in the hook with inline comment pointing at a backlog TODO — matches the existing Round 64 Phase 4 pattern.)
5. **`docs/working/plan.md`** — flip 5.5 row 🟡 then ✅.

## Acceptance criteria

- [ ] Migration file exists, bootstrap-chain comment in place, adds `customer_issues.category` with exact 4-value CHECK constraint.
- [ ] ReportIssueSheet renders 4 top-level category buttons with "Our promise" footer on the picker.
- [ ] Damage category blocks submit until a photo is attached; "Photo required" helper visible.
- [ ] Feedback category renders text-only (no photo upload element).
- [ ] Fix didn't hold + Task skipped categories offer optional photo + the "credits back" promise in-flow.
- [ ] Submitting a "Fix didn't hold" issue creates a `customer_issues` row with `category='fix_didnt_hold'` AND `reason='missed_something'` (legacy mapping).
- [ ] `npx tsc --noEmit` passes; `npm run build` passes.
- [ ] Dismiss / cancel from any step resets state cleanly.
- [ ] Screenshot of the category picker + one micro-flow captured via Playwright milestone (future follow-up, not blocking).

## Out of scope (explicit deferrals)

- **Admin dashboard UI for the new `category` column** — Phase 7 admin tools batch.
- **AI classifier retraining on the new categories** — the existing `support-ai-classify` edge function operates on `customer_note` content, so categorical signal is additive but not required. Will tune when admin dashboard surfaces the new column.
- **Retroactive backfill of `category` on existing `customer_issues` rows** — leave null; legacy `reason` values continue to be the operational source until a future migration.
- **4-category translation of `reason` CHECK constraint** — legacy enum stays, coexists.

## category → legacy reason mapping

| New category | Legacy reason (required to satisfy CHECK constraint) |
|---|---|
| `fix_didnt_hold` | `missed_something` |
| `damage` | `damage_concern` |
| `task_skipped` | `missed_something` |
| `feedback` | `not_satisfied` |

(Both `fix_didnt_hold` and `task_skipped` collapse to `missed_something` in the legacy column — expected, and the new `category` column preserves the distinction for future analytics.)

## Risk / blast radius

- Migration is additive (nullable column + CHECK on that column only). No data migration. Existing rows unaffected. RLS policies untouched.
- `useSubmitCustomerIssue` change is backward-compatible: callers that don't pass `category` still work (`customer_issues.category` null is valid). But the callsite in `VisitDetailComplete.tsx` already goes through the sheet — not a public API.
- Type-regen gap: sandbox lacks a Supabase access token so `src/integrations/supabase/types.ts` stays as-is; the new column requires an `as any` cast on the insert until a post-merge type regen. Document in commit + lessons-learned (same pattern as Round 64 Phase 4 Snap carry-over).

## Review setup

Medium tier, 3 parallel Sonnet lanes + Sonnet synthesis (sub-agent):

- **Lane 1 — Spec Completeness**: every acceptance-criterion item present in the diff. Validate category→reason mapping.
- **Lane 2 — Bug Scan**: look for migration syntax, CHECK constraint typos, `as any` casts that hide real errors, accessibility on the 4 category buttons, photo-required enforcement, feedback-mode text-only rendering.
- **Lane 3 — Historical Context**: `git blame` on ReportIssueSheet.tsx for any prior intent (e.g., the existing `is_required` helper text, the duplicate-key toast). Confirm the support_ticket linkage survives. Check lessons-learned for any prior migration-bootstrap or type-regen issue.
- **Lane 4 — Synthesis**: cross-validate, score, categorize.

Skip Haiku 2nd-opinion (Medium tier default).
