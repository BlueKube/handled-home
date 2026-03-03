import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorkingHours {
  [day: string]: { start: string; end: string } | null;
}

export interface ProviderWorkProfile {
  provider_org_id: string;
  home_address_label: string | null;
  home_lat: number | null;
  home_lng: number | null;
  home_geohash: string | null;
  h3_index: string | null;
  service_categories: string[];
  equipment_kits: string[];
  working_hours: WorkingHours;
  max_jobs_per_day: number;
  created_at: string;
  updated_at: string;
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export const DEFAULT_WORKING_HOURS: WorkingHours = Object.fromEntries(
  WEEKDAYS.map((d) =>
    ["saturday", "sunday"].includes(d)
      ? [d, null]
      : [d, { start: "08:00", end: "17:00" }]
  )
);

export function useProviderWorkProfile(orgId?: string) {
  return useQuery({
    queryKey: ["provider_work_profile", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_work_profiles")
        .select("*")
        .eq("provider_org_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as ProviderWorkProfile | null;
    },
  });
}

export function useUpsertWorkProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      profile: Partial<ProviderWorkProfile> & { provider_org_id: string }
    ) => {
      const { data, error } = await supabase
        .from("provider_work_profiles")
        .upsert(profile, { onConflict: "provider_org_id" })
        .select()
        .single();
      if (error) throw error;
      return data as ProviderWorkProfile;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({
        queryKey: ["provider_work_profile", vars.provider_org_id],
      }),
  });
}
