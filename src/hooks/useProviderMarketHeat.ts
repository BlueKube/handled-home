import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";

export interface MarketHeatSignal {
  zoneId: string;
  zoneName: string;
  category: string;
  status: string;
}

/**
 * Fetches PROVIDER_RECRUITING zone-category pairs for zones
 * where the provider has active coverage. Shows opportunity badges.
 */
export function useProviderMarketHeat() {
  const { org } = useProviderOrg();

  const query = useQuery({
    queryKey: ["provider_market_heat", org?.id],
    enabled: !!org?.id,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Get provider's covered zone IDs
      const { data: coverage, error: covErr } = await supabase
        .from("provider_coverage")
        .select("zone_id")
        .eq("provider_org_id", org!.id)
        .eq("request_status", "APPROVED");
      if (covErr) throw covErr;

      const zoneIds = (coverage ?? []).map((c) => c.zone_id);
      if (zoneIds.length === 0) return [];

      // Get PROVIDER_RECRUITING states in those zones
      const { data: states, error: statesErr } = await supabase
        .from("market_zone_category_state")
        .select("zone_id, category, status")
        .in("zone_id", zoneIds)
        .eq("status", "PROVIDER_RECRUITING");
      if (statesErr) throw statesErr;
      if (!states || states.length === 0) return [];

      // Get zone names
      const uniqueZoneIds = [...new Set(states.map((s) => s.zone_id))];
      const { data: zones } = await supabase
        .from("zones")
        .select("id, name")
        .in("id", uniqueZoneIds);

      const zoneNameMap = new Map((zones ?? []).map((z) => [z.id, z.name]));

      return states.map((s) => ({
        zoneId: s.zone_id,
        zoneName: zoneNameMap.get(s.zone_id) ?? "Zone",
        category: s.category,
        status: s.status,
      })) as MarketHeatSignal[];
    },
  });

  return {
    signals: query.data ?? [],
    isLoading: query.isLoading,
    hasOpportunities: (query.data ?? []).length > 0,
  };
}
