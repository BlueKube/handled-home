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
// separate_credits as sum(items.credits). Atomic — all three operations
// (delete-existing, insert-new, update-separate_credits) run inside the
// public.replace_bundle_items RPC's implicit transaction so a mid-flight
// failure rolls back cleanly. Replaces the previous three-round-trip
// flow that could corrupt the bundle on partial failure (Lane 4 MF-1).
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
      const itemsPayload = items.map((it) => ({
        label: it.label,
        est_minutes: it.est_minutes,
        credits: it.credits,
        sort_order: it.sort_order,
        sku_id: it.sku_id ?? null,
      }));
      const { data, error } = await supabase.rpc("replace_bundle_items", {
        p_bundle_id: bundleId,
        p_items: itemsPayload,
      });
      if (error) throw error;
      const result = (data ?? {}) as {
        bundle_id?: string;
        separate_credits?: number;
        item_count?: number;
      };
      return {
        bundleId,
        items: items.length,
        separate_credits: result.separate_credits ?? 0,
      };
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
