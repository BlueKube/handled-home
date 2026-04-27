# Sarah backlog — queued Tier 5 findings

> **Purpose:** Append-only log of Tier 5 findings that the per-PR triage rule classified as **queue** rather than **fix-in-batch**. The rule itself lives in `docs/testing-strategy.md` §5.9.
>
> **Workflow:** When a PR's Tier 5 status comment surfaces a finding, the in-batch agent applies the §5.9 triage rule. Anything queued lands here. Periodically — typically when a theme accumulates ~8 entries, or when the same finding appears across 3+ PRs — cut a focused UX.N polish batch that fixes all instances via grep.
>
> **Lifecycle:**
> - `open` — newly logged, not yet acted on.
> - `queued-for-batch` — assigned to a specific upcoming batch (note batch ID).
> - `fixed` — resolved by a merged PR (note SHA).
> - `dismissed` — moved to `docs/testing-acceptable-findings.md` with rationale.
>
> **Theme threshold:** Once a `theme:` value reaches **8 entries**, that's the trigger to cut a UX.N batch.
>
> **Promotion rule:** Any finding whose `pr_history:` shows the same finding text on **3+ consecutive PRs** against un-changed code is promoted to MUST-FIX — cut a fix batch immediately regardless of theme size.

---

## Format

```markdown
### <short-slug> — <yyyy-mm-dd> — <persona>

- **status:** open | queued-for-batch | fixed | dismissed
- **theme:** <one-word group, e.g. "button-pair-clarity", "trust-copy", "skeleton-states">
- **role:** customer | provider | admin
- **screen / file:** route or component path the finding is about
- **metric:** clarity | trust | friction (which axis flagged)
- **score:** numeric value (e.g. clarity 4.7)
- **finding (verbatim):** "what Sarah said"
- **first seen:** PR #N (sha)
- **pr_history:** PR #N (sha) — shorthand list, append on repeat
- **notes:** 1-2 sentences of context for the eventual fixer
```

---

## Open findings

### vague-button-pair-clarity — 2026-04-24 — Sarah (customer)

