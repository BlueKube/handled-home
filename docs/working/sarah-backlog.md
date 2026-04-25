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

### transition-trust-copy — 2026-04-24 — Sarah (customer) — 🛑 PROMOTED TO MUST-FIX (3/3 rule)

- **status:** **promoted-to-must-fix** (3-strikes rule triggered 2026-04-25 post-PR #33)
- **theme:** trust-copy
- **role:** customer
- **screen / file:** every form + every error state + every data-collection field + onboarding transitions (cross-cutting)
- **metric:** trust
- **score:** customer avgTrust trended 3.7 → 3.7 → 3.2 — all three runs below 5.0 advisory
- **finding (verbatim):** paraphrased across three consecutive PRs — "Add explicit reassurance at every critical transition / Add provider branding + reassurance copy to every screen / Add trust-building context above every data collection field explaining why data is needed and how it protects the user's existing relationship (e.g., 'We'll match you with the right service team—your current provider stays the same' or 'Your address helps us confirm service availability in your area')."
- **first seen:** PR #28 (`76846df`)
- **pr_history:** PR #28 (`76846df`) · PR #31 (`6cf2eaa`) · PR #33 (`76d1e87`) — **3/3 consecutive PRs; promotion rule triggered per `docs/testing-strategy.md` §5.9**
- **notes:** Cross-cutting trust-copy gap flagged in three consecutive Sarah runs across three different feature surfaces. The theme is real and doesn't vary by batch, so further per-batch evidence is wasted. **Next session should cut `Batch UX.1 — trust-copy sweep`**: grep all data-collection forms + onboarding transitions + error screens; add single-sentence reassurance copy per field/transition. Needs design/product input on voice before the sweep lands — specifically the "Your Provider continues" framing and how it interacts with BYOC vs direct-signup users.

---

## Closed findings

_(None yet. Move entries here once `status: fixed` or `status: dismissed` is set.)_
