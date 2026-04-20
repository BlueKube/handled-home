import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanVariantRule {
  id: string;
  plan_family: string;
  target_size_tier: number;
  sqft_tiers: string[];
  yard_tiers: string[];
  windows_tiers: string[];
  stories_tiers: string[];
  priority: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function usePlanVariantRules(planFamily?: string) {
  return useQuery({
    queryKey: ["plan_variant_rules", planFamily ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("plan_variant_rules")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (planFamily) {
        query = query.eq("plan_family", planFamily);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PlanVariantRule[];
    },
  });
}

export function useCreateVariantRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<PlanVariantRule>) => {
      const { data, error } = await supabase
        .from("plan_variant_rules")
        .insert(rule as any)
        .select()
        .single();
      if (error) throw error;
      return data as PlanVariantRule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan_variant_rules"] }),
  });
}

export function useUpdateVariantRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlanVariantRule> }) => {
      const { data, error } = await supabase
        .from("plan_variant_rules")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as PlanVariantRule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan_variant_rules"] }),
  });
}

export function useDeleteVariantRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("plan_variant_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan_variant_rules"] }),
  });
}

/**
 * Resolves a property + plan family to the matching plan variant id via the
 * pick_plan_variant SECURITY DEFINER RPC. Returns null if no variant matches
 * (RPC's tier-10 fallback should prevent this in practice).
 */
export function usePickPlanVariant() {
  return useMutation({
    mutationFn: async ({ propertyId, planFamily }: { propertyId: string; planFamily: "basic" | "full" | "premier" }) => {
      const { data, error } = await supabase.rpc("pick_plan_variant", {
        p_property_id: propertyId,
        p_plan_family: planFamily,
      });
      if (error) throw error;
      return (data ?? null) as string | null;
    },
  });
}
