import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProperty } from "@/hooks/useProperty";
import { toast } from "sonner";

export type CoverageStatus = "SELF" | "PROVIDER" | "NONE" | "NA";
export type SwitchIntent = "OPEN_NOW" | "OPEN_LATER" | "NOT_OPEN";

export interface CoverageRow {
  id: string;
  property_id: string;
  category_key: string;
  coverage_status: CoverageStatus;
  switch_intent: SwitchIntent | null;
  created_at: string;
  updated_at: string;
}

export interface CoverageUpdate {
  category_key: string;
  coverage_status: CoverageStatus;
  switch_intent?: SwitchIntent | null;
}

/** Canonical coverage categories for v1 */
export const COVERAGE_CATEGORIES = [
  { key: "lawn", label: "Lawn & Yard", icon: "Leaf" },
  { key: "pool", label: "Pool", icon: "Waves" },
  { key: "cleaning", label: "House Cleaning", icon: "Sparkles" },
  { key: "pest", label: "Pest Control", icon: "Bug" },
  { key: "trash_bins", label: "Trash Bins", icon: "Trash2" },
  { key: "pet_waste", label: "Pet Waste", icon: "PawPrint" },
  { key: "windows", label: "Windows", icon: "AppWindow" },
  { key: "gutters", label: "Gutters & Roof", icon: "Home" },
  { key: "power_wash", label: "Pressure Washing", icon: "Droplets" },
  { key: "handyman", label: "Handyman / Fixes", icon: "Wrench" },
] as const;

export function usePropertyCoverage() {
  const { user } = useAuth();
  const { property } = useProperty();
  const queryClient = useQueryClient();
  const propertyId = property?.id;

  const query = useQuery({
    queryKey: ["property_coverage", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from("property_coverage")
        .select("*")
        .eq("property_id", propertyId)
        .order("category_key");
      if (error) throw error;
      return (data ?? []) as CoverageRow[];
    },
    enabled: !!propertyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: CoverageUpdate[]) => {
      if (!propertyId) throw new Error("No property");

      // Upsert all coverage rows
      const rows = updates.map((u) => ({
        property_id: propertyId,
        category_key: u.category_key,
        coverage_status: u.coverage_status,
        switch_intent: u.switch_intent ?? null,
      }));

      const { error } = await supabase
        .from("property_coverage")
        .upsert(rows, { onConflict: "property_id,category_key" });
      if (error) throw error;

      // Log personalization event (non-critical — warn on failure)
      const { error: eventError } = await supabase.from("personalization_events").insert({
        property_id: propertyId,
        event_type: "coverage_map_updated",
        payload: {
          categories_count: updates.length,
          counts: {
            SELF: updates.filter((u) => u.coverage_status === "SELF").length,
            PROVIDER: updates.filter((u) => u.coverage_status === "PROVIDER").length,
            NONE: updates.filter((u) => u.coverage_status === "NONE").length,
            NA: updates.filter((u) => u.coverage_status === "NA").length,
          },
        },
      });
      if (eventError) console.warn("Failed to log personalization event:", eventError);
    },
    onSuccess: () => {
      toast.success("Coverage map saved");
      queryClient.invalidateQueries({ queryKey: ["property_coverage", propertyId] });
    },
    onError: () => {
      toast.error("Couldn't save coverage map. Please try again.");
    },
  });

  // Build a map from existing data for easy lookup (memoized)
  const coverageMap = useMemo(() => {
    const map = new Map<string, CoverageRow>();
    for (const row of query.data ?? []) map.set(row.category_key, row);
    return map;
  }, [query.data]);

  return {
    coverage: query.data ?? [],
    coverageMap,
    isLoading: query.isLoading,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    hasData: (query.data?.length ?? 0) > 0,
  };
}
