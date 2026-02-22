import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useInviteScripts(programId?: string) {
  const qc = useQueryClient();

  const scripts = useQuery({
    queryKey: ["invite-scripts", programId],
    queryFn: async () => {
      let q = supabase.from("invite_scripts").select("*").eq("is_active", true).order("sort_order");
      if (programId) q = q.eq("program_id", programId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createScript = useMutation({
    mutationFn: async (payload: { tone: string; body: string; program_id?: string; sort_order?: number }) => {
      const { data, error } = await supabase.from("invite_scripts").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invite-scripts"] }); toast.success("Script created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateScript = useMutation({
    mutationFn: async (payload: { id: string; [key: string]: any }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("invite_scripts").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invite-scripts"] }); toast.success("Script updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invite_scripts").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invite-scripts"] }); toast.success("Script removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  return { scripts, createScript, updateScript, deleteScript };
}