- **status:** open
- **theme:** button-pair-clarity
- **role:** customer
- **screen / file:** onboarding wizard + invite-recovery flow (specific screens TBD on real fixture data)
- **metric:** clarity
- **score:** customer avgClarity 4.7 → 4.3 (PR #49 lowered the score; advisory threshold < 5.0)
- **finding (verbatim):** "Eliminate vague button pairs and clarify single-step forward paths — replace two-button ambiguity ('Continue to Dashboard' vs 'Set up your home'; 'Request New Invite' vs standalone setup) with a single primary action that clearly states the next step. Add supporting text explaining what happens after selection." On PR #49 the same theme reappeared as "Replace all vague button labels and jargon with outcome-driven, benefit-focused copy" with concrete rewrites: "Continue to Dashboard" → "Go to my account"; "Set up your home" → "Request a new invite link"; "Confirms which zone serves your home" → "We'll find the best service team in your area."
- **first seen:** PR #28 (`76846df`)
- **pr_history:** PR #28 (`76846df`) · PR #49 (`e7de1e3`)
- **notes:** Triaged as queue (not fix-in-batch) because the finding spans the onboarding wizard AND the BYOC invite-recovery flow — multi-surface pattern. Now at 2 of 3 promotion-rule occurrences. Phase 7.3 will modify onboarding (adds the "who could you bring?" step) — strong candidate to bundle this microcopy sweep into 7.3 scope. If 7.3 doesn't absorb it and it appears on a 3rd PR, the §5.9 promotion rule fires and a focused fix batch must run.

### loading-state-copy — 2026-04-27 — Sarah (customer)

- **status:** open
- **theme:** loading-copy
- **role:** customer
- **screen / file:** Customer 01 (`src/pages/customer/Dashboard.tsx`) + Customer 04 (an onboarding screen — exact route TBD on fixture data; likely `OnboardingWizard.tsx` or a step within)
- **metric:** friction
- **score:** customer avgFriction 7.4 (advisory threshold > 6.0)
- **finding (verbatim):** "Add explicit loading states with reassuring messaging across Customer 01 and Customer 04 screens — replace bare 'Loading...' text and skeleton placeholders with animated spinners, contextual messages ('Loading your home dashboard...'), and estimated completion time. Keep all loading states under 2 seconds or skip them entirely by pre-loading content."
- **first seen:** PR #49 (`e7de1e3`)
- **pr_history:** PR #49 (`e7de1e3`)
- **notes:** First occurrence. Batch 7.2 (Dashboard growth card) touches Dashboard.tsx but not its loading skeletons; opportunistic catch is possible if the diff is in the same file. Otherwise wait for accumulation per the 8-entry / 3-PR rule.

### measurement-coverage-gap — 2026-04-27 — meta (process)

- **status:** open
- **theme:** measurement-coverage
- **role:** N/A (process)
- **screen / file:** `e2e/avatar-drawer.spec.ts` is the only Tier 5 milestone-capture spec; it covers 7 avatar-drawer screens and was authored in Batch T.4
- **metric:** N/A
- **score:** N/A
- **finding (verbatim):** N/A — process observation
- **first seen:** PR #40 (UX.1 trust-copy)
- **pr_history:** PR #40 (`d1fa15b`) · PR #49 (`e7de1e3`) — ai-judge measured the same 7 drawer screens twice in a row, neither time covering the surfaces the batch actually changed. PRs #51 + #52 didn't run ai-judge at all (Playwright workflow was suppressed by concurrency cancellation on rapid fix-pushes — see lessons-learned).
- **notes:** Closes the loop on the existing `transition-trust-copy` measurement caveat. Until Tier 5 milestone captures land for `BringSomeoneStep`, `PostVisitGrowthCard`, `DashboardGrowthCard`, the new Referrals page restyle, and the onboarding screens (Property/HomeSetup/Plan/Subscribe/ServiceDay), Sarah's avgClarity / avgTrust / avgFriction scores cannot move in response to the actual batches. Tracked as "Add Tier 5 milestone captures…" in `docs/upcoming/TODO.md`. Promotion-rule does NOT fire on this entry — it's a tooling gap, not a code finding.

### transition-trust-copy — 2026-04-24 — Sarah (customer) — ✅ FIXED in PR #40 (`d1fa15b`)

- **status:** **fixed** — Batch UX.1 (PR #40, merged 2026-04-25 at `d1fa15b`)
- **theme:** trust-copy
- **role:** customer
- **screen / file:** every form + every error state + every data-collection field + onboarding transitions (cross-cutting)
- **metric:** trust
- **score:** customer avgTrust trended 3.7 → 3.7 → 3.2 → 3.4 (PR #40 small uptick — see notes below for measurement-coverage gap that explains why 5.0 was not reached on this run)
- **finding (verbatim):** paraphrased across three consecutive PRs — "Add explicit reassurance at every critical transition / Add provider branding + reassurance copy to every screen / Add trust-building context above every data collection field explaining why data is needed and how it protects the user's existing relationship (e.g., 'We'll match you with the right service team—your current provider stays the same' or 'Your address helps us confirm service availability in your area')."
- **first seen:** PR #28 (`76846df`)
- **pr_history:** PR #28 (`76846df`) · PR #31 (`6cf2eaa`) · PR #33 (`76d1e87`) → **fix shipped: PR #40 (`d1fa15b`)**
- **resolution:** Batch UX.1 (MVP scope) added Pattern A (why-we-ask micro-copy) above every data-collection field in onboarding + auth + snap + payment surfaces; Pattern B (transition reassurance) on every step destination; Pattern C (origin framing) on `OnboardingWizard` (self-signup) and `AuthPage` BYOC banner. Voice rubric locked in `docs/working/batch-specs/batch-ux-1-trust-copy-sweep.md`. 10 files, 185 net additions, JSX-only.
- **measurement-coverage caveat:** PR #40's Sarah re-run scored 3.4 (small uptick from 3.2) — the trust-copy work is correctly in code, but the existing milestone capture set (`avatar-drawer.spec.ts` from Batch T.4) doesn't include any of the surfaces UX.1 modified. Sarah measured the same drawer screens as prior runs. Two follow-up TODOs logged in `docs/upcoming/TODO.md`: (1) add milestone captures for onboarding/auth/snap so a future Sarah run can validate the patterns Sarah was asking for, (2) consider provider-name interpolation on customer-facing trust copy as a Round 65 trust-copy follow-up (Sarah's #3 friction in PR #40 explicitly asks for `"Your [Provider Name] service continues"` framing).

---

## Closed findings

The `transition-trust-copy` entry above retains its full history rather than being moved here, since the resolution included a measurement-coverage caveat worth surfacing in the same place as the original finding. Future fully-resolved entries (no caveats) should be moved down here.
