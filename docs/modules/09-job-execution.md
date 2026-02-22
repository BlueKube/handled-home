# Module 09: Job Execution

## Scope
Checklists, photo uploads, status transitions, exception handling.

## Tables
- `jobs` — bundle_item_id, provider_org_id, assigned_member_id, status, started_at, completed_at
- `job_checklists` — job_id, step_index, description, completed, completed_at
- `job_photos` — job_id, type (before/after), url, uploaded_at
- `job_exceptions` — job_id, type (enum), notes, resolution

## Enums
- `job_status`: assigned, en_route, arrived, in_progress, completed, blocked, rescheduled
- `exception_type`: blocked_access, weather, unsafe, scope_mismatch, customer_unprepared

## Key User Stories
- As a provider, I follow the checklist for each job
- As a provider, I upload required before/after photos
- As a provider, I can report exceptions
- As an admin, I can resolve exceptions

## Dependencies
- Modules 06–08

## Acceptance Criteria
- [ ] Checklist enforcement (all steps required)
- [ ] Photo upload required before completion
- [ ] Status transitions enforced
- [ ] Exception workflow complete
