import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Plan } from "@/hooks/usePlans";

export type ActiveFamily = "basic" | "full" | "premier";
export const ACTIVE_FAMILIES: readonly ActiveFamily[] = ["basic", "full", "premier"] as const;

export interface PlanVariantsByFamily {
  basic: Plan[];
  full: Plan[];
  premier: Plan[];
}

export function usePlanVariants() {
  return useQuery({
    queryKey: ["plan_variants"],
    queryFn: async (): Promise<PlanVariantsByFamily> => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .in("plan_family", ACTIVE_FAMILIES as unknown as string[])
        .order("recommended_rank", { ascending: true })
        .order("size_tier", { ascending: true });
      if (error) throw error;

      const grouped: PlanVariantsByFamily = { basic: [], full: [], premier: [] };
      for (const row of (data ?? []) as Plan[]) {
        if (row.plan_family === "basic" || row.plan_family === "full" || row.plan_family === "premier") {
          grouped[row.plan_family].push(row);
        }
      }
      return grouped;
    },
  });
}
