import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useServiceDayCapacity } from "@/hooks/useServiceDayCapacity";
import { useServiceDayAdmin } from "@/hooks/useServiceDayAdmin";
import { ServiceDayOverrideModal } from "./ServiceDayOverrideModal";
import { ArrowLeftRight, ChevronDown, History } from "lucide-react";
import { format } from "date-fns";

interface ServiceDayZoneDetailProps {
  zoneId: string;
  zoneName: string;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function stabilityLabel(pct: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (pct < 70) return { label: "Stable", variant: "default" };
  if (pct < 90) return { label: "Tight", variant: "secondary" };
  return { label: "Risk", variant: "destructive" };
}

export function ServiceDayZoneDetail({ zoneId, zoneName }: ServiceDayZoneDetailProps) {
  const { capacities, isLoading: capLoading } = useServiceDayCapacity(zoneId);
  const { assignments, overrideLogs, overrideAssignment, isLoading: assignLoading } = useServiceDayAdmin(zoneId);
  const [overrideTarget, setOverrideTarget] = useState<{ id: string; day: string } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{zoneName} — Capacity</h3>
        <p className="text-caption">Utilization per day</p>
      </div>

      {/* Capacity bars */}
      <div className="space-y-3">
        {capacities.map((cap) => {
          const effectiveMax = cap.max_homes + Math.floor(cap.max_homes * cap.buffer_percent / 100);
          const pct = effectiveMax > 0 ? Math.round((cap.assigned_count / effectiveMax) * 100) : 0;
          const stability = stabilityLabel(pct);

          return (
            <div key={cap.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{cap.day_of_week}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {cap.assigned_count} / {effectiveMax}
                  </span>
                  <Badge variant={stability.variant}>{stability.label}</Badge>
                </div>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
        {capacities.length === 0 && !capLoading && (
          <p className="text-caption">No capacity rows configured. Add them to enable service day assignment.</p>
        )}
      </div>

      {/* Assignments */}
      <div>
        <h3 className="text-lg font-semibold">Assignments</h3>
        <p className="text-caption mb-3">{assignments.length} active</p>

        <div className="space-y-2">
          {assignments.map((a) => (
            <Card key={a.id} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium capitalize">{a.day_of_week}</p>
                <p className="text-caption text-xs">
                  {a.status === "confirmed" ? "Confirmed" : "Offer pending"}
                  {a.rejection_used ? " · Rejected once" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOverrideTarget({ id: a.id, day: a.day_of_week })}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </Card>
          ))}
          {assignments.length === 0 && !assignLoading && (
            <p className="text-caption">No assignments yet.</p>
          )}
        </div>
      </div>

      {/* M6: Override History */}
      {overrideLogs.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Override History ({overrideLogs.length})
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {overrideLogs.map((log) => (
              <Card key={log.id} className="p-3 text-sm space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">
                    {(log.before as any)?.day_of_week ?? "?"} → {(log.after as any)?.day_of_week ?? "?"}
                  </span>
                  <span className="text-caption text-xs">
                    {format(new Date(log.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs capitalize">
                  {log.reason.replace(/_/g, " ")}
                </p>
                {log.notes && (
                  <p className="text-xs text-muted-foreground italic">{log.notes}</p>
                )}
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {overrideTarget && (
        <ServiceDayOverrideModal
          open={!!overrideTarget}
          onOpenChange={(open) => !open && setOverrideTarget(null)}
          assignmentId={overrideTarget.id}
          currentDay={overrideTarget.day}
          onOverride={(data) =>
            overrideAssignment.mutate(data, { onSuccess: () => setOverrideTarget(null) })
          }
          isPending={overrideAssignment.isPending}
          capacities={capacities}
        />
      )}
    </div>
  );
}
