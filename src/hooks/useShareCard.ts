import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useShareCard(jobId?: string) {
  const queryClient = useQueryClient();

  const card = useQuery({
    queryKey: ["share-card", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("share_cards")
        .select("*")
        .eq("job_id", jobId)
        .eq("is_revoked", false)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const createCard = useMutation({
    mutationFn: async (jId: string) => {
      const { data, error } = await supabase.rpc("create_share_card" as any, {
        p_job_id: jId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-card", jobId] });
    },
  });

  const revokeCard = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.rpc("revoke_share_card" as any, {
        p_share_card_id: cardId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-card", jobId] });
    },
  });

  const updateCard = useMutation({
    mutationFn: async (updates: { id: string; asset_mode?: string; show_first_name?: boolean; show_neighborhood?: boolean }) => {
      const { id, ...rest } = updates;
      const { error } = await (supabase as any)
        .from("share_cards")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-card", jobId] });
    },
  });

  return { card, createCard, revokeCard, updateCard };
}
