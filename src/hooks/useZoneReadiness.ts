import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneReadinessResult {
  status: "open" | "soft_launch" | "waitlist" | "not_supported";
  category: string;
  matched_zones: { zone_id: string; zone_name: string; launch_status: string }[];
  zip_codes_checked: string[];
}

export function useZoneReadiness() {
  return useMutation({
    mutationFn: async (params: { zip_codes: string[]; category: string }): Promise<ZoneReadinessResult> => {
      const { data, error } = await supabase.rpc("check_zone_readiness", {
        p_zip_codes: params.zip_codes,
        p_category: params.category,
      });
      if (error) throw error;
      return data as unknown as ZoneReadinessResult;
    },
  });
}
