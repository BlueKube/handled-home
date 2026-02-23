

# Update Test Plan + Add Seed Data for Scenario Testing

## Overview

Replace `docs/Scenarios-Test.md` with the updated version (adds Smoke 15, Growth 10, seed data checklist), create a database migration to insert seed data for all 70 scenarios, and update `docs/Scenario-Test-Results.md` with the expanded results template.

---

## Phase 1: Documentation Updates

### 1A. Replace `docs/Scenarios-Test.md`
Copy the uploaded `Scenarios-Test_UPDATED.md` to replace the existing file. This adds:
- Smoke Pack (Smoke 15) -- daily quick-check subset
- Growth Pack (Growth 10) -- Modules 13.1-13.4 validation
- Seed Data checklist section
- Original 60 scenarios preserved

### 1B. Update `docs/Scenario-Test-Results.md`
Rewrite to include:
- All 60 original scenarios (with existing results carried forward)
- New Growth 10 section (G-01 through G-10) with NOT_TESTED status
- Updated summary table (70 total scenarios)
- Seed data status section

---

## Phase 2: Database Seed Data Migration

A single migration inserts the minimal dataset needed to unblock BLOCKED scenarios. Uses the existing test user (`7cfa1714-bf93-441f-99c0-4bc3e24a284c`) who already has customer + provider + admin roles.

### What already exists (no changes needed)
- 1 Region ("Austin Metro") with 2 Zones ("Austin Central" 78701-78703, "Austin South" 78704/78745/78748)
- 8 SKUs (Standard Mow, Edge and Trim, Leaf Blowoff, Hedge Trimming, Weed Control, Fertilizer, Mulch, Spring Cleanup)
- 3 Plans (Essentials, Plus, Premium) with entitlement versions
- Test user with property at 123 Oak Street, ZIP 78701 (in Austin Central zone)
- Test user has all 3 roles (customer, provider, admin)

### What the migration adds

**2A. Additional SKUs** (per test plan: windows, power wash, pool, pest, dog poop)

| SKU | Category | Duration | Price | Required Photos |
|-----|----------|----------|-------|-----------------|
| Window Cleaning | windows | 45 min | $65 | after |
| Power Wash | power_wash | 60 min | $85 | after |
| Pool Service | pool | 30 min | $50 | -- |
| Pest Control | pest | 20 min | $40 | -- |
| Dog Poop Cleanup | pet_waste | 15 min | $25 | -- |

**2B. Provider Org + Member**
- Provider org "Austin Pro Services" (status: ACTIVE) owned by the test user
- Provider member entry linking test user to the org (role: OWNER, status: ACTIVE)

**2C. Provider Coverage + Capabilities**
- Coverage for Austin Central zone (approved)
- Capabilities enabled for Standard Mow, Edge and Trim, Window Cleaning, Power Wash

**2D. Subscription**
- Active subscription for test user on "Essentials" plan, linked to their property and Austin Central zone
- Billing cycle dates set to current month

**2E. Service Day Assignment**
- Tuesday assignment for test user in Austin Central (status: LOCKED)

**2F. Completed Job with Photos + Checklist**
- 1 completed job (status: COMPLETED) for Standard Mow + Edge and Trim
- `job_skus` linking SKUs to the job
- `job_checklist_items` (3 items, all status: done)
- `job_photos` (2 entries: before + after with placeholder storage paths)
- `job_events` (ASSIGNED, CONFIRMED, IN_PROGRESS, COMPLETED)

**2G. Referral Program + Code** (for Growth scenarios G-06, G-07, G-08)
- 1 active referral program "Provider Growth" with provider referrer type
- 1 referral code linked to test user

**2H. Market Zone Category State** (for Growth scenario G-03)
- Austin Central / windows = OPEN
- Austin Central / mowing = OPEN

**2I. Growth Surface Config** (for Growth scenarios G-09, G-10)
- Austin Central config with default weights and frequency caps

### Seed data uses deterministic UUIDs

All seed IDs follow the pattern `X1000000-0000-0000-0000-00000000000N` (consistent with existing seed data pattern) to make them easy to reference and idempotent via `ON CONFLICT DO NOTHING`.

---

## Phase 3: Results Document Structure

The updated `Scenario-Test-Results.md` will have:

```text
# Scenario Test Results

## Test Environment
- Test user, seed data status, date

## Smoke 15 Results (subset of C/P/A)

## Growth 10 Results (G-01 to G-10)

## Customer Scenarios (C-01 to C-20)
  [existing results carried forward, BLOCKED ones updated to reflect seed data now exists]

## Provider Scenarios (P-01 to P-20)
  [existing results carried forward, BLOCKED ones updated]

## Admin Scenarios (A-01 to A-20)
  [existing results carried forward]

## Summary table (70 scenarios total)
```

---

## Technical Details

### Migration SQL outline

```text
-- 1. Insert 5 new SKUs (windows, power_wash, pool, pest, pet_waste)
-- 2. Insert provider_orgs row
-- 3. Insert provider_members row
-- 4. Insert provider_coverage row
-- 5. Insert provider_capabilities rows (4 SKUs)
-- 6. Insert subscription row
-- 7. Insert service_day_assignments row
-- 8. Insert job row (COMPLETED)
-- 9. Insert job_skus rows
-- 10. Insert job_checklist_items rows
-- 11. Insert job_photos rows (placeholder paths)
-- 12. Insert job_events rows (4 status transitions)
-- 13. Insert referral_programs row
-- 14. Insert referral_codes row
-- 15. Insert market_zone_category_state rows
-- 16. Insert growth_surface_config row
-- All use ON CONFLICT DO NOTHING for idempotency
```

### Files created/modified

| File | Action |
|------|--------|
| `docs/Scenarios-Test.md` | Replace with uploaded version |
| `docs/Scenario-Test-Results.md` | Rewrite with 70-scenario template + seed data status |
| Migration SQL | Create (seed data for ~16 entity types) |

### What this unblocks

| Previously BLOCKED | Now testable |
|-------------------|-------------|
| C-07 View plan detail | Plans exist with entitlements |
| C-08 Subscribe to plan | Subscription already seeded |
| C-09 View subscription | Active subscription exists |
| C-10 Service day | Assignment exists (LOCKED) |
| C-11 Accept offer | Assignment seeded |
| C-13 Build routine | Subscription + SKUs exist |
| C-17 Visit detail | Completed job with photos |
| C-18 Report issue | Completed job exists |
| P-10 Job detail | Job exists |
| P-11 Checklist | Checklist items exist |
| P-12 Photos | Photos exist |
| P-13 Complete job | Job exists |
| G-01 to G-10 | All growth scenarios enabled |

