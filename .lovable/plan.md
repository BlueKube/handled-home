

# Scenario Testing: Full 60-Scenario Test Suite

## Overview

Create two documents and systematically test all 60 user scenarios (20 Customer, 20 Provider, 20 Admin) through the live preview, recording pass/fail results with notes.

## Step 1: Create `docs/Scenarios-Test.md`

A structured document listing all 60 scenarios organized by role, each with:
- Scenario ID (C-01 through C-20, P-01 through P-20, A-01 through A-20)
- Name
- Steps to execute
- Expected outcome

### Customer Scenarios (C-01 to C-20)

| ID | Scenario |
|----|----------|
| C-01 | New customer signup and account creation |
| C-02 | Login with existing credentials |
| C-03 | View customer dashboard |
| C-04 | View property profile |
| C-05 | Edit property profile details |
| C-06 | Browse available plans |
| C-07 | View plan detail page |
| C-08 | Subscribe to a plan |
| C-09 | View current subscription status |
| C-10 | View Service Day assignment/offer |
| C-11 | Accept a Service Day offer |
| C-12 | Reject a Service Day and view alternatives |
| C-13 | Build a routine (select SKUs + cadences) |
| C-14 | Review routine with 4-week preview |
| C-15 | Confirm routine |
| C-16 | View service history timeline |
| C-17 | View visit detail (photos, checklist) |
| C-18 | Report an issue from visit detail |
| C-19 | View billing overview and payment status |
| C-20 | View billing history and receipts |

### Provider Scenarios (P-01 to P-20)

| ID | Scenario |
|----|----------|
| P-01 | Provider signup and account creation |
| P-02 | Provider login |
| P-03 | Start onboarding - organization setup |
| P-04 | Onboarding - set coverage zones |
| P-05 | Onboarding - select capabilities/SKUs |
| P-06 | Onboarding - upload compliance docs |
| P-07 | Onboarding - review and submit |
| P-08 | View provider dashboard |
| P-09 | View jobs list |
| P-10 | View job detail |
| P-11 | Complete job checklist |
| P-12 | Upload job photos |
| P-13 | Submit job completion |
| P-14 | View earnings/payouts overview |
| P-15 | View payout history |
| P-16 | Set up Stripe Connect payout account |
| P-17 | View organization settings |
| P-18 | Update coverage and capacity |
| P-19 | View authorized SKUs |
| P-20 | View performance metrics |

### Admin Scenarios (A-01 to A-20)

| ID | Scenario |
|----|----------|
| A-01 | Admin login |
| A-02 | View admin dashboard |
| A-03 | Create a new region |
| A-04 | Create a new zone with ZIP codes |
| A-05 | Configure zone capacity |
| A-06 | Configure service days for a zone |
| A-07 | Create/edit SKU in catalog |
| A-08 | Create/edit subscription plan |
| A-09 | View active subscriptions list |
| A-10 | View providers list |
| A-11 | View provider detail |
| A-12 | View jobs list with filters |
| A-13 | View job detail (timeline, photos) |
| A-14 | View billing overview |
| A-15 | View customer ledger |
| A-16 | View payouts overview |
| A-17 | View provider ledger |
| A-18 | Triage billing exceptions |
| A-19 | View audit logs |
| A-20 | View admin settings |

## Step 2: Create `docs/Scenario-Test-Results.md`

Same structure but with result columns:
- Status: PASS / FAIL / BLOCKED / PARTIAL
- Notes: what happened, any errors, screenshots context
- Date tested

## Step 3: Execute all 60 tests

Systematically navigate to each page/flow in the live preview using the browser tools, observe the result, and record findings. Tests will be executed sequentially without stopping:

1. Log in as customer (test@handled.home / Test1234!)
2. Run C-01 through C-20
3. Switch to provider role (or create provider account)
4. Run P-01 through P-20
5. Switch to admin role (or create admin account)
6. Run A-01 through A-20

For each test: navigate to the relevant page, attempt the described action, observe the outcome, check console/network for errors, and record the result.

## Deliverables

| File | Content |
|------|---------|
| `docs/Scenarios-Test.md` | All 60 scenarios with steps and expected outcomes |
| `docs/Scenario-Test-Results.md` | Test results with pass/fail status and detailed notes for every scenario |

This will be a long execution. Every scenario will be tested without stopping.

