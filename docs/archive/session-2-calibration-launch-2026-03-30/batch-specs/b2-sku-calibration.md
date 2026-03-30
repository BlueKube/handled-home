# Batch 2: SKU Calibration Workflow (PRD-015)

## Phase
Phase 2 — Admin Tooling for Provider Onboarding

## Review: Quality

## Why it matters
Before pilot launch, seed data values (SKU durations, handle costs) must be compared against real provider-reported data. Admins need a side-by-side view showing current vs. provider-reported values with delta highlighting, so they can approve calibrated values with confidence.

## Scope
- New admin page at `/admin/sku-calibration`
- Shows all active SKUs with current seed values (duration, handle cost, base price)
- Editable "provider-reported" columns alongside seed values
- Delta highlighting when provider value differs > 20% from seed
- Per-property-size-tier duration inputs (small/medium/large/xl)
- "Approve calibration" action that updates the SKU with provider values
- Export calibration report as JSON download
- Navigation link from admin sidebar

## Non-goals
- Does NOT modify the SKU editor form (SkuFormSheet.tsx)
- Does NOT auto-import provider interview data (PRD-016)
- Does NOT change database schema — uses existing service_skus + sku_levels tables

## File targets
| Action | File |
|--------|------|
| Create | src/pages/admin/SkuCalibration.tsx |
| Create | src/components/admin/CalibrationRow.tsx |
| Modify | src/components/admin/AdminShell.tsx (add nav link) |

## Acceptance criteria
- [ ] Admin page lists all active SKUs with current duration, handle cost, and base price
- [ ] Each SKU row has editable provider-reported fields for duration, handle cost, and price
- [ ] Per-property-size-tier duration inputs (small/medium/large/xl) shown per SKU
- [ ] Deltas > 20% are visually highlighted (amber/red)
- [ ] "Apply Calibration" button updates the SKU with provider values
- [ ] Export button downloads calibration report as JSON
- [ ] Page accessible from admin sidebar navigation
- [ ] Build passes (npm run build + npx tsc --noEmit)

## Regression risks
- SKU updates could affect existing routines if handle costs change significantly
- Need to preserve existing level data when updating base SKU values
