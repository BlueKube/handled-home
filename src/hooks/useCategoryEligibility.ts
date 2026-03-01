import { useMemo } from "react";
import { usePropertyProfileContext } from "@/hooks/usePropertyProfileContext";

/**
 * Returns suppressed category keys (coverage_status = NA).
 * Use to filter out irrelevant SKUs from add-service surfaces.
 */
export function useCategoryEligibility() {
  const { data: context, isLoading } = usePropertyProfileContext();

  const suppressed = useMemo(
    () => new Set(context?.computed?.suppressed_categories ?? []),
    [context]
  );

  const isEligible = (category: string | null | undefined): boolean => {
    if (!category) return true; // no category = don't suppress
    return !suppressed.has(category);
  };

  return {
    suppressed,
    isEligible,
    isLoading,
    eligibleCategories: context?.computed?.eligible_categories ?? [],
    switchCandidates: context?.computed?.switch_candidates ?? [],
    highConfidenceUpsells: context?.computed?.high_confidence_upsells ?? [],
  };
}
