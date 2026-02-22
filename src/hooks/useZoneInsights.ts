import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NonServicedZip {
  zip_code: string;
  count: number;
}

export function useNonServicedZipDemand() {
  return useQuery({
    queryKey: ["non-serviced-zip-demand"],
    queryFn: async () => {
      // 1. Get all zip codes covered by active zones
      const { data: zones, error: zErr } = await supabase
        .from("zones")
        .select("zip_codes")
        .eq("status", "active");
      if (zErr) throw zErr;

      const coveredZips = new Set<string>();
      zones?.forEach((z) => z.zip_codes?.forEach((zip: string) => coveredZips.add(zip)));

      // 2. Get all properties
      const { data: properties, error: pErr } = await supabase
        .from("properties")
        .select("zip_code");
      if (pErr) throw pErr;

      // 3. Group non-covered zips
      const counts: Record<string, number> = {};
      properties?.forEach((p) => {
        if (!coveredZips.has(p.zip_code)) {
          counts[p.zip_code] = (counts[p.zip_code] || 0) + 1;
        }
      });

      return Object.entries(counts)
        .map(([zip_code, count]) => ({ zip_code, count }))
        .sort((a, b) => b.count - a.count) as NonServicedZip[];
    },
  });
}

export function useZoneHomeCount(zoneZipCodes: string[] | undefined) {
  return useQuery({
    queryKey: ["zone-home-count", zoneZipCodes],
    enabled: !!zoneZipCodes?.length,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .in("zip_code", zoneZipCodes!);
      if (error) throw error;
      return data;
    },
    select: (_data) => 0, // We use count from the response
  });
}

export function useZoneHomeCounts(zones: { id: string; zip_codes: string[] }[] | undefined) {
  return useQuery({
    queryKey: ["zone-home-counts", zones?.map((z) => z.id)],
    enabled: !!zones?.length,
    queryFn: async () => {
      // Get all properties
      const { data: properties, error } = await supabase
        .from("properties")
        .select("zip_code");
      if (error) throw error;

      const result: Record<string, number> = {};
      zones?.forEach((zone) => {
        const zipSet = new Set(zone.zip_codes);
        result[zone.id] = properties?.filter((p) => zipSet.has(p.zip_code)).length || 0;
      });
      return result;
    },
  });
}
