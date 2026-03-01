import { useMemo } from "react";
import { usePropertyProfileContext } from "@/hooks/usePropertyProfileContext";

/**
 * Returns eligibility info for service categories based on coverage data.
 * 
 * When coverage data exists (user has filled out coverage map):
 *   - Uses `eligible_categories` as an ALLOWLIST — only eligible categories shown
 *   - This correctly filters out SELF/non-high-pain and PROVIDER/NOT_OPEN
 * 
 * When no coverage data exists:
 *   - All categories are allowed (no filtering)
 */
export function useCategoryEligibility() {
  const { data: context, isLoading } = usePropertyProfileContext();

  const eligible = useMemo(
    () => new Set(context?.computed?.eligible_categories ?? []),
    [context]
  );

  const suppressed = useMemo(
    () => new Set(context?.computed?.suppressed_categories ?? []),
    [context]
  );

  // Coverage data exists when we have any suppressed or eligible categories
  const hasCoverageData = eligible.size > 0 || suppressed.size > 0;

  const isEligible = (category: string | null | undefined): boolean => {
    if (!category) return true; // no category = don't suppress
    if (!hasCoverageData) return true; // no coverage data yet = show everything
    // When coverage data exists, use eligible as allowlist
    return eligible.has(category);
  };

  return {
    suppressed,
    isEligible,
    isLoading,
    hasCoverageData,
    eligibleCategories: context?.computed?.eligible_categories ?? [],
    switchCandidates: context?.computed?.switch_candidates ?? [],
    highConfidenceUpsells: context?.computed?.high_confidence_upsells ?? [],
  };
}
