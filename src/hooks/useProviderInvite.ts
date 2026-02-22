import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InviteValidation {
  valid: boolean;
  reason?: string;
  invite_id?: string;
  allowed_zone_ids?: string[];
}

export function useProviderInvite() {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<InviteValidation | null>(null);

  const validateCode = async (code: string): Promise<InviteValidation> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("validate_provider_invite", { p_code: code });
      if (error) throw error;
      const result = data as unknown as InviteValidation;
      setValidation(result);
      return result;
    } catch (err: any) {
      const result = { valid: false, reason: err.message || "Validation failed" };
      setValidation(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  return { validateCode, validation, loading };
}
