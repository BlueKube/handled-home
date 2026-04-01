# Batch 5: Apply.tsx Banner Mapping Cleanup

## Phase
Phase 2 — Post-Application Zone Messaging

## Review: Quality

## Size: Small

## What
Clean up remaining references to CLOSED in Apply.tsx. Fix dead ternary. Update zone status badges to never show "closed" label.

## Requirements
1. Fix dead ternary on line ~125: `"HELP_LAUNCH" : "HELP_LAUNCH"` → just `"HELP_LAUNCH"`
2. Zone status badges in matched zones list (step 3, line ~391): replace raw `launch_status` display with friendly labels that never say "closed"
3. Remove `not_supported` from STATUS_ICONS if unused or relabel it
4. Verify no remaining string "closed" or "CLOSED" in Apply.tsx or OpportunityBanner.tsx

## Acceptance Criteria
- [ ] Dead ternary simplified
- [ ] Zone status badges use friendly labels, no "closed"
- [ ] No string "closed" or "CLOSED" in Apply.tsx or OpportunityBanner.tsx
- [ ] TypeScript still compiles clean

## Files Changed
- `src/pages/provider/Apply.tsx` (edit)
