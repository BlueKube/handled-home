import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";

export interface ProviderJob {
  id: string;
  property_id: string;
  customer_id: string;
  zone_id: string;
  provider_org_id: string;
  status: string;
  scheduled_date: string | null;
  access_notes_snapshot: string | null;
  started_at: string | null;
  completed_at: string | null;
  arrived_at: string | null;
  departed_at: string | null;
  provider_summary: string | null;
  created_at: string;
  updated_at: string;
  property?: { street_address: string; city: string; zip_code: string; gate_code: string | null; pets: any; parking_instructions: string | null; access_instructions: string | null };
  job_skus?: { id: string; sku_id: string; sku_name_snapshot: string | null; duration_minutes_snapshot: number | null }[];
  issue_count?: number;
}

export function useProviderJobs(filter: "today" | "upcoming" | "history" = "today") {
  const { org } = useProviderOrg();

  return useQuery({
    queryKey: ["provider_jobs", org?.id, filter],
    queryFn: async () => {
      if (!org) return [];

      const today = new Date().toISOString().split("T")[0];

      let query = supabase
        .from("jobs")
        .select(`
          *,
          property:properties(street_address, city, zip_code, gate_code, pets, parking_instructions, access_instructions),
          job_skus(id, sku_id, sku_name_snapshot, duration_minutes_snapshot)
        `)
        .eq("provider_org_id", org.id);

      if (filter === "today") {
        query = query.eq("scheduled_date", today).not("status", "in", '("COMPLETED","CANCELED")');
      } else if (filter === "upcoming") {
        query = query.gt("scheduled_date", today).not("status", "in", '("COMPLETED","CANCELED")');
      } else {
        query = query.in("status", ["COMPLETED", "CANCELED"]).order("completed_at", { ascending: false });
      }

      query = query.order("scheduled_date", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProviderJob[];
    },
    enabled: !!org?.id,
  });
}
