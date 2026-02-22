import { useState } from "react";
import { useZones } from "@/hooks/useZones";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ServiceDayZoneDetail } from "@/components/admin/ServiceDayZoneDetail";
import { useServiceDayCapacity } from "@/hooks/useServiceDayCapacity";
import { Skeleton } from "@/components/ui/skeleton";

function ZoneCard({ zone, onClick }: { zone: any; onClick: () => void }) {
  const { capacities } = useServiceDayCapacity(zone.id);
  const totalAssigned = capacities.reduce((s, c) => s + c.assigned_count, 0);
  const totalMax = capacities.reduce((s, c) => s + c.max_homes + Math.floor(c.max_homes * c.buffer_percent / 100), 0);
  const pct = totalMax > 0 ? Math.round((totalAssigned / totalMax) * 100) : 0;

  let statusLabel = "No capacity";
  let variant: "default" | "secondary" | "destructive" = "secondary";
  if (totalMax > 0) {
    if (pct < 70) { statusLabel = "Stable"; variant = "default"; }
    else if (pct < 90) { statusLabel = "Tight"; variant = "secondary"; }
    else { statusLabel = "Risk"; variant = "destructive"; }
  }

  return (
    <Card className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{zone.name}</p>
          <p className="text-caption text-sm capitalize">Default: {zone.default_service_day}</p>
        </div>
        <div className="text-right">
          <Badge variant={variant}>{statusLabel}</Badge>
          {totalMax > 0 && (
            <p className="text-caption text-xs mt-1">{totalAssigned}/{totalMax} assigned</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AdminServiceDays() {
  const { data: zones, isLoading } = useZones();
  const [selectedZone, setSelectedZone] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="animate-fade-in space-y-4 pb-24">
      <div>
        <h1 className="text-h2">Service Days</h1>
        <p className="text-caption">Zone utilization, assignments, and overrides.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {(zones ?? []).map((z) => (
            <ZoneCard key={z.id} zone={z} onClick={() => setSelectedZone({ id: z.id, name: z.name })} />
          ))}
          {(zones ?? []).length === 0 && (
            <p className="text-caption text-center py-8">No zones configured yet.</p>
          )}
        </div>
      )}

      <Sheet open={!!selectedZone} onOpenChange={(open) => !open && setSelectedZone(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Zone Detail</SheetTitle>
          </SheetHeader>
          {selectedZone && (
            <div className="mt-4">
              <ServiceDayZoneDetail zoneId={selectedZone.id} zoneName={selectedZone.name} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
