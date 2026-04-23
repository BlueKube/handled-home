# Acceptable findings (Tier 5 dismiss list)

> **Status:** Layer 2 stub (introduced in Batch T.3). The filter logic that consumes this file is deferred to Batch T.4.
> **Purpose:** Findings the AI judge will re-flag on every run but that the team has explicitly accepted. Once T.4 ships, the CI comparison logic reads this file and drops matching findings before evaluating thresholds — so accepted trade-offs don't generate noise forever.

## How to use this file (forward-looking — applies once T.4 is live)

When the Tier 5 judge flags a finding that is:

- **Correct but a deliberate product choice** — e.g. "onboarding asks 4 questions" when those 4 signals are load-bearing for the plan recommender.
- **A persona mismatch** — the persona's reaction doesn't map to the actual target user for this flow.
- **Aesthetic drift** — minor UI judgment the team has reviewed and accepted.

...add a new entry below under `## Dismissed findings` with the format:

```markdown
### <short-slug> — <role> — <yyyy-mm-dd>
- **Screen:** path/filename or flow
- **Metric:** clarity | trust | friction (which axis flagged)
- **Original finding (verbatim):** "what the judge said"
- **Decision:** accepted-as-is | persona-mismatch | deferred
- **Rationale:** 1-2 sentences explaining why
- **Approver:** human name + commit/PR reference
- **Expires:** YYYY-MM-DD (re-evaluate after this date) — optional
```

## Convergence rules

The dismiss list exists to prevent infinite review-fix loops, per `docs/testing-strategy.md` §5.8 Layer 4:

- A finding on the dismiss list is filtered from the threshold comparison. It will still appear in the downloadable report for transparency but won't trigger ⚠️ advisories.
- Entries with an `Expires:` date are flagged for re-review 30 days before expiry.
- Entries without an `Expires:` date are permanent dismissals (e.g. "this flow is correctly scoped to power users, persona mismatch is inherent").
- Any entry can be removed to re-enable the flagging. Removal should include a PR-message rationale.

---

## Dismissed findings

_(None yet. This section is intentionally empty until the first finding is explicitly accepted by a human.)_
