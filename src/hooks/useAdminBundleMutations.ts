import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Bundle } from "./useBundles";
import type { BundleItem } from "./useBundle";

// All admin bundle CRUD lives in this module. Each mutation invalidates both
// the admin list cache (`["admin-bundles"]`) and any customer caches that
// might hold a stale view (`["bundle"]` prefix + `["bundles", "active"]`).
// [OVERRIDE: bundles + bundle_items types pending regen-types.yml auto-PR.]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = () => supabase as any;

export interface CreateBundleInput {
  slug: string;
  name: string;
  season: Bundle["season"];
  window_start_date: string;
  window_end_date: string;
  zone_ids: string[];
  description: string | null;
  hero_image_path: string | null;
  total_credits: number;
}

export interface UpdateBundleInput
  extends Partial<Omit<CreateBundleInput, "slug">> {
  id: string;
  status?: Bundle["status"];
  separate_credits?: number;
}

export interface ItemInput {
  label: string;
  est_minutes: number;
  credits: number;
  sort_order: number;
  sku_id?: string | null;
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["admin-bundles"] });
  qc.invalidateQueries({ queryKey: ["bundle"] });
  qc.invalidateQueries({ queryKey: ["bundles", "active"] });
}

export function useCreateBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBundleInput) => {
      const { data, error } = await client()
        .from("bundles")
        .insert({ ...input, status: "draft", separate_credits: 0 })
        .select()
        .single();
      if (error) throw error;
      return data as Bundle;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBundleInput) => {
      const { data, error } = await client()
        .from("bundles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Bundle;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

// Replaces the entire bundle_items set for a bundle and recomputes
// separate_credits as sum(items.credits). Single-flight from the admin UI.
export function useReplaceBundleItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bundleId,
      items,
    }: {
      bundleId: string;
      items: ItemInput[];
    }) => {
      // Step 1: delete existing items for this bundle.
      const { error: deleteErr } = await client()
        .from("bundle_items")
        .delete()
        .eq("bundle_id", bundleId);
      if (deleteErr) throw deleteErr;

      // Step 2: insert the new set (if any).
      if (items.length > 0) {
        const rows = items.map((it) => ({
          bundle_id: bundleId,
          label: it.label,
          est_minutes: it.est_minutes,
          credits: it.credits,
          sort_order: it.sort_order,
          sku_id: it.sku_id ?? null,
        }));
        const { error: insertErr } = await client().from("bundle_items").insert(rows);
        if (insertErr) throw insertErr;
      }

      // Step 3: recompute separate_credits and persist on the bundle row.
      const newSeparate = items.reduce((acc, it) => acc + it.credits, 0);
      const { error: updateErr } = await client()
        .from("bundles")
        .update({ separate_credits: newSeparate })
        .eq("id", bundleId);
      if (updateErr) throw updateErr;

      return { bundleId, items: items.length, separate_credits: newSeparate };
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function usePromoteBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bundleId: string) => {
      const { data, error } = await client()
        .from("bundles")
        .update({ status: "active" })
        .eq("id", bundleId)
        .select()
        .single();
      if (error) throw error;
      return data as Bundle;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useArchiveBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bundleId: string) => {
      const { data, error } = await client()
        .from("bundles")
        .update({ status: "archived" })
        .eq("id", bundleId)
        .select()
        .single();
      if (error) throw error;
      return data as Bundle;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export type { Bundle, BundleItem };
