# Batch 1: Growth.tsx Decomposition

## Phase
Round 17: Zone Management

## Review: Quality

## Scope
Extract largest tab components from Growth.tsx (877 lines) into separate files:
- `src/components/admin/growth/ZoneMatrixTab.tsx` (162 lines)
- `src/components/admin/growth/FunnelsTab.tsx` (184 lines + FunnelBar + ByopAdminList)
- `src/components/admin/growth/EventsTab.tsx` (115 lines)
- Keep smaller tabs (HealthTab, ActionsTab, SurfacesTab) inline since they're under 120 lines each

## Acceptance Criteria
- [ ] Growth.tsx under 300 lines after extraction
- [ ] All extracted files under 300 lines
- [ ] No behavioral changes
- [ ] TypeScript compiles clean
