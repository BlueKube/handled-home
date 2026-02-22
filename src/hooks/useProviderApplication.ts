import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
    mutationFn: async (payload: { category: string; zip_codes: string[] }) => {
      const { data, error } = await supabase
        .from("provider_applications")
        .insert({ user_id: user!.id, category: payload.category, zip_codes: payload.zip_codes, status: "submitted" as any })
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
