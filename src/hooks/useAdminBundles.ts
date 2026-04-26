import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Bundle } from "./useBundles";
import type { BundleItem } from "./useBundle";

export interface AdminBundle extends Bundle {
  bundle_items: BundleItem[];
}

export interface BundlesByStatus {
  active: AdminBundle[];
  draft: AdminBundle[];
  archived: AdminBundle[];
}

// Admin RLS allows reading all bundles regardless of status / window / zone.
// [OVERRIDE: bundles + bundle_items types pending regen-types.yml auto-PR.]
export function useAdminBundles() {
  const query = useQuery<AdminBundle[]>({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;
      const { data, error } = await client
        .from("bundles")
        .select(
          "id, slug, name, season, window_start_date, window_end_date, zone_ids, status, hero_image_path, description, total_credits, separate_credits, created_at, updated_at, bundle_items(id, bundle_id, sku_id, label, est_minutes, credits, sort_order)",
        )
        .order("window_start_date", { ascending: true });
      if (error) throw error;

      // Sort each bundle's items by sort_order asc.
      return ((data ?? []) as AdminBundle[]).map((b) => ({
        ...b,
        bundle_items: [...(b.bundle_items ?? [])].sort(
          (a, c) => a.sort_order - c.sort_order,
        ),
      }));
    },
    refetchOnWindowFocus: true,
  });

  const grouped = useMemo<BundlesByStatus>(() => {
    const out: BundlesByStatus = { active: [], draft: [], archived: [] };
    for (const b of query.data ?? []) {
      out[b.status].push(b);
    }
    return out;
  }, [query.data]);

  return { ...query, grouped };
}
