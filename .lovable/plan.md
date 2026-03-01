

# Sprint 3A Cleanup — F-3A-1: Display Default Level Reason

## What & Why

The `useLevelDefault` hook already computes explainability copy like *"Homes your size typically use Level 3"*, but no customer-facing component renders it. The spec marks this as required — it builds trust in the system's intelligence.

## Fix (1 file change + 1 file saved)

### 1. Save the review document
Copy `user-uploads://3a-sprint-3a-final-review.md` → `docs/reviews/3a-sprint-3a-final-review.md`

### 2. Wire `default_level_reason` into SkuDetailModal

**File:** `src/components/routine/SkuDetailModal.tsx`

- Import `useLevelDefault` 
- Call `useLevelDefault(sku.sku_id, sku.category)` to get `default_level_reason`
- Use the default level ID from the hook to initialize `selectedLevelId` (instead of always picking `activeLevels[0]`)
- Render `default_level_reason` as calm microcopy above the LevelSelector when:
  - No guidance answers have been given yet (guidance recommendation takes priority)
  - The reason string is non-null

**Rendered as:**
```tsx
{!guidanceRecommendedLevelId && defaultLevelReason && (
  <p className="text-xs text-muted-foreground italic mb-1">
    {defaultLevelReason}
  </p>
)}
```

This replaces the current `activeLevels[0]` fallback with the sizing-aware default, and shows the customer *why* that level was chosen.

### Deferred findings (no action now)
- **F-3A-2** (proof photo field): Deferred to v1.5 per review
- **F-3A-3** (planned_minutes in scheduling): Scheduling sprint concern
- **F-3A-4** (acceptance rate analytics): Future analytics maturity
- **F-3A-5** (exclusions in comparison): Future polish pass

