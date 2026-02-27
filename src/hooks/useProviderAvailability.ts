import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useAuth } from "@/contexts/AuthContext";

export interface AvailabilityBlock {
  id: string;
  provider_org_id: string;
  block_type: string;
  start_date: string;
  end_date: string;
  note: string | null;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export function useProviderAvailability() {
  const { org } = useProviderOrg();
  const { user } = useAuth();
  const qc = useQueryClient();

  const blocksQuery = useQuery({
    queryKey: ["provider-availability-blocks", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_availability_blocks")
        .select("*")
        .eq("provider_org_id", org!.id)
        .eq("status", "active")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as AvailabilityBlock[];
    },
    enabled: !!org?.id,
  });

  const createBlock = useMutation({
    mutationFn: async (block: {
      block_type: string;
      start_date: string;
      end_date: string;
      note?: string;
    }) => {
      const { data, error } = await supabase
        .from("provider_availability_blocks")
        .insert({
          provider_org_id: org!.id,
          block_type: block.block_type,
          start_date: block.start_date,
          end_date: block.end_date,
          note: block.note ?? null,
          created_by_user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-availability-blocks"] });
    },
  });

  const cancelBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from("provider_availability_blocks")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("id", blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-availability-blocks"] });
    },
  });

  // Compute lead-time warnings: blocks starting within 48 hours
  const blocks = blocksQuery.data ?? [];
  const now = new Date();
  const shortNoticeBlocks = blocks.filter((b) => {
    const start = new Date(b.start_date);
    const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 0 && hoursUntil < 48;
  });

  return {
    blocks,
    shortNoticeBlocks,
    isLoading: blocksQuery.isLoading,
    isError: blocksQuery.isError,
    refetch: blocksQuery.refetch,
    createBlock,
    cancelBlock,
  };
}
