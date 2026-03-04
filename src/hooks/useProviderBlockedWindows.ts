import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";

export interface BlockedWindow {
  id: string;
  provider_org_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  label: string;
  location_lat: number | null;
  location_lng: number | null;
  is_recurring: boolean;
  specific_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBlockedWindowInput {
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  label: string;
  location_lat?: number | null;
  location_lng?: number | null;
  is_recurring: boolean;
  specific_date?: string | null;
}

export function useProviderBlockedWindows() {
  const { org } = useProviderOrg();
  const qc = useQueryClient();
  const orgId = org?.id;

  const query = useQuery({
    queryKey: ["provider-blocked-windows", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_blocked_windows")
        .select("*")
        .eq("provider_org_id", orgId!)
        .order("day_of_week", { ascending: true, nullsFirst: false })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as BlockedWindow[];
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: CreateBlockedWindowInput) => {
      const { data, error } = await supabase
        .from("provider_blocked_windows")
        .insert({
          provider_org_id: orgId!,
          day_of_week: input.day_of_week,
          start_time: input.start_time,
          end_time: input.end_time,
          label: input.label,
          location_lat: input.location_lat ?? null,
          location_lng: input.location_lng ?? null,
          is_recurring: input.is_recurring,
          specific_date: input.specific_date ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-blocked-windows"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateBlockedWindowInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("provider_blocked_windows")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("provider_org_id", orgId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-blocked-windows"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("provider_blocked_windows")
        .delete()
        .eq("id", id)
        .eq("provider_org_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-blocked-windows"] }),
  });

  return {
    windows: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    create,
    update,
    remove,
  };
}
