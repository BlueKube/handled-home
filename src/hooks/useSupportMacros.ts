import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SupportMacro = {
  id: string;
  name: string;
  description: string | null;
  patch: Record<string, unknown>;
  is_active: boolean;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export function useSupportMacros() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const macrosQuery = useQuery({
    queryKey: ["support-macros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_macros")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportMacro[];
    },
  });

  const createMacro = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      patch: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("support_macros")
        .insert([{
          name: input.name,
          description: input.description,
          patch: input.patch as any,
          created_by_user_id: user?.id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-macros"] });
    },
  });

  const updateMacro = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<SupportMacro> & { id: string }) => {
      const { error } = await supabase
        .from("support_macros")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-macros"] });
    },
  });

  const deleteMacro = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("support_macros")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-macros"] });
    },
  });

  return {
    macros: macrosQuery.data ?? [],
    isLoading: macrosQuery.isLoading,
    createMacro,
    updateMacro,
    deleteMacro,
  };
}
