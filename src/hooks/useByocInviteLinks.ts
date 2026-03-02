import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "./useProviderOrg";

export function useByocInviteLinks() {
  const { org } = useProviderOrg();
  const qc = useQueryClient();
  const orgId = org?.id;

  const links = useQuery({
    queryKey: ["byoc-invite-links", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("byoc_invite_links")
        .select("*, byoc_activations(count)")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createLink = useMutation({
    mutationFn: async (payload: {
      category_key: string;
      zone_id: string;
      sku_id?: string;
      default_level_id?: string;
      default_cadence?: string;
    }) => {
      if (!orgId) throw new Error("No org");
      const token = generateToken();
      const { data, error } = await supabase
        .from("byoc_invite_links")
        .insert({
          org_id: orgId,
          token,
          category_key: payload.category_key,
          zone_id: payload.zone_id,
          sku_id: payload.sku_id ?? null,
          default_level_id: payload.default_level_id ?? null,
          default_cadence: payload.default_cadence ?? "weekly",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["byoc-invite-links"] }),
  });

  const deactivateLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("byoc_invite_links")
        .update({ is_active: false })
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["byoc-invite-links"] }),
  });

  const events = useQuery({
    queryKey: ["byoc-invite-events", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      // Get all link IDs for this org, then fetch events
      const { data: linkData } = await supabase
        .from("byoc_invite_links")
        .select("id")
        .eq("org_id", orgId!);
      if (!linkData?.length) return [];
      const linkIds = linkData.map((l) => l.id);
      const { data, error } = await supabase
        .from("byoc_invite_events")
        .select("*")
        .in("invite_id", linkIds)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return { links, createLink, deactivateLink, events };
}

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "HH-";
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
