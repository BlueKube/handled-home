import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Preferences = {
  user_id: string;
  critical_enabled: boolean;
  service_updates_enabled: boolean;
  marketing_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string | null;
  updated_at: string;
};

const DEFAULTS: Omit<Preferences, "user_id" | "updated_at"> = {
  critical_enabled: true,
  service_updates_enabled: true,
  marketing_enabled: false,
  quiet_hours_enabled: true,
  quiet_hours_start: "21:00:00",
  quiet_hours_end: "08:00:00",
  timezone: null,
};

const QUERY_KEY = "notification-preferences";

export function useNotificationPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: preferences, isLoading } = useQuery({
    queryKey: [QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      // Try to fetch existing row
      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as Preferences;

      // No row — upsert defaults
      const { data: inserted, error: upsertErr } = await supabase
        .from("user_notification_preferences")
        .upsert({ user_id: userId!, ...DEFAULTS }, { onConflict: "user_id" })
        .select("*")
        .single();

      if (upsertErr) throw upsertErr;
      return inserted as Preferences;
    },
  });

  const { mutate: updatePreference } = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: unknown }) => {
      const { error } = await supabase
        .from("user_notification_preferences")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("user_id", userId!);
      if (error) throw error;
    },
    onMutate: async ({ field, value }) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEY, userId] });
      const prev = qc.getQueryData<Preferences>([QUERY_KEY, userId]);
      if (prev) {
        qc.setQueryData([QUERY_KEY, userId], { ...prev, [field]: value });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData([QUERY_KEY, userId], ctx.prev);
      toast.error("Failed to update preference. Please try again.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] }),
  });

  return { preferences, isLoading, updatePreference };
}
