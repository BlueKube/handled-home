import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users, CalendarDays, Package } from "lucide-react";
import { CADENCE_LABELS } from "@/hooks/useRoutinePreview";

interface RoutineItem {
  sku_name: string;
  cadence_type: string;
  duration_minutes: number;
  proof_photo_count: number;
  checklist_count: number;
}

interface RoutineSummary {
  routine_id: string;
  customer_id: string;
  customer_name: string;
  property_id: string;
  plan_id: string;
  plan_name: string;
  service_day: string | null;
  status: string;
  effective_at: string | null;
  version_number: number;
  version_status: string;
  items: RoutineItem[];
}

export default function AdminBundles() {
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineSummary | null>(null);

  const { data: routines, isLoading } = useQuery({
    queryKey: ["admin-routines"],
    queryFn: async () => {
      // M8: Single-pass query approach instead of N+1
      // 1. Fetch all routines
      const { data: routineRows, error } = await supabase
        .from("routines")
        .select("*")
        .in("status", ["draft", "active"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      if (!routineRows || routineRows.length === 0) return [];

      const routineIds = routineRows.map((r) => r.id);
      const planIds = [...new Set(routineRows.map((r) => r.plan_id))];
      const customerIds = [...new Set(routineRows.map((r) => r.customer_id))];
      const propertyIds = [...new Set(routineRows.map((r) => r.property_id))];

      // 2. Batch fetch versions, plans, profiles, service day assignments
      const [versionsRes, plansRes, profilesRes, assignmentsRes] = await Promise.all([
        supabase
          .from("routine_versions")
          .select("id, routine_id, version_number, status")
          .in("routine_id", routineIds)
          .order("version_number", { ascending: false }),
        supabase
          .from("plans")
          .select("id, name")
          .in("id", planIds),
        supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", customerIds),
        supabase
          .from("service_day_assignments")
          .select("property_id, day_of_week, status")
          .in("property_id", propertyIds)
          .eq("status", "confirmed"),
      ]);

      // Build lookup maps
      const planMap = new Map<string, string>();
      for (const p of plansRes.data ?? []) planMap.set(p.id, p.name);

      const profileMap = new Map<string, string>();
      for (const p of profilesRes.data ?? []) profileMap.set(p.user_id, p.full_name);

      const serviceDayMap = new Map<string, string>();
      for (const a of assignmentsRes.data ?? []) serviceDayMap.set(a.property_id, a.day_of_week);

      // Get latest version per routine
      const latestVersionMap = new Map<string, { id: string; version_number: number; status: string }>();
      for (const v of versionsRes.data ?? []) {
        if (!latestVersionMap.has(v.routine_id)) {
          latestVersionMap.set(v.routine_id, { id: v.id, version_number: v.version_number, status: v.status });
        }
      }

      // 3. Batch fetch items for all latest versions
      const versionIds = [...latestVersionMap.values()].map((v) => v.id);
      const { data: allItems } = await supabase
        .from("routine_items")
        .select("routine_version_id, sku_name, cadence_type, duration_minutes, proof_photo_count, checklist_count")
        .in("routine_version_id", versionIds);

      const itemsByVersion = new Map<string, RoutineItem[]>();
      for (const item of allItems ?? []) {
        const list = itemsByVersion.get(item.routine_version_id) ?? [];
        list.push({
          sku_name: item.sku_name ?? "Unknown",
          cadence_type: item.cadence_type,
          duration_minutes: item.duration_minutes ?? 0,
          proof_photo_count: item.proof_photo_count ?? 0,
          checklist_count: item.checklist_count ?? 0,
        });
        itemsByVersion.set(item.routine_version_id, list);
      }

      // 4. Assemble results
      return routineRows.map((r): RoutineSummary => {
        const version = latestVersionMap.get(r.id);
        return {
          routine_id: r.id,
          customer_id: r.customer_id,
          customer_name: profileMap.get(r.customer_id) ?? r.customer_id.slice(0, 8) + "…",
          property_id: r.property_id,
          plan_id: r.plan_id,
          plan_name: planMap.get(r.plan_id) ?? "Unknown Plan",
          service_day: serviceDayMap.get(r.property_id) ?? null,
          status: r.status,
          effective_at: r.effective_at,
          version_number: version?.version_number ?? 0,
          version_status: version?.status ?? "none",
          items: version ? (itemsByVersion.get(version.id) ?? []) : [],
        };
      });
    },
  });

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <h1 className="text-h2">Bundles / Routines</h1>
      <p className="text-caption">Read-only view of all customer routines.</p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (routines ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No routines yet.</p>
      ) : (
        <div className="space-y-2">
          {(routines ?? []).map((r) => (
            <Card
              key={r.routine_id}
              className="cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => setSelectedRoutine(r)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{r.customer_name}</span>
                  <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {r.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{r.plan_name}</span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" /> {r.items.length} services
                  </span>
                  {r.service_day && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {r.service_day.charAt(0).toUpperCase() + r.service_day.slice(1, 3)}
                    </span>
                  )}
                  {r.effective_at && (
                    <span>{new Date(r.effective_at).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedRoutine} onOpenChange={(open) => !open && setSelectedRoutine(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Routine Detail</SheetTitle>
          </SheetHeader>
          {selectedRoutine && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{selectedRoutine.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span>{selectedRoutine.plan_name}</span>
                </div>
                {selectedRoutine.service_day && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Day</span>
                    <span className="capitalize">{selectedRoutine.service_day}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={selectedRoutine.status === "active" ? "default" : "secondary"}>
                    {selectedRoutine.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span>v{selectedRoutine.version_number} ({selectedRoutine.version_status})</span>
                </div>
                {selectedRoutine.effective_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective</span>
                    <span>{new Date(selectedRoutine.effective_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-caption uppercase tracking-wider mb-2">Services</p>
                {selectedRoutine.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No services in this routine.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRoutine.items.map((item, i) => (
                      <div key={i} className="rounded-lg border border-border p-3 space-y-1">
                        <p className="text-sm font-medium">{item.sku_name}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{CADENCE_LABELS[item.cadence_type] ?? item.cadence_type}</span>
                          {item.duration_minutes > 0 && <span>{item.duration_minutes} min</span>}
                          {item.proof_photo_count > 0 && <span>{item.proof_photo_count} photos</span>}
                          {item.checklist_count > 0 && <span>{item.checklist_count} checks</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
