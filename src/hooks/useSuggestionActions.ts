import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSuggestionActions(propertyId: string | undefined) {
  const qc = useQueryClient();

  const recordImpression = useMutation({
    mutationFn: async ({ skuId, surface }: { skuId: string; surface: string }) => {
      if (!propertyId) return;
      const { error } = await supabase.from("suggestion_impressions").insert({
        property_id: propertyId,
        sku_id: skuId,
        surface,
      });
      if (error) throw error;
    },
  });

  const hideSuggestion = useMutation({
    mutationFn: async ({ skuId, reason }: { skuId: string; reason: string }) => {
      if (!propertyId) return;
      // Insert suppression
      await supabase.from("suggestion_suppressions").upsert(
        {
          property_id: propertyId,
          sku_id: skuId,
          reason,
          suppressed_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "property_id,sku_id" }
      );
      // Log the action
      await supabase.from("suggestion_actions").insert({
        property_id: propertyId,
        sku_id: skuId,
        action: "hidden",
        reason,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-suggestions"] });
    },
  });

  const recordAdd = useMutation({
    mutationFn: async ({ skuId }: { skuId: string }) => {
      if (!propertyId) return;
      await supabase.from("suggestion_actions").insert({
        property_id: propertyId,
        sku_id: skuId,
        action: "added",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-suggestions"] });
    },
  });

  const recordDrawerOpen = useMutation({
    mutationFn: async () => {
      if (!propertyId) return;
      // Use a placeholder sku_id — we need one for the NOT NULL constraint
      // Instead, we'll just skip this for now since drawer_open doesn't have a sku_id
    },
  });

  return { recordImpression, hideSuggestion, recordAdd, recordDrawerOpen };
}
