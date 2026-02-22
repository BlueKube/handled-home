# Module 12: Support & Disputes

## Scope
Ticketing, redo requests, refund processing, escalation workflows.

## Tables
- `support_tickets` — user_id, job_id, type (enum), status, priority, assigned_admin_id, created_at
- `ticket_messages` — ticket_id, sender_id, message, created_at

## Enums
- `ticket_type`: redo_request, refund_request, complaint, general
- `ticket_status`: open, in_progress, resolved, escalated, closed

## Key User Stories
- As a customer, I can report a problem with a service
- As a customer, I can request a redo or refund
- As an admin, I can manage tickets and process resolutions
- As an admin, I can impersonate a customer for support

## Dependencies
- Modules 09–11

## Acceptance Criteria
- [ ] Structured issue reporting flow
- [ ] Redo/refund processing
- [ ] Escalation workflow
- [ ] Admin support console
