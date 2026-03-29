---
title: Zone Pause Workflow
allowed_roles: [ops, superuser]
checklist: Assess reason, notify stakeholders, pause zone, monitor, reactivate
---

# Zone Pause Workflow

## Purpose
Safely pause service in a zone when capacity, weather, or other factors prevent reliable delivery.

## Steps

1. **Assess the situation** → Check [Zone Detail](/admin/zones) for the affected zone:
   - Provider availability: Are providers covering this zone?
   - Active subscriptions: How many customers affected?
   - Pending jobs: What's scheduled in the next 7 days?

2. **Determine pause type**:
   - **Weather pause** (1–3 days): Skip jobs, auto-reschedule
   - **Capacity pause** (1–2 weeks): Stop new signups, honor existing
   - **Full pause** (indefinite): Stop all service, notify all customers

3. **Execute pause**:
   - Navigate to zone settings → set status to `paused`
   - Reason is required (audit logged)
   - System auto-cancels/reschedules affected jobs

4. **Notify stakeholders**:
   - Customers: "Service in your area is temporarily paused due to [reason]"
   - Providers: "Jobs in [zone] are paused until further notice"
   - Include expected resume date if known

5. **Monitor during pause**:
   - Check daily for resolution of root cause
   - Track customer churn risk — flag customers who contact support
   - Update stakeholders if timeline changes

6. **Reactivate**:
   - Verify capacity is restored
   - Set zone status back to `active`
   - System auto-generates catch-up jobs if applicable
   - Send "Service resumed" notifications

## Authorization
- Weather pause: Ops or higher
- Capacity pause: Ops or higher
- Full pause: **Superuser only**
