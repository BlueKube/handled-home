

# Fix State Field Bug + Create Seed Data

## 1. Fix Property State Field (C-05 bug)

**Problem**: The state input field is a free-text `<Input>` defaulting to "CA". When editing, the user types new characters that append instead of replacing (e.g. "CA" + user types "TX" = "CATX"). The database currently stores "CATX" for the test user.

**Fix in `src/pages/customer/Property.tsx`**:
- Add `maxLength={2}` to the state `<Input>`
- Add `onFocus` handler that auto-selects all text so typing replaces the value
- Add CSS `uppercase` styling so input always shows uppercase
- Normalize to uppercase in `updateField` for the state field

**Fix existing data** via SQL migration:
```sql
UPDATE properties SET state = 'TX' WHERE id = 'edfedf3d-251d-4de7-89a8-1ce5f439e12e';
```

## 2. Create Seed Data via SQL Migration

Insert foundational data that unblocks the core customer journey and admin testing.

### Region (1 row)
| Name | State | Status |
|------|-------|--------|
| Austin Metro | TX | active |

### Zones (2 rows)
| Name | Region | ZIP Codes | Service Day | Status |
|------|--------|-----------|-------------|--------|
| Austin Central | Austin Metro | 78701, 78702, 78703 | tuesday | active |
| Austin South | Austin Metro | 78704, 78745, 78748 | thursday | active |

### Service SKUs (8 rows)

| Name | Category | Duration | Price | Mode |
|------|----------|----------|-------|------|
| Standard Mow | mowing | 30 min | 4500 | same_day_preferred |
| Edge & Trim | mowing | 15 min | 2000 | same_day_preferred |
| Leaf Blowoff | cleanup | 20 min | 2500 | same_day_preferred |
| Hedge Trimming | trimming | 30 min | 4000 | same_week_allowed |
| Weed Control | treatment | 25 min | 3500 | independent_cadence |
| Fertilizer Application | treatment | 20 min | 4000 | independent_cadence |
| Mulch Bed Refresh | cleanup | 45 min | 6000 | same_week_allowed |
| Spring Cleanup | cleanup | 60 min | 8000 | same_week_allowed |

### Plans (3 rows)

| Name | Tagline | Price Text | Rank | Status |
|------|---------|------------|------|--------|
| Essentials | Keep your yard tidy | $99/mo | 1 | active |
| Plus | The full package | $149/mo | 2 | active |
| Premium | White-glove service | $249/mo | 3 | active |

### Entitlement Versions (3 rows, one per plan)

Each plan gets one published entitlement version with `credits_per_cycle` model:
- Essentials: 8 credits, 60 minutes included
- Plus: 14 credits, 120 minutes included, extras allowed
- Premium: 24 credits, 240 minutes included, extras allowed

### SKU Rules (linking SKUs to entitlement versions)

All 8 SKUs marked `included` for every plan. Premium also gets `extra_allowed` rules.

### Plan Zone Availability

All 3 plans available in both zones.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/customer/Property.tsx` | Add maxLength, auto-select on focus, uppercase for state field |
| SQL migration | Fix CATX state, insert region, zones, SKUs, plans, entitlements, SKU rules, zone availability |

