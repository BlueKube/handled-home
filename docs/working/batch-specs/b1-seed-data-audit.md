# Batch 1: Seed Data Audit & Cleanup (PRD-014)

## Phase
Phase 1 — Data Cleanup & Accuracy

## Review: Quality

## Why it matters
Every operational parameter in the system (SKU durations, plan pricing, zone capacity, payout thresholds) was seeded with estimated values. Before pilot launch, the team needs a clear map of which values are calibrated vs. guessed, so provider interviews can target the right parameters.

## Scope
- Audit all seed data across migrations and TypeScript config files
- Create `docs/seed-data-audit.md` documenting every assumed value and its source
- Categorize each value as: Calibrated (from research), Estimated (reasonable guess), or Needs Interview (requires provider input)
- Flag values where a wrong assumption could break unit economics

## Non-goals
- Does NOT change any seed data values
- Does NOT create admin UI for editing values
- Does NOT touch application code

## File targets
| Action | File |
|--------|------|
| Create | docs/seed-data-audit.md |

## Acceptance criteria
- [ ] Every seed data table is documented with source classification
- [ ] SKU durations and handle costs have per-item source notes
- [ ] Plan pricing and entitlements are documented
- [ ] Zone capacity parameters are documented
- [ ] System config values (assignment weights, payout thresholds, dunning steps) are documented
- [ ] Each value is tagged: Calibrated / Estimated / Needs Interview
- [ ] High-impact values (those that affect unit economics) are flagged

## Regression risks
- None — documentation-only batch
