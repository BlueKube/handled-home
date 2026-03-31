# Batch B1 — Schema Enhancement Migration

> **Size:** S
> **Review:** Quality (2-lane Small: 1 combined reviewer + 1 synthesis)

---

## Goal

Add 9 recommended columns to `sku_levels` and `service_skus` tables. Seed override values for levels where behavior differs from the parent SKU default.

## New Columns

### sku_levels (5 columns)

1. `presence_required BOOLEAN DEFAULT NULL` — NULL = inherit from SKU
2. `access_mode access_mode DEFAULT NULL` — NULL = inherit from SKU
3. `weather_sensitive BOOLEAN DEFAULT NULL` — NULL = inherit from SKU
4. `provider_payout_hint_cents INTEGER DEFAULT NULL` — advisory payout reference
5. `property_size_tier TEXT DEFAULT NULL` — 'small'/'medium'/'large'/'xl'

### service_skus (4 columns)

6. `licensing_required TEXT[] DEFAULT '{}'` — required certifications
7. `seasonal_availability TEXT DEFAULT 'year_round'` — enum-like text
8. `recommended_frequency TEXT DEFAULT NULL` — display text for plan builder
9. `min_provider_rating NUMERIC(2,1) DEFAULT NULL` — minimum star rating

## Seed Data (override values only)

### sku_levels overrides:
- Window Cleaning L2, L3: `presence_required = true`, `access_mode = 'customer_present'`, `weather_sensitive = false`
- Pest Control L2, L3: `presence_required = true`, `access_mode = 'customer_present'`

### service_skus seed:
- Weed Treatment: `licensing_required = '{pesticide_applicator}'`
- Fertilization: `licensing_required = '{pesticide_applicator}'`
- Pest Control: `licensing_required = '{pest_control_license}'`
- Pool Service: `licensing_required = '{cpo}'`
- Leaf Cleanup, Fall Prep: `seasonal_availability = 'fall_winter'`
- Spring Prep: `seasonal_availability = 'spring_summer'`
- Standard Mow: `recommended_frequency = 'weekly'`
- Edge & Trim: `recommended_frequency = 'weekly'`
- Pool Service: `recommended_frequency = 'weekly'`
- Pest Control: `recommended_frequency = 'quarterly'`
- Weed Treatment: `recommended_frequency = 'quarterly'`
- Fertilization: `recommended_frequency = 'quarterly'`
- Gutter Cleaning: `recommended_frequency = '2x_yearly'`
- Window Cleaning: `recommended_frequency = '2x_yearly'`
- Dryer Vent Cleaning: `recommended_frequency = 'annually'`

## Acceptance Criteria

- [ ] Migration runs clean (no syntax errors)
- [ ] All 9 columns added with correct types and defaults
- [ ] Override values seeded for Window Cleaning L2/L3 and Pest Control L2/L3
- [ ] Licensing, seasonal, frequency, and rating values seeded for relevant SKUs
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

## Out of Scope

- Updating admin UI components (no UI changes in this batch)
- Updating types.ts (B2)
