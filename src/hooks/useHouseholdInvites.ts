import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Auto-accepts pending household invites for the current user.
 * Call once on customer page load (e.g., in PropertyGate or dashboard).
 * Only runs once per session to avoid redundant RPCs.
 */
export function useHouseholdInvites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || hasRun.current) return;
    hasRun.current = true;

    supabase.rpc("accept_household_invites").then(({ data, error }) => {
      if (error) {
        console.warn("accept_household_invites failed:", error.message);
        return;
      }
      if (data && data > 0) {
        // Invites accepted — refresh property data
        queryClient.invalidateQueries({ queryKey: ["property"] });
        queryClient.invalidateQueries({ queryKey: ["household-members"] });
        queryClient.invalidateQueries({ queryKey: ["isHouseholdMember"] });
      }
    });
  }, [user, queryClient]);
}
