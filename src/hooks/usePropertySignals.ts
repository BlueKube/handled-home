import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type SqftTier = "lt_1500" | "1500_2500" | "2500_3500" | "3500_5000" | "5000_plus";
export type YardTier = "NONE" | "SMALL" | "MEDIUM" | "LARGE";
export type WindowsTier = "lt_15" | "15_30" | "30_plus";
export type StoriesTier = "1" | "2" | "3_plus";

export interface SignalsRow {
  property_id: string;
  home_sqft_tier: SqftTier | null;
  yard_tier: YardTier | null;
  windows_tier: WindowsTier | null;
  stories_tier: StoriesTier | null;
  signals_version: number;
  updated_at: string;
}

export interface SignalsFormData {
  home_sqft_tier: SqftTier | null;
  yard_tier: YardTier | null;
  windows_tier: WindowsTier | null;
  stories_tier: StoriesTier | null;
}

export const SQFT_OPTIONS: { value: SqftTier; label: string }[] = [
  { value: "lt_1500", label: "< 1,500" },
  { value: "1500_2500", label: "1,500–2,500" },
  { value: "2500_3500", label: "2,500–3,500" },
  { value: "3500_5000", label: "3,500–5,000" },
  { value: "5000_plus", label: "5,000+" },
];

export const YARD_OPTIONS: { value: YardTier; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
];

export const WINDOWS_OPTIONS: { value: WindowsTier; label: string }[] = [
  { value: "lt_15", label: "< 15" },
  { value: "15_30", label: "15–30" },
  { value: "30_plus", label: "30+" },
];

export const STORIES_OPTIONS: { value: StoriesTier; label: string }[] = [
  { value: "1", label: "1 story" },
  { value: "2", label: "2 stories" },
  { value: "3_plus", label: "3+" },
];

export function usePropertySignals() {
  const { property } = useProperty();
  const queryClient = useQueryClient();
  const propertyId = property?.id;

  const query = useQuery({
    queryKey: ["property_signals", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const { data, error } = await supabase
        .from("property_signals")
        .select("*")
        .eq("property_id", propertyId)
        .maybeSingle();
      if (error) throw error;
      return data as SignalsRow | null;
    },
    enabled: !!propertyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (form: SignalsFormData) => {
      if (!propertyId) throw new Error("No property");

      const isFirstSave = !query.data;

      const { error } = await supabase
        .from("property_signals")
        .upsert({
          property_id: propertyId,
          home_sqft_tier: form.home_sqft_tier,
          yard_tier: form.yard_tier,
          windows_tier: form.windows_tier,
          stories_tier: form.stories_tier,
        }, { onConflict: "property_id" });
      if (error) throw error;

      // Log personalization event with completion vs update distinction
      const filledCount = Object.values(form).filter(Boolean).length;
      const { error: eventError } = await supabase
        .from("personalization_events")
        .insert({
          property_id: propertyId,
          event_type: isFirstSave ? "property_sizing_completed" : "property_sizing_updated",
          payload: {
            ...form as unknown as Record<string, unknown>,
            fields_set: filledCount,
            completion_pct: Math.round((filledCount / 4) * 100),
          } as unknown as Json,
        });
      if (eventError) console.warn("Failed to log personalization event:", eventError);
    },
    onSuccess: () => {
      toast.success("Home size saved");
      queryClient.invalidateQueries({ queryKey: ["property_signals", propertyId] });
    },
    onError: () => {
      toast.error("Couldn't save. Please try again.");
    },
  });

  const hasData = useMemo(() => {
    const d = query.data;
    return !!(d && (d.home_sqft_tier || d.yard_tier || d.windows_tier || d.stories_tier));
  }, [query.data]);

  return {
    signals: query.data,
    isLoading: query.isLoading,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    hasData,
  };
}
