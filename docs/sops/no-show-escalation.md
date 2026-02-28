---
title: No-Show Escalation
allowed_roles: [dispatcher, ops, superuser]
checklist: Detect no-show, notify customer, reassign job, log incident, update provider score
---

# No-Show Escalation

## Purpose
Handle provider no-shows quickly to minimize customer impact.

## Steps

1. **Detection** — System flags jobs where `latest_start_by` has passed with no `arrived_at`:
   - Auto-appears in [Dispatcher Queues](/admin/ops/dispatch) → "At Risk" tab
2. **Attempt contact** (within 15 minutes of window expiry):
   - Call/message provider via contact info on [Provider Detail](/admin/providers)
   - If provider responds with ETA → update latest_start_by, notify customer
   - If no response → proceed to step 3
3. **Reassign to backup provider**:
   - Use "Reassign" action in dispatcher queue
   - System auto-selects backup provider for the zone+category
   - If no backup available → manually assign from available providers
4. **Notify customer**:
   - Auto-notification sent: "Your provider is running late. We've assigned a new crew."
   - If no reassignment possible → offer reschedule with priority slot
5. **Log the incident**:
   - Create job issue: type = `no_show`, severity = `high`
   - This feeds into provider quality score automatically
6. **Provider accountability**:
   - 1st no-show: Warning notification
   - 2nd no-show (within 30 days): Quality score penalty (-15 points)
   - 3rd no-show (within 30 days): Trigger probation review

## Escalation path
- Dispatcher handles steps 1–4
- Ops reviews patterns weekly via [Reports](/admin/reports)
- Superuser reviews probation cases
