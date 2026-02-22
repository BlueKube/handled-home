import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useReferralCodes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const codes = useQuery({
    queryKey: ["referral-codes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*, referral_programs(name, status)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (programId: string) => {
      const code = generateCode();
      const { data, error } = await supabase
        .from("referral_codes")
        .insert({ program_id: programId, user_id: user!.id, code } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-codes"] });
      toast.success("Referral code generated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { codes, generateCode: generateCodeMutation };
}
