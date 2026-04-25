# Batch UX.1 — Trust-copy sweep (MVP scope)

> **Round 64 · between Phase 5 and Phase 6 · MUST-FIX (3/3 promotion, sarah-backlog)**
> **Created:** 2026-04-25
> **Mode:** Quality (production-facing user copy across onboarding + auth + snap + payment)
> **Review:** Medium — 3 parallel lanes + Lane 4 synthesis (sub-agent)

---

## Why

Three consecutive Sarah-persona Tier 5 runs (PRs #28, #31, #33) flagged the same trust-copy gap, with avgTrust trending 3.7 → 3.7 → 3.2 — all below the 5.0 advisory threshold. The 3/3 rule in `docs/testing-strategy.md` §5.9 promoted this to MUST-FIX before Phase 6.

The verbatim finding bundles three asks; this batch addresses **MVP scope**: the "first 5 minutes" surfaces where avgTrust is being measured — onboarding, auth, snap submit, and payment collection. Secondary surfaces (BYOC/BYOP/Issue/Moving) are explicitly deferred to a possible UX.1.1 follow-up after we re-measure.

## Goals

1. Add why-we-ask micro-copy above every data-collection field in the MVP scope.
2. Add reassurance lines on transition destinations (post-submit, post-auth).
3. Add BYOC continuity / self-signup framing line to the onboarding entry surface.
4. Move avgTrust above the 5.0 advisory threshold on the next Sarah run.

## Voice rubric (locked)

**Do:**
- One short sentence per moment. Plain English, no jargon.
- Outcome-stated — what happens next, not what they have to do.
- Confident present tense — *"We match you with…"* not *"We'll try to match you with…"*.
- Specifics over reassurances — *"Held by Stripe. We never store card numbers."* beats *"Your data is safe."*

**Don't:**
- "Please" / "Don't worry" / exclamation marks — all signal nervousness.
- "We'll try" / "We hope" / "Should be" — undermines the "handled" promise.
- Vague reassurances ("safe," "secure," "trusted") without a verifiable specific.
- Meta-copy explaining the form ("Fill out the fields below").

## Patterns

### Pattern A — Why-we-ask micro-copy (above field/group)

Render as a small muted-text helper line directly above the input or input group. Use existing `text-sm text-muted-foreground` token.

| Field | Copy |
|---|---|
| Address (Property step) | Confirms which zone serves your home. |
| Phone (any) | We text you when your pro is on the way. We don't share it. |
| Sqft / sizing (HomeSetup) | Sizes your plan to match the work. |
| Stories / windows / yard (HomeSetup) | Helps us right-size your service plan. |
| Payment (Stripe Elements) | Held by Stripe. We never store card numbers. |
| Email (Auth signup) | Used for receipts and visit recaps. No marketing. |
| Snap photo (SnapSheet) | A pro reviews the photo and matches the right fix. |
| Snap area chip (SnapSheet) | Helps the pro know what to bring. |

### Pattern B — Reassurance at transitions

| Moment | Surface | Copy |
|---|---|---|
| After signup (first auth land) | Onboarding entry / OnboardingWizard intro | You're in. Setting up your home takes about 3 minutes. |
| After Property submitted | top of HomeSetup step | Address confirmed. Now let's size your plan. |
| After Plan picked | top of Subscribe step | Plan locked. Just one step before your first visit. |
| After Subscribe (payment captured) | top of ServiceDay step | Payment in. Pick a service day to wrap up. |
| After Snap submit | SnapSheet success state | We've got your snap. A pro will pick it up — you'll get an update. |

### Pattern C — Origin framing (one-line, top of onboarding)

Detect signup origin from `auth.users.metadata.byoc_invite_id` (or equivalent already-set field on the property/customer row). Render one line at the top of the onboarding wizard:

- **BYOC users:** *Your provider stays the same. Handled Home is the system around them.*
- **Self-signup users:** *We'll match you with a vetted pro in your zone.*

If the origin signal can't be resolved cleanly in this batch (e.g. requires a new join), default to the self-signup framing and log a TODO follow-up — do not block the batch.

## Scope (MVP — 9 files)

| File | Patterns applied | Notes |
|---|---|---|
| `src/pages/customer/onboarding/PropertyStep.tsx` (105 LOC) | A (address) + B (post-submit transition copy at top of next step) | Address-only step today |
| `src/pages/customer/onboarding/HomeSetupStep.tsx` (151 LOC) | A (sqft/stories/windows/yard) + B (top reassurance) | Multiple sliders/inputs |
| `src/pages/customer/onboarding/PlanStep.tsx` (255 LOC) | B (post-pick transition copy) | Variant-resolution flow from Phase 2 |
| `src/pages/customer/onboarding/PlanStepResolved.tsx` (153 LOC) | B (rationale framing) | Already shows rationale; trust copy adds confidence |
| `src/pages/customer/onboarding/SubscribeStep.tsx` (74 LOC) | B (top reassurance — "one step before…") + A (payment is here? if so use Stripe copy) | Payment may live in `FixPaymentPanel` |
| `src/pages/customer/onboarding/ServiceDayStep.tsx` (96 LOC) | B (post-payment land copy) | Final onboarding step |
| `src/pages/AuthPage.tsx` (247 LOC) | A (email) + C (origin framing entry) | Auth landing |
| `src/components/customer/SnapSheet.tsx` (522 LOC) | A (photo + area + description) + B (post-submit success state) | Phase 4 output, biggest file |
| `src/components/plans/FixPaymentPanel.tsx` (128 LOC) | A (Stripe payment) | Card collection panel |

Onboarding-wizard wrapper (`src/pages/customer/OnboardingWizard.tsx`) gets the Pattern C origin-framing line at top; route-detection logic lives there already.

## Out of scope (deferred to UX.1.1 if needed)

- BYOC wizard, BYOP recommendation form, household invite flow.
- Issue reporting (Phase 5 already touched this; if Sarah re-flags after MVP runs we'll cover).
- Moving wizard.
- Provider-side and admin-side surfaces (Sarah persona is customer-only).
- Loading state copy ("Loading…", "Saving…") — not flagged by Sarah; unchanged here.

## Acceptance criteria

- [ ] Every field in the Pattern A table has a helper line in the corresponding file.
- [ ] Every transition in the Pattern B table renders the line on the destination surface.
- [ ] Pattern C origin-framing line renders at the top of `OnboardingWizard` for both BYOC and self-signup paths.
- [ ] Voice rubric: zero matches for `\bPlease\b|Don't worry|We'?ll try|We hope|Should be|safe and secure` in changed lines (`git diff HEAD~1...HEAD --unified=0 | grep '^+' | grep -E '...'`).
- [ ] No bare exclamation marks added in user-visible copy (`git diff` `^+` lines containing `!"` or `!<` checked).
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run build` clean.
- [ ] `npm run lint` clean.
- [ ] Tier 5 (Sarah customer persona) re-runs on the PR; avgTrust ≥ 5.0 OR a clear "trust copy added at X locations" recognition in the report.

## Testing tiers

| Tier | Run? | Notes |
|---|---|---|
| T1 (tsc + build + lint) | ✅ via `/pre-pr` | Mandatory |
| T2 (vitest unit) | — | No logic change; copy-only |
| T3 (smoke scripts) | — | No API change |
| T4 (Playwright E2E) | — | No flow change |
| T5 (Sarah persona) | ✅ recommended | Verifies avgTrust moved above 5.0 |

## Review

**Medium** per CLAUDE.md §5 — copy-only but spans ~9 customer surfaces. Skip Lane 3 (no prior review history on the trust-copy theme to compare against beyond the sarah-backlog itself). 3 agents:

- **Lane 1 (Spec Completeness):** Verify every Pattern A field + Pattern B transition + Pattern C framing in this spec is implemented in the diff.
- **Lane 2 (Bug Scan + Voice Rubric):** Standard bug scan + check changed lines against the voice rubric (no banned phrases, no bare exclamation marks, sentence length).
- **Lane 4 (Synthesis, sub-agent):** Cross-validate Lanes 1 + 2, score, deduplicate.

## Risks + override notes

- **BYOC origin detection** — if the schema makes Pattern C hard to resolve cleanly without a new join, default to the self-signup framing and add a TODO for the conditional. Tag as `[OVERRIDE: pattern-c-default-self-signup — origin signal not resolvable in this batch]` in the commit if applied.
- **Stripe Elements iframe boundary** — Pattern A copy for payment must render *outside* the Stripe iframe. We control the wrapper component, not the iframe contents.
- **Lane 3 skipped** — no prior review findings on trust-copy theme as such; tag `[OVERRIDE: skipped Lane 3 — first batch on this theme]` per the §5 skip rule.

## Batch deliverables checklist

- [ ] 9 files updated with Pattern A/B/C copy per the tables above.
- [ ] `OnboardingWizard.tsx` gets Pattern C line.
- [ ] `git diff` shows additive copy only — no field removals, no flow changes.
- [ ] All gates green.
- [ ] PR opened with Test plan citing T1 + T5.
- [ ] sarah-backlog entry updated to `status: queued-for-batch` → `fixed: <merge-sha>` after merge.
