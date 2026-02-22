import { useState } from "react";
import { useZones, type ZoneWithRegion } from "@/hooks/useZones";
import { useRegions } from "@/hooks/useRegions";
import { useZoneProviders } from "@/hooks/useZoneProviders";
import { useZoneHomeCounts } from "@/hooks/useZoneInsights";
import { ZoneFormSheet } from "./ZoneFormSheet";
import { ZoneDetailSheet } from "./ZoneDetailSheet";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, Calendar, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function ProviderSummary({ zoneId }: { zoneId: string }) {
  const { data } = useZoneProviders(zoneId);
  if (!data?.length) return <span className="text-caption">No providers</span>;
  const primary = data.filter((a) => a.assignment_type === "primary").length;
  const backup = data.filter((a) => a.assignment_type === "backup").length;
  return <span className="text-caption">{primary} pri • {backup} bak</span>;
}

export function ZonesTab() {
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailZoneId, setDetailZoneId] = useState<string | null>(null);
  const [prefillZips, setPrefillZips] = useState<string[]>();

  const { data: regions } = useRegions();
  const { data: zones, isLoading } = useZones(regionFilter === "all" ? undefined : regionFilter);

  const filteredZones = zones?.filter((z) => z.status !== "archived") || [];

  const openCreate = (zips?: string[]) => {
    setPrefillZips(zips);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions?.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => openCreate()}>
          <Plus className="h-4 w-4 mr-1" /> New Zone
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !filteredZones.length ? (
        <p className="text-muted-foreground text-center py-12">No zones yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {filteredZones.map((zone) => {
            const dayLabel = zone.default_service_day.charAt(0).toUpperCase() + zone.default_service_day.slice(1, 3);
            const windowLabel = zone.default_service_window ? ` • ${zone.default_service_window.toUpperCase()}` : "";

            return (
              <Card
                key={zone.id}
                className="p-4 press-feedback cursor-pointer space-y-2"
                onClick={() => setDetailZoneId(zone.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{zone.name}</p>
                    <p className="text-caption">{zone.regions?.name}</p>
                  </div>
                  <StatusBadge status={zone.status} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {dayLabel}{windowLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {zone.zip_codes.length} zips
                  </span>
                  <span>Max: {zone.max_stops_per_day}/day</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> <ProviderSummary zoneId={zone.id} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ZoneFormSheet open={createOpen} onOpenChange={setCreateOpen} prefillZips={prefillZips} />
      <ZoneDetailSheet zoneId={detailZoneId} onClose={() => setDetailZoneId(null)} />
    </div>
  );
}
