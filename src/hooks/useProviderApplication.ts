import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ByocEstimate {
  estimated_count: string;
  willingness: string;
  relationship_type: string;
  willing_to_invite: boolean;
}

export function useProviderApplication() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const application = useQuery({
    queryKey: ["provider-application", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_applications")
        .select("*, market_cohorts(*), referral_programs(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (payload: {
      category: string;
      zip_codes: string[];
      requested_categories?: string[];
      byoc_estimate_json?: ByocEstimate;
      pitch_variant_seen?: string;
    }) => {
      const { data, error } = await supabase
        .from("provider_applications")
        .insert({
          user_id: user!.id,
          category: payload.category,
          zip_codes: payload.zip_codes,
          requested_categories: payload.requested_categories ?? [payload.category],
          byoc_estimate_json: payload.byoc_estimate_json
            ? (payload.byoc_estimate_json as any)
            : null,
          pitch_variant_seen: payload.pitch_variant_seen ?? null,
          submitted_at: new Date().toISOString(),
          status: "submitted" as any,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-application"] });
      toast.success("Application submitted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { application, submitApplication };
}
