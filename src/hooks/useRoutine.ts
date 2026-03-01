import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CadenceType = "weekly" | "biweekly" | "four_week" | "monthly" | "quarterly";

export interface RoutineItem {
  id: string;
  routine_version_id: string;
  sku_id: string;
  cadence_type: CadenceType;
  cadence_detail: { pattern?: "A" | "B"; weeks?: number[] };
  sku_name: string | null;
  fulfillment_mode: string | null;
  duration_minutes: number | null;
  proof_photo_labels: any;
  proof_photo_count: number;
  checklist_count: number;
  level_id: string | null;
  created_at: string;
}

export interface RoutineVersion {
  id: string;
  routine_id: string;
  version_number: number;
  status: string;
  effective_at: string | null;
  locked_at: string | null;
  created_at: string;
}

export interface Routine {
  id: string;
  customer_id: string;
  property_id: string;
  zone_id: string | null;
  plan_id: string;
  entitlement_version_id: string | null;
  status: string;
  effective_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoutineData {
  routine: Routine;
  version: RoutineVersion;
  items: RoutineItem[];
}

export function useRoutine(propertyId: string | null | undefined, planId?: string | null) {
  const { user } = useAuth();

  return useQuery<RoutineData | null>({
    queryKey: ["routine", propertyId],
    enabled: !!user && !!propertyId,
    queryFn: async () => {
      if (!user || !propertyId) return null;

      // Try to find existing draft or active routine
      const { data: routine, error: rErr } = await supabase
        .from("routines")
        .select("*")
        .eq("property_id", propertyId)
        .eq("customer_id", user.id)
        .in("status", ["draft", "active"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (rErr) throw rErr;

      if (routine) {
        // Get latest version (prefer draft)
        const { data: version } = await supabase
          .from("routine_versions")
          .select("*")
          .eq("routine_id", routine.id)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();

        const items = version
          ? (await supabase
              .from("routine_items")
              .select("*")
              .eq("routine_version_id", version.id)
            ).data ?? []
          : [];

        return {
          routine: routine as Routine,
          version: version as RoutineVersion,
          items: items as RoutineItem[],
        };
      }

      return null;
    },
  });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ propertyId, planId, zoneId, entitlementVersionId }: {
      propertyId: string;
      planId: string;
      zoneId?: string | null;
      entitlementVersionId?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Create routine
      const { data: routine, error: rErr } = await supabase
        .from("routines")
        .insert({
          customer_id: user.id,
          property_id: propertyId,
          plan_id: planId,
          zone_id: zoneId ?? null,
          entitlement_version_id: entitlementVersionId ?? null,
          status: "draft",
        })
        .select()
        .single();
      if (rErr) throw rErr;

      // Create initial version
      const { data: version, error: vErr } = await supabase
        .from("routine_versions")
        .insert({
          routine_id: routine.id,
          version_number: 1,
          status: "draft",
        })
        .select()
        .single();
      if (vErr) throw vErr;

      return { routine, version };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routine"] }),
  });
}
