import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CadenceType, RoutineItem } from "./useRoutine";
import { cadenceToWeeklyEquivalent, computeCycleDemand } from "./useRoutinePreview";

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

// M4: Auto-fit algorithm
const CADENCE_ORDER: CadenceType[] = ["weekly", "biweekly", "four_week"];

export interface AutoFitResult {
  changes: Array<{ itemId: string; skuName: string; from: CadenceType; to: CadenceType }>;
  newDemand: number;
}

/**
 * Downgrades cadences starting from the last item until demand fits within the limit.
 * Returns the list of changes to apply.
 */
export function computeAutoFit(items: RoutineItem[], limit: number): AutoFitResult | null {
  if (items.length === 0) return null;

  // Work on a mutable copy
  const working = items.map((item) => ({
    id: item.id,
    skuName: item.sku_name ?? "Service",
    cadence: item.cadence_type as CadenceType,
    originalCadence: item.cadence_type as CadenceType,
  }));

  let demand = computeCycleDemand(items);
  if (demand <= limit) return null; // already fits

  const changes: AutoFitResult["changes"] = [];

  // Iterate from last to first, downgrading cadences
  for (let i = working.length - 1; i >= 0 && demand > limit; i--) {
    const item = working[i];
    const currentIdx = CADENCE_ORDER.indexOf(item.cadence);
    if (currentIdx < 0 || currentIdx >= CADENCE_ORDER.length - 1) continue;

    // Try each downgrade step
    for (let step = currentIdx + 1; step < CADENCE_ORDER.length && demand > limit; step++) {
      const oldEquiv = cadenceToWeeklyEquivalent(item.cadence) * 4;
      const newCadence = CADENCE_ORDER[step];
      const newEquiv = cadenceToWeeklyEquivalent(newCadence) * 4;
      demand = demand - oldEquiv + newEquiv;
      item.cadence = newCadence;
    }

    if (item.cadence !== item.originalCadence) {
      changes.push({
        itemId: item.id,
        skuName: item.skuName,
        from: item.originalCadence,
        to: item.cadence,
      });
    }
  }

  return { changes, newDemand: demand };
}

export function useAutoFitRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (changes: AutoFitResult["changes"]) => {
      for (const change of changes) {
        const { error } = await supabase
          .from("routine_items")
          .update({ cadence_type: change.to, cadence_detail: {} })
          .eq("id", change.itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routine"] }),
  });
}
