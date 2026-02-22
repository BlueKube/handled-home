# implementation-plan.md

## Module Build Sequence

The build follows a module-by-module sequence. Each module has a dedicated spec in `docs/modules/`.

---

## Completed Modules

| Module | Name | Notes |
|--------|------|-------|
| 01 | Auth and Roles | RBAC with customer, provider, admin roles |
| 02 | Property Profiles | Address, lot size, pets, access instructions |
| 03 | Zones and Capacity | Regions, zones, zip codes, stop/minute caps |
| 04 | SKU Catalog | Governed service definitions, checklists, photo requirements |
| 05 | Subscription Engine | 28-day billing cycles + weekly service weeks, no rollover, Stripe integration |

---

## Current Focus

| Module | Name | Notes |
|--------|------|-------|
| 06 | Service Day System | Zone-based service day assignment, cutoff logic, service week config |

---

## Remaining MVP Modules (in order)

| Module | Name | Notes |
|--------|------|-------|
| 07 | Bundle Builder | Customer-controlled SKU stacking per service week |
| 08 | Provider Onboarding | Org creation, zone assignment, capability matching |
| 09 | Job Execution | Checklist enforcement, photo capture, exception handling |

---

## Post-MVP Modules

| Module | Name | Notes |
|--------|------|-------|
| 10 | Visit Tracking and Photos | Before/after proof, photo compliance scoring |
| 11 | Billing and Payouts | Provider payouts, take rate calculations, invoicing |
| 12 | Support and Disputes | Deflection-first design critical for unit economics |
| 13 | Referrals and Incentives | Growth lever, not MVP — activate after retention is proven |
| 14 | Reporting and Analytics | Proves unit economics for scaling decisions |

---

## Launch Readiness Criteria

- ≥95% photo compliance
- ≥90% on-time completion
- Defined redo rate baseline
- Capacity guardrails enforced
- Support resolution under 3 minutes
- Positive gross margin per Service Day in launch zone
- Support cost per job tracked and under threshold
- 12-month retention trajectory visible
