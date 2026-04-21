import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAllPlanHandles() {
  return useQuery({
    queryKey: ["plan_handles_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_handles")
        .select("plan_id, handles_per_cycle, rollover_cap, rollover_expiry_days");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.plan_id, r]));
    },
  });
}

export function useAllPlanZoneAvailability() {
  return useQuery({
    queryKey: ["plan_zone_availability_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_zone_availability")
        .select("plan_id, zone_id, is_enabled");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useZoneByZip(zipCode: string) {
  return useQuery({
    queryKey: ["zone_by_zip", zipCode],
    enabled: /^\d{5}$/.test(zipCode),
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
}
