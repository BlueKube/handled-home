import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type SkuLevel = Tables<"sku_levels">;
export type SkuLevelInsert = TablesInsert<"sku_levels">;
export type SkuLevelUpdate = TablesUpdate<"sku_levels">;
export type GuidanceQuestion = Tables<"sku_guidance_questions">;

// ─── Levels ───

export function useSkuLevels(skuId: string | null) {
  return useQuery({
    queryKey: ["sku_levels", skuId],
    enabled: !!skuId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_levels")
        .select("*")
        .eq("sku_id", skuId!)
        .order("level_number");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (level: SkuLevelInsert) => {
      const { data, error } = await supabase
        .from("sku_levels")
        .insert(level)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_levels", vars.sku_id] }),
  });
}

export function useUpdateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      skuId,
      updates,
    }: {
      id: string;
      skuId: string;
      updates: SkuLevelUpdate;
    }) => {
      const { data, error } = await supabase
        .from("sku_levels")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_levels", vars.skuId] }),
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, skuId }: { id: string; skuId: string }) => {
      const { error } = await supabase
        .from("sku_levels")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_levels", vars.skuId] }),
  });
}

// ─── Guidance Questions ───

export function useGuidanceQuestions(skuId: string | null) {
  return useQuery({
    queryKey: ["sku_guidance_questions", skuId],
    enabled: !!skuId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_guidance_questions")
        .select("*")
        .eq("sku_id", skuId!)
        .order("question_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateGuidanceQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: TablesInsert<"sku_guidance_questions">) => {
      const { data, error } = await supabase
        .from("sku_guidance_questions")
        .insert(q)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_guidance_questions", vars.sku_id] }),
  });
}

export function useUpdateGuidanceQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      skuId,
      updates,
    }: {
      id: string;
      skuId: string;
      updates: TablesUpdate<"sku_guidance_questions">;
    }) => {
      const { data, error } = await supabase
        .from("sku_guidance_questions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_guidance_questions", vars.skuId] }),
  });
}

export function useDeleteGuidanceQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, skuId }: { id: string; skuId: string }) => {
      const { error } = await supabase
        .from("sku_guidance_questions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_guidance_questions", vars.skuId] }),
  });
}

// ─── Level Recommendations (Provider) ───

export function useLevelRecommendation() {
  return useMutation({
    mutationFn: async (rec: TablesInsert<"level_recommendations">) => {
      const { data, error } = await supabase
        .from("level_recommendations")
        .insert(rec)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ─── Courtesy Upgrades (Provider) — uses SECURITY DEFINER RPC ───

export function useCourtesyUpgrade() {
  return useMutation({
    mutationFn: async (upgrade: {
      job_id: string;
      property_id: string;
      sku_id: string;
      scheduled_level_id: string;
      performed_level_id: string;
      reason_code: string;
      provider_org_id: string;
    }) => {
      const { data, error } = await supabase.rpc("insert_courtesy_upgrade", {
        p_job_id: upgrade.job_id,
        p_property_id: upgrade.property_id,
        p_sku_id: upgrade.sku_id,
        p_scheduled_level_id: upgrade.scheduled_level_id,
        p_performed_level_id: upgrade.performed_level_id,
        p_reason_code: upgrade.reason_code,
        p_provider_org_id: upgrade.provider_org_id,
      });
      if (error) throw error;
      return data;
    },
  });
}
