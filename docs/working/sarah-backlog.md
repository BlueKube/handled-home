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
- **score:** customer avgClarity 4.7 (advisory threshold < 5.0)
- **finding (verbatim):** "Eliminate vague button pairs and clarify single-step forward paths — replace two-button ambiguity ('Continue to Dashboard' vs 'Set up your home'; 'Request New Invite' vs standalone setup) with a single primary action that clearly states the next step. Add supporting text explaining what happens after selection."
- **first seen:** PR #28 (`76846df`)
- **pr_history:** PR #28 (`76846df`)
- **notes:** Triaged as queue (not fix-in-batch) because the finding spans the onboarding wizard AND the BYOC invite-recovery flow — multi-surface pattern. Wait until 8+ button-pair instances accumulate, or the finding repeats on 3+ PRs, before cutting a batch. May fold naturally into Phase 5 5.4/5.5 if those batches touch the same screens.

### transition-trust-copy — 2026-04-24 — Sarah (customer)

- **status:** open
- **theme:** trust-copy
- **role:** customer
- **screen / file:** every form + every error state + every onboarding transition (cross-cutting)
- **metric:** trust
- **score:** customer avgTrust 3.7 (advisory threshold < 5.0)
- **finding (verbatim):** "Add explicit reassurance at every critical transition — inject trust-building copy before forms and error states that directly addresses users' core fear: 'Your [Provider Name] service continues — we're just adding an easier way to manage it online' (for first-time users and skeptical providers) or 'No charges — we're just setting up your account' (for price-sensitive users). Place this above onboarding forms and error screens."
- **first seen:** PR #28 (`76846df`)
- **pr_history:** PR #28 (`76846df`)
- **notes:** Cross-cutting trust-signal pattern. Needs design / product input on copy voice before any single-PR fix. Queue for a UX.N batch alongside button-pair-clarity once enough instances accumulate. The "Your Provider continues / no charges" framing is design-direction-level and should be confirmed with the human before mass copy edits land.

---

## Closed findings

_(None yet. Move entries here once `status: fixed` or `status: dismissed` is set.)_
