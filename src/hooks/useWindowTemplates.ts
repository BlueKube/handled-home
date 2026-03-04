import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type WindowTemplate = Tables<"appointment_window_templates">;
export type WindowTemplateInsert = TablesInsert<"appointment_window_templates">;
export type WindowTemplateUpdate = TablesUpdate<"appointment_window_templates">;

export function useWindowTemplates(zoneId?: string) {
  return useQuery({
    queryKey: ["window_templates", zoneId],
    queryFn: async () => {
      let query = supabase
        .from("appointment_window_templates")
        .select("*")
        .order("category_key")
        .order("day_of_week")
        .order("window_start");
      if (zoneId) {
        query = query.eq("zone_id", zoneId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as WindowTemplate[];
    },
  });
}

export function useCreateWindowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: WindowTemplateInsert) => {
      const { data, error } = await supabase
        .from("appointment_window_templates")
        .insert(template)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["window_templates"] }),
  });
}

export function useUpdateWindowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: WindowTemplateUpdate }) => {
      const { data, error } = await supabase
        .from("appointment_window_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["window_templates"] }),
  });
}

export function useDeleteWindowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointment_window_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["window_templates"] }),
  });
}
