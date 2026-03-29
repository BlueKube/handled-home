import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ByopStatus = "received" | "under_review" | "accepted" | "not_a_fit" | "provider_unavailable";

export interface ByopRecommendation {
  id: string;
  customer_id: string;
  provider_name: string;
  category: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  status: ByopStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface ByopSubmitPayload {
  provider_name: string;
  category: string;
  phone?: string;
  email?: string;
  note?: string;
}

export function useByopRecommendations(options?: { admin?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = options?.admin ?? false;

  const recommendations = useQuery({
    queryKey: isAdmin ? ["byop-recommendations", "admin"] : ["byop-recommendations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      let query = (supabase
        .from("byop_recommendations" as any)
        .select("*")
        .order("created_at", { ascending: false })) as any;
      if (!isAdmin) {
        query = query.eq("customer_id", user!.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ByopRecommendation[];
    },
  });

  const submit = useMutation({
    mutationFn: async (payload: ByopSubmitPayload) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase
        .from("byop_recommendations" as any)
        .insert({
          customer_id: user.id,
          provider_name: payload.provider_name,
          category: payload.category,
          phone: payload.phone || null,
          email: payload.email || null,
          note: payload.note || null,
          status: "received",
        } as any)
        .select()
        .single()) as any;
      if (error) throw error;
      return data as ByopRecommendation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["byop-recommendations"] });
      toast.success("Recommendation submitted — we'll review and keep you posted.");
    },
    onError: () => {
      toast.error("Your recommendation couldn't be submitted — check your connection and try again.");
    },
  });

  const declineRecommendation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("byop_recommendations" as any)
        .update({ status: "provider_unavailable", reviewed_at: new Date().toISOString() })
        .eq("id", id)) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["byop-recommendations"] });
      qc.invalidateQueries({ queryKey: ["byop-funnel-stats"] });
      toast.success("Recommendation marked as provider declined");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalCredits = (recommendations.data ?? [])
    .filter((r) => r.status === "accepted")
    .length * 3000; // $30 per accepted recommendation, in cents

  return { recommendations, submit, declineRecommendation, totalCredits };
}
