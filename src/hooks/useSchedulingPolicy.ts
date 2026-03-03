import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SchedulingPolicyValues {
  appointment_window_minutes: number;
  eta_range_display: string;
  arrival_notification_minutes: number;
  preference_pricing_mode: string;
}

interface ConfigRow {
  id: string;
  config_key: string;
  config_value: any;
  description: string | null;
  updated_at: string;
  updated_by_user_id: string | null;
}

const SCHEDULING_KEYS = [
  "scheduling.appointment_window_minutes",
  "scheduling.eta_range_display",
  "scheduling.arrival_notification_minutes",
  "scheduling.preference_pricing_mode",
] as const;

const DEFAULTS: SchedulingPolicyValues = {
  appointment_window_minutes: 120,
  eta_range_display: "day_plus_range",
  arrival_notification_minutes: 15,
  preference_pricing_mode: "scarcity",
};

export function useSchedulingPolicy() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["scheduling-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_system_config")
        .select("*")
        .in("config_key", [...SCHEDULING_KEYS])
        .order("config_key");
      if (error) throw error;
      return data as ConfigRow[];
    },
    staleTime: 60_000,
  });

  const rows = query.data ?? [];

  const resolved: SchedulingPolicyValues = {
    appointment_window_minutes:
      getVal(rows, "scheduling.appointment_window_minutes") ?? DEFAULTS.appointment_window_minutes,
    eta_range_display:
      getVal(rows, "scheduling.eta_range_display") ?? DEFAULTS.eta_range_display,
    arrival_notification_minutes:
      getVal(rows, "scheduling.arrival_notification_minutes") ?? DEFAULTS.arrival_notification_minutes,
    preference_pricing_mode:
      getVal(rows, "scheduling.preference_pricing_mode") ?? DEFAULTS.preference_pricing_mode,
  };

  const updatePolicy = useMutation({
    mutationFn: async ({
      key,
      value,
      reason,
    }: {
      key: string;
      value: any;
      reason: string;
    }) => {
      const row = rows.find((r) => r.config_key === key);
      if (!row) throw new Error(`Config key ${key} not found`);

      // Update config value
      const { error: updateErr } = await supabase
        .from("admin_system_config")
        .update({
          config_value: value,
          updated_at: new Date().toISOString(),
          updated_by_user_id: user?.id ?? null,
        })
        .eq("id", row.id);
      if (updateErr) throw updateErr;

      // Write audit log
      const { error: auditErr } = await supabase
        .from("admin_audit_log")
        .insert({
          admin_user_id: user!.id,
          entity_type: "admin_system_config",
          entity_id: row.id,
          action: "update",
          before: { config_value: row.config_value },
          after: { config_value: value },
          reason,
        });
      if (auditErr) console.error("Audit log failed:", auditErr);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scheduling-policy"] });
    },
  });

  return {
    values: resolved,
    rows,
    isLoading: query.isLoading,
    updatePolicy,
  };
}

function getVal(rows: ConfigRow[], key: string): any {
  const row = rows.find((r) => r.config_key === key);
  return row?.config_value ?? null;
}
