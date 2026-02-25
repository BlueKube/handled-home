# implementation-plan.md

## Module Build Sequence

The build follows a module-by-module sequence. Each module has a dedicated spec in `docs/modules/`.

---

## Completed Modules

| Module | Name | Notes |
|--------|------|-------|
| 01 | Auth and Roles | RBAC with customer, provider, admin roles. Includes Admin Preview Mode (`previewRole`/`effectiveRole`) for viewing the app as any role without database changes. |
| 02 | Property Profiles | Address, lot size, pets, access instructions |
| 03 | Zones and Capacity | Regions, zones, zip codes, stop/minute caps |
| 04 | SKU Catalog | Governed service definitions, checklists, photo requirements |
| 05 | Subscription Engine | 28-day billing cycles + weekly service weeks, no rollover, Stripe integration |
| 06 | Service Day System | Zone-based assignment, offer/accept/reject, TTL cleanup, capacity checks |
| 07 | Bundle Builder | SKU stacking per service week, cadence picker, 4-week preview, seasonal boosts |
| 08 | Provider Onboarding | Org creation, invite flow, zone coverage, capability matching, compliance |
| 09 | Job Execution | Checklist enforcement, photo capture, server-validated completion, exception handling |
| 10 | Customer Dashboard and Proof | Visit timeline, photo gallery, structured issue reporting, 4-week preview |
| 11 | Billing and Payouts | Ledger-first billing, Stripe Connect payouts, webhook processing, admin exception queue |
| 12 | Support and Disputes | Deflection-first support, AI classification, macro responses, ticket lifecycle, resolution offers |
| 13 | Referrals and Incentives | Referral programs, invite codes, provider/customer referral flows, growth event bus, viral surfaces, founding partner program, growth autopilot |

---

## Current Focus

| Module | Name | Notes |
|--------|------|-------|
| 14 | Reporting and Analytics | Proves unit economics for scaling decisions |

---

## Remaining Modules

All feature modules (01–13) are implemented. Module 14 (Reporting and Analytics) is the final module.

---

## Cross-Cutting Features (Implemented)

| Feature | Notes |
|---------|-------|
| Admin Preview Mode | Admins can view Customer/Provider UIs via `PreviewAsCard` on all Settings pages. Uses `effectiveRole` throughout UI components. No banner — bottom tab bar indicates active view. |
| Ops Cockpit | Unified admin operations dashboard with zone health, service days, jobs, billing, growth, support, and definitions tabs |

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
