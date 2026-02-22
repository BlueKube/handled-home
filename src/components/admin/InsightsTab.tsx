import { useNonServicedZipDemand, useZoneHomeCounts } from "@/hooks/useZoneInsights";
import { useZones } from "@/hooks/useZones";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightsTabProps {
  onCreateZoneWithZip: (zip: string) => void;
}

function HealthDot({ ratio }: { ratio: number }) {
  const color = ratio > 0.95 ? "bg-destructive" : ratio >= 0.6 ? "bg-success" : "bg-warning";
  const label = ratio > 0.95 ? "Over capacity" : ratio >= 0.6 ? "Healthy" : "Under-filled";
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={cn("h-2 w-2 rounded-full shrink-0", color)} />
      {label}
    </span>
  );
}

export function InsightsTab({ onCreateZoneWithZip }: InsightsTabProps) {
  const { data: nonServiced, isLoading: nsLoading } = useNonServicedZipDemand();
  const { data: zones, isLoading: zLoading } = useZones();
  const activeZones = zones?.filter((z) => z.status === "active") || [];
  const { data: homeCounts, isLoading: hcLoading } = useZoneHomeCounts(activeZones);

  return (
    <div className="space-y-6">
      {/* Non-serviced zip demand */}
      <div className="space-y-3">
        <h3 className="text-h3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" /> Expansion Signals
        </h3>
        {nsLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : !nonServiced?.length ? (
          <Card className="p-6 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-sm text-muted-foreground">All customer zip codes are covered by active zones.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {nonServiced.slice(0, 15).map((ns) => (
              <Card key={ns.zip_code} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{ns.zip_code}</p>
                    <p className="text-caption">{ns.count} propert{ns.count === 1 ? "y" : "ies"}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onCreateZoneWithZip(ns.zip_code)}>
                  Create Zone
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Zone health */}
      <div className="space-y-3">
        <h3 className="text-h3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-accent" /> Zone Health
        </h3>
        <p className="text-caption">Advisory. Scheduling enforcement begins in Module 06.</p>
        {zLoading || hcLoading ? (
          <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : !activeZones.length ? (
          <p className="text-muted-foreground text-center py-6">No active zones.</p>
        ) : (
          <div className="space-y-2">
            {activeZones.map((zone) => {
              const homes = homeCounts?.[zone.id] ?? 0;
              const ratio = zone.max_stops_per_day > 0 ? homes / zone.max_stops_per_day : 0;
              return (
                <Card key={zone.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium text-sm">{zone.name}</p>
                    <p className="text-caption">{homes} homes / {zone.max_stops_per_day} max</p>
                  </div>
                  <HealthDot ratio={ratio} />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
