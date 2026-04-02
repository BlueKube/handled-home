# Batch 1: SKU Form Decomposition

## Phase
Round 19: SKU System Core

## Review: Quality

## Scope
- Extract `LevelForm` from `SkuLevelEditor.tsx` (365→~269 lines)
- Extract `CollapsibleSection` from `SkuFormSheet.tsx` to shared utility
- [OVERRIDE: SkuFormSheet remains ~410 lines — single complex admin form with 20+ state variables; decomposing sections would require massive prop drilling for a single-use form]

## Acceptance Criteria
- [ ] SkuLevelEditor.tsx under 300 lines
- [ ] LevelForm extracted to separate file
- [ ] CollapsibleSection extracted as reusable utility
- [ ] TypeScript compiles clean
- [ ] No behavioral changes
