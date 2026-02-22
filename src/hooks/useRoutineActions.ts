import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CadenceType } from "./useRoutine";

export function useAddRoutineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ versionId, skuId, cadenceType, cadenceDetail }: {
      versionId: string;
      skuId: string;
      cadenceType?: CadenceType;
      cadenceDetail?: Record<string, any>;
    }) => {
      // Fetch SKU name for display
      const { data: sku } = await supabase
        .from("service_skus")
        .select("name, duration_minutes, fulfillment_mode, required_photos, checklist")
        .eq("id", skuId)
        .single();

      const { data, error } = await supabase
        .from("routine_items")
        .insert({
          routine_version_id: versionId,
          sku_id: skuId,
          cadence_type: cadenceType ?? "weekly",
          cadence_detail: cadenceDetail ?? {},
          sku_name: sku?.name ?? null,
          duration_minutes: sku?.duration_minutes ?? null,
          fulfillment_mode: (sku?.fulfillment_mode as string) ?? null,
          proof_photo_count: Array.isArray(sku?.required_photos) ? sku.required_photos.length : 0,
          checklist_count: Array.isArray(sku?.checklist) ? sku.checklist.length : 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routine"] }),
  });
}

export function useRemoveRoutineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("routine_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routine"] }),
  });
}

export function useUpdateRoutineItemCadence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, cadenceType, cadenceDetail }: {
      itemId: string;
      cadenceType: CadenceType;
      cadenceDetail?: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from("routine_items")
        .update({
          cadence_type: cadenceType,
          cadence_detail: cadenceDetail ?? {},
        })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routine"] }),
  });
}

export function useConfirmRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (routineId: string) => {
      const { data, error } = await supabase.rpc("confirm_routine", {
        p_routine_id: routineId,
      });
      if (error) throw error;
      return data as { status: string; routine_id: string; version_id: string; effective_at: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routine"] });
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
