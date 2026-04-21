import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ActiveFamily } from "@/hooks/usePlanVariants";

export function useResolvePlanVariant() {
  return useMutation({
    mutationFn: async ({ propertyId, family }: { propertyId: string; family: ActiveFamily }): Promise<string> => {
      const { data, error } = await supabase.rpc("pick_plan_variant", {
        p_property_id: propertyId,
        p_plan_family: family,
      });
      if (error) throw error;
      if (!data) throw new Error("No matching plan variant found");
      return data as string;
    },
  });
}
