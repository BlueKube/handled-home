import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneProviderAssignment {
  id: string;
  zone_id: string;
  provider_user_id: string;
  assignment_type: string;
  created_at: string;
}

export interface ProviderProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export function useZoneProviders(zoneId: string | null) {
  return useQuery({
    queryKey: ["zone-providers", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone_provider_assignments")
        .select("*")
        .eq("zone_id", zoneId!);
      if (error) throw error;
      return data as ZoneProviderAssignment[];
    },
  });
}

export function useProvidersList() {
  return useQuery({
    queryKey: ["providers-list"],
    queryFn: async () => {
      // Get all user_ids with provider role
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "provider");
      if (rolesErr) throw rolesErr;
      if (!roles?.length) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (profErr) throw profErr;
      return profiles as ProviderProfile[];
    },
  });
}

export function useToggleProviderAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      zoneId,
      providerUserId,
      assignmentType,
      enabled,
    }: {
      zoneId: string;
      providerUserId: string;
      assignmentType: "primary" | "backup";
      enabled: boolean;
    }) => {
      if (enabled) {
        const { error } = await supabase.from("zone_provider_assignments").insert({
          zone_id: zoneId,
          provider_user_id: providerUserId,
          assignment_type: assignmentType,
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("zone_provider_assignments")
          .delete()
          .eq("zone_id", zoneId)
          .eq("provider_user_id", providerUserId)
          .eq("assignment_type", assignmentType);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["zone-providers", vars.zoneId] });
    },
  });
}
