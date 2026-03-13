---
title: Emergency Pricing Override
allowed_roles: [superuser]
checklist: Identify issue, document reason, apply override, verify impact, set expiry
---

# Emergency Pricing Override

## Purpose
Apply immediate pricing changes when market conditions, errors, or competitive pressure require urgent action.

## Steps

1. **Identify the need**:
   - Pricing error discovered (wrong multiplier applied)
   - Competitive response needed (new competitor undercutting)
   - Cost spike (fuel, labor, materials)
   - Customer escalation involving pricing

2. **Document before acting**:
   - Navigate to [Change Log](/admin/control/change-log)
   - Note current pricing for affected SKUs/zones
   - Write clear reason for the override

3. **Apply the override** → Navigate to [Pricing & Margin](/admin/control/pricing):
   - Select affected zone(s)
   - Adjust zone multiplier or SKU-specific override
   - Set effective date (immediate or scheduled)
   - System creates audit trail automatically

4. **Verify impact**:
   - Check affected subscription count
   - Review projected revenue impact
   - Confirm no unintended zones/SKUs affected

5. **Set expiry if temporary**:
   - If this is a promotional or reactive change, note the expiry date
   - Create a calendar reminder to revert
   - Use rollback feature in [Change Log](/admin/control/change-log) when ready

6. **Communicate**:
   - If price decrease: No customer notification needed
   - If price increase: Requires 30-day notice per terms
   - Internal: Log in Slack/comms channel for team awareness

## Authorization
- **Superuser only** — no delegation
- All changes are versioned and rollback-capable
- Audit log captures before/after state automatically

## Rollback
If the override was a mistake:
1. Go to [Change Log](/admin/control/change-log)
2. Find the change entry
3. Click "Rollback" to restore previous version
4. System creates a new version (never deletes)
