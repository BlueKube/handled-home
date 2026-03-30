# PRD-043: Academy Content Cleanup & Consistency Pass

> **Execution mode:** Quality
> **Priority:** High — training content with factual errors or gaps actively misleads operators

---

## Problem Statement

The Admin Academy (15 training modules) was built in a single continuous session without the PRD → Plan → Batch → Review process. Two post-hoc reviews (Senior Editor + Fact Checker) caught real issues — some were fixed, but 8 SHOULD-FIX items remain unaddressed. Additionally, the process deviation itself needs to be documented as a lesson learned.

The remaining issues fall into three categories:
1. **Content gaps** — sections that are too thin for the topic's importance
2. **Cross-module inconsistencies** — different modules describe the same system differently without explaining why
3. **Inaccurate references** — training content that describes features or workflows that don't match the codebase

---

## Requirements

### R1: Content Gap Fixes
- **R1.1** — Expand BYOP funnel coverage in `growth-incentives.ts` (currently one sentence; should match BYOC/referral depth)
- **R1.2** — Add Window Templates introduction to `jobs-scheduling.ts` (referenced in pro tip but never explained)

### R2: Cross-Module Consistency Fixes
- **R2.1** — Clarify that Stripe assignment blocking is manual discipline (not system-enforced) in `provider-lifecycle.ts` or `provider-payouts.ts`
- **R2.2** — Distinguish customer-facing price ($49–$203) vs provider payout ($45–$65) when cited in `control-room.ts` and `ops-cockpit.ts`
- **R2.3** — Resolve probation trigger inconsistency: count-based rules in `provider-lifecycle.ts` vs points-based system in `sops-playbooks.ts` — clarify which system the platform actually uses
- **R2.4** — Add Exception Analytics navigation path to `ops-cockpit.ts` (referenced in `exception-management.ts` but not findable from cockpit)

### R3: Process Documentation
- **R3.1** — Log the Academy process deviation in `lessons-learned.md` with specific data on what the reviews caught
- **R3.2** — Archive the Academy implementation plan to `docs/archive/`

---

## Acceptance Criteria

- All 6 content/consistency fixes applied with specific, accurate information
- No new type errors or build failures
- Cross-module references are bidirectional (if module A references module B's concept, module B acknowledges it)
- `lessons-learned.md` updated with Session 3 entry
- Academy implementation plan archived
- Per-batch review with custom lanes (Senior Editor + Fact Checker)

---

## Out of Scope

- New modules or new section types
- Screenshot/annotation additions
- UI changes to the Academy shell
- Anything that requires new codebase features (if a training reference is wrong because the feature doesn't exist, correct the training — don't build the feature)
