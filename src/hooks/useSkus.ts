import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ServiceSku = Tables<"service_skus">;
export type ServiceSkuInsert = TablesInsert<"service_skus">;
export type ServiceSkuUpdate = TablesUpdate<"service_skus">;

export interface PhotoRequirement {
  label: string;
  when: "before" | "after" | "both";
  count: number;
  notes?: string;
}

export interface ChecklistItem {
  label: string;
  required: boolean;
}

export const FULFILLMENT_MODE_LABELS: Record<string, string> = {
  same_day_preferred: "Performed on your Service Day",
  same_week_allowed: "Completed within your service week",
  independent_cadence: "Scheduled on its own cycle",
};

export function useSkus(filters?: { status?: string; category?: string; search?: string }) {
  return useQuery({
    queryKey: ["service_skus", filters],
    queryFn: async () => {
      let query = supabase.from("service_skus").select("*").order("name");
      if (filters?.status && filters.status !== "all") {
        if (filters.status === "paused_archived") {
          query = query.in("status", ["paused", "archived"]);
        } else {
          query = query.eq("status", filters.status);
        }
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceSku[];
    },
  });
}

export function useSkuDetail(skuId: string | null) {
  return useQuery({
    queryKey: ["service_skus", skuId],
    enabled: !!skuId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("*")
        .eq("id", skuId!)
        .single();
      if (error) throw error;
      return data as ServiceSku;
    },
  });
}

export function useCreateSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sku: ServiceSkuInsert) => {
      const { data, error } = await supabase.from("service_skus").insert(sku).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service_skus"] }),
  });
}

export function useUpdateSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ServiceSkuUpdate }) => {
      const { data, error } = await supabase
        .from("service_skus")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service_skus"] }),
  });
}

export function useDuplicateSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data: original, error: fetchErr } = await supabase
        .from("service_skus")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (fetchErr || !original) throw fetchErr ?? new Error("SKU not found");

      const { id, created_at, updated_at, ...rest } = original;
      const copy: ServiceSkuInsert = {
        ...rest,
        name: `${original.name} (Copy)`,
        status: "draft",
      };
      const { data, error } = await supabase.from("service_skus").insert(copy).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service_skus"] }),
  });
}
