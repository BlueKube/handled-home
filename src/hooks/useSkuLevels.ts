import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Manual types until types.ts regenerates
export interface SkuLevel {
  id: string;
  sku_id: string;
  level_number: number;
  label: string;
  short_description: string | null;
  inclusions: string[];
  exclusions: string[];
  planned_minutes: number;
  proof_photo_min: number;
  proof_checklist_template: any[];
  handles_cost: number;
  is_active: boolean;
  effective_start_cycle: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkuLevelInsert {
  sku_id: string;
  level_number: number;
  label: string;
  short_description?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  planned_minutes?: number;
  proof_photo_min?: number;
  proof_checklist_template?: any[];
  handles_cost?: number;
  is_active?: boolean;
  effective_start_cycle?: string | null;
}

export interface SkuLevelUpdate {
  label?: string;
  short_description?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  planned_minutes?: number;
  proof_photo_min?: number;
  proof_checklist_template?: any[];
  handles_cost?: number;
  is_active?: boolean;
  effective_start_cycle?: string | null;
  level_number?: number;
}

export interface GuidanceQuestion {
  id: string;
  sku_id: string;
  question_order: number;
  question_text: string;
  is_mandatory: boolean;
  options: any[];
  created_at: string;
}

// ─── Levels ───

export function useSkuLevels(skuId: string | null) {
  return useQuery({
    queryKey: ["sku_levels", skuId],
    enabled: !!skuId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sku_levels")
        .select("*")
        .eq("sku_id", skuId!)
        .order("level_number");
      if (error) throw error;
      return data as SkuLevel[];
    },
  });
}

export function useCreateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (level: SkuLevelInsert) => {
      const { data, error } = await (supabase as any)
        .from("sku_levels")
        .insert(level)
        .select()
        .single();
      if (error) throw error;
      return data as SkuLevel;
    },
    onSuccess: (_d: any, vars: SkuLevelInsert) =>
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
      const { data, error } = await (supabase as any)
        .from("sku_levels")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as SkuLevel;
    },
    onSuccess: (_d: any, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_levels", vars.skuId] }),
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, skuId }: { id: string; skuId: string }) => {
      const { error } = await (supabase as any)
        .from("sku_levels")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d: any, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_levels", vars.skuId] }),
  });
}

// ─── Guidance Questions ───

export function useGuidanceQuestions(skuId: string | null) {
  return useQuery({
    queryKey: ["sku_guidance_questions", skuId],
    enabled: !!skuId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sku_guidance_questions")
        .select("*")
        .eq("sku_id", skuId!)
        .order("question_order");
      if (error) throw error;
      return data as GuidanceQuestion[];
    },
  });
}

export function useCreateGuidanceQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: Omit<GuidanceQuestion, "id" | "created_at">) => {
      const { data, error } = await (supabase as any)
        .from("sku_guidance_questions")
        .insert(q)
        .select()
        .single();
      if (error) throw error;
      return data as GuidanceQuestion;
    },
    onSuccess: (_d: any, vars) =>
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
      updates: Partial<GuidanceQuestion>;
    }) => {
      const { data, error } = await (supabase as any)
        .from("sku_guidance_questions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as GuidanceQuestion;
    },
    onSuccess: (_d: any, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_guidance_questions", vars.skuId] }),
  });
}

export function useDeleteGuidanceQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, skuId }: { id: string; skuId: string }) => {
      const { error } = await (supabase as any)
        .from("sku_guidance_questions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d: any, vars) =>
      qc.invalidateQueries({ queryKey: ["sku_guidance_questions", vars.skuId] }),
  });
}

// ─── Level Recommendations (Provider) ───

export function useLevelRecommendation() {
  return useMutation({
    mutationFn: async (rec: {
      job_id: string;
      provider_org_id: string;
      scheduled_level_id: string;
      recommended_level_id: string;
      reason_code: string;
      note?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from("level_recommendations")
        .insert(rec)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ─── Courtesy Upgrades (Provider) ───

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
      // Guardrail: check for existing courtesy upgrade within 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: existing, error: checkErr } = await (supabase as any)
        .from("courtesy_upgrades")
        .select("id")
        .eq("property_id", upgrade.property_id)
        .eq("sku_id", upgrade.sku_id)
        .gte("created_at", sixMonthsAgo.toISOString())
        .limit(1);

      if (checkErr) throw checkErr;
      if (existing && existing.length > 0) {
        throw new Error(
          "A courtesy upgrade was already given for this service at this property in the last 6 months."
        );
      }

      const { data, error } = await (supabase as any)
        .from("courtesy_upgrades")
        .insert(upgrade)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}
