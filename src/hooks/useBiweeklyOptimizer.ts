import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BiweeklyRecommendation {
  recommended: "A" | "B";
  reason: string;
  aCount: number;
  bCount: number;
}

/**
 * Client-side biweekly pattern optimizer.
 * Recommends A (weeks 1&3) or B (weeks 2&4) based on
 * existing stop balance across routines in the zone.
 */
export function useBiweeklyOptimizer(zoneId: string | null) {
  return useQuery<BiweeklyRecommendation | null>({
    queryKey: ["biweekly-optimizer", zoneId],
    enabled: !!zoneId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!zoneId) return null;

      // Fetch all active routine items in this zone that are biweekly
      const { data: routines, error: routinesErr } = await supabase
        .from("routines")
        .select("id")
        .eq("zone_id", zoneId)
        .eq("status", "active");
      if (routinesErr) throw routinesErr;

      if (!routines || routines.length === 0) {
        return null;
      }

      const routineIds = routines.map((r) => r.id);

      // Get all versions for these routines (latest locked or draft)
      const { data: versions, error: versionsErr } = await supabase
        .from("routine_versions")
        .select("id, routine_id, status")
        .in("routine_id", routineIds)
        .in("status", ["locked", "draft"])
        .order("version_number", { ascending: false });
      if (versionsErr) throw versionsErr;

      if (!versions || versions.length === 0) {
        return null;
      }

      // Take latest version per routine
      const latestVersionIds = new Set<string>();
      const seenRoutines = new Set<string>();
      for (const v of versions) {
        if (!seenRoutines.has(v.routine_id)) {
          seenRoutines.add(v.routine_id);
          latestVersionIds.add(v.id);
        }
      }

      // Fetch biweekly items
      const { data: items, error: itemsErr } = await supabase
        .from("routine_items")
        .select("cadence_type, cadence_detail")
        .in("routine_version_id", Array.from(latestVersionIds))
        .eq("cadence_type", "biweekly");
      if (itemsErr) throw itemsErr;

      let aCount = 0;
      let bCount = 0;
      for (const item of items ?? []) {
        const pattern = (item.cadence_detail as any)?.pattern ?? "A";
        if (pattern === "A") aCount++;
        else bCount++;
      }

      const recommended: "A" | "B" = aCount <= bCount ? "A" : "B";
      const reason = aCount === bCount
        ? "Even split — Pattern A recommended by default"
        : `Pattern ${recommended} is underloaded (A: ${aCount}, B: ${bCount}) — adding here balances the zone`;

      return { recommended, reason, aCount, bCount };
    },
  });
}
