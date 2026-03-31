# Batch B1 — Migration: provider_incidents + provider_probation tables

> **Size:** S
> **Review:** Quality (Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Create the database tables for tracking provider incidents (no-shows, quality issues) and probation status.

## Tables

### provider_incidents
- `id` UUID PK
- `provider_org_id` UUID FK → provider_orgs
- `incident_type` TEXT — 'no_show', 'quality_issue', 'access_failure', 'late_arrival', 'proof_missing'
- `severity` TEXT — 'minor', 'major', 'critical'
- `is_excused` BOOLEAN DEFAULT false
- `excuse_reason` TEXT NULL — provider-submitted reason
- `classified_by_user_id` UUID NULL — admin who classified
- `visit_id` UUID NULL FK → visits
- `zone_id` UUID NULL FK → zones
- `details` JSONB DEFAULT '{}'
- `created_at`, `updated_at` TIMESTAMPTZ

### provider_probation
- `id` UUID PK
- `provider_org_id` UUID FK → provider_orgs
- `status` TEXT — 'active', 'completed', 'failed', 'revoked'
- `entry_reason` TEXT — 'sla_orange', 'no_show_tier3', 'quality_sustained_red', 'manual'
- `sla_level_at_entry` TEXT NULL
- `targets` JSONB — improvement targets {quality_score_target, no_show_max, etc.}
- `deadline_at` TIMESTAMPTZ — when targets must be met
- `progress_notes` TEXT NULL
- `outcome` TEXT NULL — 'improved', 'suspended', 'extended'
- `resolved_at` TIMESTAMPTZ NULL
- `resolved_by_user_id` UUID NULL
- `created_at`, `updated_at` TIMESTAMPTZ

## Acceptance Criteria

- [ ] Both tables created with correct types and foreign keys
- [ ] RLS policies: admin read/write, provider read own
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
