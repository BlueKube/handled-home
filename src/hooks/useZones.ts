import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type DayOfWeek = Database["public"]["Enums"]["day_of_week"];

export interface ZoneWithRegion extends ZoneRow {
  regions: { name: string; state: string } | null;
}

export function useZones(regionId?: string) {
  return useQuery({
    queryKey: ["zones", { regionId }],
    queryFn: async () => {
      let query = supabase
        .from("zones")
        .select("*, regions(name, state)")
        .order("name");
      if (regionId) query = query.eq("region_id", regionId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ZoneWithRegion[];
    },
  });
}

export function useZoneDetail(zoneId: string | null) {
  return useQuery({
    queryKey: ["zones", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("*, regions(name, state)")
        .eq("id", zoneId!)
        .single();
      if (error) throw error;
      return data as ZoneWithRegion;
    },
  });
}

interface CreateZoneInput {
  name: string;
  region_id: string;
  zip_codes: string[];
  default_service_day: DayOfWeek;
  default_service_window?: string | null;
  status?: string;
  max_stops_per_day?: number;
  max_minutes_per_day?: number;
  buffer_percent?: number;
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zone: CreateZoneInput) => {
      const { data, error } = await supabase.from("zones").insert(zone).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zones"] }),
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateZoneInput>) => {
      const { data, error } = await supabase.from("zones").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zones"] }),
  });
}
