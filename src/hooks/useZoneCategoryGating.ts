import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";

export type CategoryGatingStatus = "purchasable" | "waitlist" | "hidden";

export interface CategoryGating {
  category: string;
  status: CategoryGatingStatus;
  rawState: string;
  zoneId: string;
}

/**
 * Maps market_zone_category_state status to customer-facing gating:
 *   OPEN / SOFT_LAUNCH       → purchasable
 *   WAITLIST_ONLY / PROVIDER_RECRUITING / PROTECT_QUALITY → waitlist
 *   CLOSED                   → hidden
 */
function mapStateToGating(state: string): CategoryGatingStatus {
  switch (state) {
    case "OPEN":
    case "SOFT_LAUNCH":
      return "purchasable";
    case "WAITLIST_ONLY":
    case "PROVIDER_RECRUITING":
    case "PROTECT_QUALITY":
      return "waitlist";
    case "CLOSED":
    default:
      return "hidden";
  }
}

/**
 * Fetches zone-category states for the customer's zone (resolved from zip).
 * Returns per-category gating info for catalog filtering & checkout validation.
 */
export function useZoneCategoryGating() {
  const { property } = useProperty();
  const zipCode = property?.zip_code ?? "";

  // Step 1: Resolve zone from zip
  const zoneQuery = useQuery({
    queryKey: ["customer_zone_by_zip", zipCode],
    enabled: /^\d{5}$/.test(zipCode),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("id")
        .contains("zip_codes", [zipCode])
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });

  const zoneId = zoneQuery.data;

  // Step 2: Fetch category states for the zone
  const statesQuery = useQuery({
    queryKey: ["zone_category_gating", zoneId],
    enabled: !!zoneId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_zone_category_state")
        .select("category, status")
        .eq("zone_id", zoneId!);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        category: row.category,
        status: mapStateToGating(row.status),
        rawState: row.status,
        zoneId: zoneId!,
      })) as CategoryGating[];
    },
  });

  const gatingMap = new Map<string, CategoryGating>();
  for (const g of statesQuery.data ?? []) {
    gatingMap.set(g.category, g);
  }

  const hasGatingData = gatingMap.size > 0;

  /**
   * Get gating status for a category.
   * When no gating data exists (no zone or no states), defaults to purchasable.
   */
  const getCategoryGating = (category: string | null | undefined): CategoryGatingStatus => {
    if (!category || !hasGatingData) return "purchasable";
    return gatingMap.get(category)?.status ?? "purchasable";
  };

  /** Check if a category is purchasable (OPEN or SOFT_LAUNCH) */
  const isPurchasable = (category: string | null | undefined): boolean =>
    getCategoryGating(category) === "purchasable";

  /** Check if a category should show waitlist CTA */
  const isWaitlisted = (category: string | null | undefined): boolean =>
    getCategoryGating(category) === "waitlist";

  /** Check if a category is hidden (CLOSED) */
  const isHidden = (category: string | null | undefined): boolean =>
    getCategoryGating(category) === "hidden";

  /** Get the raw state string for messaging purposes */
  const getRawState = (category: string | null | undefined): string | null => {
    if (!category || !hasGatingData) return null;
    return gatingMap.get(category)?.rawState ?? null;
  };

  return {
    zoneId,
    hasGatingData,
    gatingMap,
    getCategoryGating,
    isPurchasable,
    isWaitlisted,
    isHidden,
    getRawState,
    isLoading: zoneQuery.isLoading || statesQuery.isLoading,
  };
}
