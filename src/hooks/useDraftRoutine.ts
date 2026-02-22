import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DraftRoutineItem {
  sku_id: string;
  sku_name: string;
  quantity: number;
}

export interface CustomerPlanSelection {
  id: string;
  customer_id: string;
  property_id: string | null;
  zone_id: string | null;
  selected_plan_id: string;
  entitlement_version_id: string | null;
  status: string;
  draft_routine: DraftRoutineItem[];
  created_at: string;
  updated_at: string;
}

export function useDraftRoutine(propertyId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["draft_routine", user?.id, propertyId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("customer_plan_selections")
        .select("*")
        .eq("customer_id", user!.id)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        draft_routine: (data.draft_routine ?? []) as unknown as DraftRoutineItem[],
      } as CustomerPlanSelection;
    },
  });
}

export function useSaveDraftRoutine() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      planId,
      propertyId,
      zoneId,
      entitlementVersionId,
      routine,
    }: {
      planId: string;
      propertyId?: string;
      zoneId?: string;
      entitlementVersionId?: string;
      routine: DraftRoutineItem[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check for existing draft
      const { data: existing } = await supabase
        .from("customer_plan_selections")
        .select("id")
        .eq("customer_id", user.id)
        .eq("status", "draft")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("customer_plan_selections")
          .update({
            selected_plan_id: planId,
            property_id: propertyId || null,
            zone_id: zoneId || null,
            entitlement_version_id: entitlementVersionId || null,
            draft_routine: routine as any,
          } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_plan_selections")
          .insert({
            customer_id: user.id,
            selected_plan_id: planId,
            property_id: propertyId || null,
            zone_id: zoneId || null,
            entitlement_version_id: entitlementVersionId || null,
            draft_routine: routine as any,
            status: "draft",
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["draft_routine"] }),
  });
}
