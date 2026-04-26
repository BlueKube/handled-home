import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Bundle } from "./useBundles";

export interface BundleItem {
  id: string;
  bundle_id: string;
  sku_id: string | null;
  label: string;
  est_minutes: number;
  credits: number;
  sort_order: number;
}

export interface BundleWithItems {
  bundle: Bundle;
  items: BundleItem[];
}

// [OVERRIDE: bundles + bundle_items types pending regen-types.yml auto-PR.]
export function useBundle(slug: string | undefined) {
  return useQuery<BundleWithItems | null>({
    queryKey: ["bundle", slug],
    enabled: !!slug,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;
      const { data: bundleRow, error: bundleErr } = await client
        .from("bundles")
        .select(
          "id, slug, name, season, window_start_date, window_end_date, zone_ids, status, hero_image_path, description, total_credits, separate_credits, created_at, updated_at",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (bundleErr) throw bundleErr;
      if (!bundleRow) return null;

      const { data: itemRows, error: itemErr } = await client
        .from("bundle_items")
        .select("id, bundle_id, sku_id, label, est_minutes, credits, sort_order")
        .eq("bundle_id", bundleRow.id)
        .order("sort_order", { ascending: true });
      if (itemErr) throw itemErr;

      return {
        bundle: bundleRow as Bundle,
        items: (itemRows ?? []) as BundleItem[],
      };
    },
  });
}
