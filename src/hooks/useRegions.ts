import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Region = Tables<"regions"> & { state: string };

export function useRegions(includeArchived = false) {
  return useQuery({
    queryKey: ["regions", { includeArchived }],
    queryFn: async () => {
      let query = supabase.from("regions").select("*").order("name");
      if (!includeArchived) {
        query = query.neq("status", "archived");
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Region[];
    },
  });
}

export function useCreateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (region: { name: string; state: string; status: string }) => {
      const { data, error } = await supabase.from("regions").insert(region).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["regions"] }),
  });
}

export function useUpdateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; state?: string; status?: string }) => {
      const { data, error } = await supabase.from("regions").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["regions"] }),
  });
}
