import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Bundle {
  id: string;
  slug: string;
  name: string;
  season: "fall" | "winter" | "spring" | "summer";
  window_start_date: string;
  window_end_date: string;
  zone_ids: string[];
  status: "draft" | "active" | "archived";
  hero_image_path: string | null;
  description: string | null;
  total_credits: number;
  separate_credits: number;
  created_at: string;
  updated_at: string;
}

// RLS already filters to active+window+zone-matching, so this returns
// only bundles the current customer is eligible to see.
// [OVERRIDE: bundles types pending regen-types.yml auto-PR — `as any` cast on
// the `from("bundles")` chain until the types-regen PR lands.]
export function useBundles() {
  return useQuery<Bundle[]>({
    queryKey: ["bundles", "active"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;
      const { data, error } = await client
        .from("bundles")
        .select(
          "id, slug, name, season, window_start_date, window_end_date, zone_ids, status, hero_image_path, description, total_credits, separate_credits, created_at, updated_at",
        )
        .order("window_start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Bundle[];
    },
  });
}
