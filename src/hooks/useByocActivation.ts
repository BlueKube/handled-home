import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ByocInviteDetails {
  id: string;
  token: string;
  category_key: string;
  zone_id: string;
  sku_id: string | null;
  default_level_id: string | null;
  default_cadence: string;
  is_active: boolean;
  org_id: string;
  provider_org: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  sku: {
    id: string;
    name: string;
    category: string;
    duration_minutes: number;
  } | null;
  level: {
    id: string;
    label: string;
  } | null;
  zone: {
    id: string;
    name: string;
  } | null;
}

export function useByocActivation(token: string | undefined) {
  const invite = useQuery({
    queryKey: ["byoc-invite-detail", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const { data, error } = await supabase
        .from("byoc_invite_links")
        .select("*, provider_orgs:org_id(id, name, logo_url), service_skus:sku_id(id, name, category, duration_minutes), sku_levels:default_level_id(id, label), zones:zone_id(id, name)")
        .eq("token", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        token: data.token,
        category_key: data.category_key,
        zone_id: data.zone_id,
        sku_id: data.sku_id,
        default_level_id: data.default_level_id,
        default_cadence: data.default_cadence,
        is_active: data.is_active,
        org_id: data.org_id,
        provider_org: data.provider_orgs as any,
        sku: data.service_skus as any,
        level: data.sku_levels as any,
        zone: data.zones as any,
      } as ByocInviteDetails;
    },
  });

  const activate = useMutation({
    mutationFn: async (params: { property_id?: string; cadence?: string }) => {
      const { data, error } = await supabase.functions.invoke("activate-byoc-invite", {
        body: {
          token,
          property_id: params.property_id || null,
          cadence: params.cadence,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });

  return { invite, activate };
}
