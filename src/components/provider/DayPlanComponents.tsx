import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProviderDayPlan, type DayPlanStop } from "@/hooks/useProviderDayPlan";
import {
  Package, CheckCircle2, Circle, ChevronDown, Clock, MapPin, Wrench, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

// Equipment labels for display
const EQUIPMENT_LABELS: Record<string, string> = {
  mower_push: "Push Mower",
  mower_riding: "Riding Mower",
  trimmer: "String Trimmer",
  edger: "Edger",
  blower: "Leaf Blower",
  hedge_trimmer: "Hedge Trimmer",
  chainsaw: "Chainsaw",
  pressure_washer: "Pressure Washer",
  pool_equipment: "Pool Equipment",
  pest_sprayer: "Pest Sprayer",
  cleaning_kit: "Cleaning Kit",
};

function getEquipmentLabel(key: string): string {
  return EQUIPMENT_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Today's Loadout — aggregated equipment checklist */
export function TodayLoadout() {
  const { data: plan, isLoading } = useProviderDayPlan();
  const [packed, setPacked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(true);

  if (isLoading) {
    return <Skeleton className="h-24 rounded-xl" />;
  }

  if (!plan || plan.allEquipment.length === 0) return null;

  const allPacked = plan.allEquipment.every((e) => packed.has(e));

  const toggle = (key: string) => {
    setPacked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn(allPacked && "border-primary/30")}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Today's Loadout
                <Badge variant={allPacked ? "default" : "secondary"} className="text-[10px]">
                  {packed.size}/{plan.allEquipment.length}
                </Badge>
              </CardTitle>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            <div className="space-y-1">
              {plan.allEquipment.map((eq) => {
                const isPacked = packed.has(eq);
                return (
                  <button
                    key={eq}
                    onClick={() => toggle(eq)}
                    className={cn(
                      "flex items-center gap-2 w-full py-1.5 px-2 rounded-md text-left transition-colors text-sm",
                      isPacked
                        ? "bg-primary/5 text-muted-foreground line-through"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {isPacked ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    )}
                    {getEquipmentLabel(eq)}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

/** Enhanced stop card showing bundled tasks, duration, and ETA */
export function DayPlanStopCard({ stop, index }: { stop: DayPlanStop; index: number }) {
  const isInProgress = stop.scheduleState === "in_progress";
  const addr = stop.property;

  const etaDisplay = useMemo(() => {
    if (!stop.etaRangeStart || !stop.etaRangeEnd) return null;
    try {
      const start = format(parseISO(stop.etaRangeStart), "h:mm a");
      const end = format(parseISO(stop.etaRangeEnd), "h:mm a");
      return `${start} – ${end}`;
    } catch {
      return null;
    }
  }, [stop.etaRangeStart, stop.etaRangeEnd]);

  return (
    <Card className={cn("p-3", isInProgress && "ring-2 ring-accent/40")}>
      <div className="flex items-start gap-3">
        {/* Stop number */}
        <div className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          index === 0 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
        )}>
          {stop.routeOrder ?? index + 1}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Address */}
          <p className="text-sm font-medium truncate">
            {addr ? `${addr.street_address}, ${addr.city}` : "Property"}
          </p>

          {/* ETA + Duration row */}
          <div className="flex items-center gap-3 flex-wrap">
            {etaDisplay && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {etaDisplay}
              </span>
            )}
            {stop.stopDurationMinutes != null && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Wrench className="h-3 w-3" />
                ~{Math.round(stop.stopDurationMinutes)} min
              </span>
            )}
            {stop.tasks.length > 1 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {stop.tasks.length} tasks bundled
              </Badge>
            )}
          </div>

          {/* Task list */}
          {stop.tasks.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {stop.tasks.map((t) => (
                <Badge key={t.id} variant="secondary" className="text-[10px]">
                  {t.skuName ?? "Task"}
                  {t.durationMinutes ? ` (${t.durationMinutes}m)` : ""}
                </Badge>
              ))}
            </div>
          )}

          {/* Equipment needed for this stop */}
          {stop.equipmentRequired.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-1">
              <Package className="h-3 w-3 text-muted-foreground shrink-0" />
              {stop.equipmentRequired.map((eq) => (
                <span key={eq} className="text-[10px] text-muted-foreground">
                  {getEquipmentLabel(eq)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Summary bar for the day plan */
export function DayPlanSummary() {
  const { data: plan, isLoading } = useProviderDayPlan();

  if (isLoading || !plan || plan.totalStops === 0) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground px-1">
      <span className="inline-flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {plan.totalStops} stop{plan.totalStops !== 1 ? "s" : ""}
      </span>
      <span className="inline-flex items-center gap-1">
        <Wrench className="h-3 w-3" />
        ~{Math.round(plan.totalServiceMinutes)} min service
      </span>
      <span className="inline-flex items-center gap-1">
        <Package className="h-3 w-3" />
        {plan.allEquipment.length} item{plan.allEquipment.length !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
