import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users, CalendarDays, Package } from "lucide-react";
import { CADENCE_LABELS } from "@/hooks/useRoutinePreview";

interface RoutineSummary {
  routine_id: string;
  customer_id: string;
  property_id: string;
  plan_id: string;
  status: string;
  effective_at: string | null;
  version_number: number;
  version_status: string;
  items: Array<{
    sku_name: string;
    cadence_type: string;
    duration_minutes: number;
    proof_photo_count: number;
    checklist_count: number;
  }>;
}

export default function AdminBundles() {
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineSummary | null>(null);

  const { data: routines, isLoading } = useQuery({
    queryKey: ["admin-routines"],
    queryFn: async () => {
      // Fetch all active/draft routines with their latest version + items
      const { data: routineRows, error } = await supabase
        .from("routines")
        .select("*")
        .in("status", ["draft", "active"])
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const results: RoutineSummary[] = [];
      for (const r of routineRows ?? []) {
        const { data: version } = await supabase
          .from("routine_versions")
          .select("*")
          .eq("routine_id", r.id)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();

        let items: any[] = [];
        if (version) {
          const { data: itemRows } = await supabase
            .from("routine_items")
            .select("sku_name, cadence_type, duration_minutes, proof_photo_count, checklist_count")
            .eq("routine_version_id", version.id);
          items = itemRows ?? [];
        }

        results.push({
          routine_id: r.id,
          customer_id: r.customer_id,
          property_id: r.property_id,
          plan_id: r.plan_id,
          status: r.status,
          effective_at: r.effective_at,
          version_number: version?.version_number ?? 0,
          version_status: version?.status ?? "none",
          items,
        });
      }
      return results;
    },
  });

  return (
    <div className="p-4 space-y-4 animate-fade-in">
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
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">{r.customer_id.slice(0, 8)}…</span>
                  <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {r.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" /> {r.items.length} services
                  </span>
                  <span>v{r.version_number}</span>
                  {r.effective_at && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(r.effective_at).toLocaleDateString()}
                    </span>
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
                        <p className="text-sm font-medium">{item.sku_name ?? "Unknown"}</p>
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
