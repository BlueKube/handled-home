import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useZoneOpsConfig, useUpsertZoneOpsConfig } from "@/hooks/useZoneOpsConfig";
import { toast } from "sonner";

interface ZoneOpsConfigPanelProps {
  zoneId: string;
}

export function ZoneOpsConfigPanel({ zoneId }: ZoneOpsConfigPanelProps) {
  const { data: config, isLoading } = useZoneOpsConfig(zoneId);
  const upsert = useUpsertZoneOpsConfig();

  const [homeLabel, setHomeLabel] = useState("");
  const [homeLat, setHomeLat] = useState("");
  const [homeLng, setHomeLng] = useState("");
  const [targetStops, setTargetStops] = useState("15");
  const [maxStops, setMaxStops] = useState("");

  useEffect(() => {
    if (config) {
      setHomeLabel(config.provider_home_label ?? "");
      setHomeLat(config.provider_home_lat?.toString() ?? "");
      setHomeLng(config.provider_home_lng?.toString() ?? "");
      setTargetStops(config.target_stops_per_week?.toString() ?? "15");
      setMaxStops(config.max_stops_per_week?.toString() ?? "");
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        zone_id: zoneId,
        provider_home_label: homeLabel || null,
        provider_home_lat: homeLat ? parseFloat(homeLat) : null,
        provider_home_lng: homeLng ? parseFloat(homeLng) : null,
        target_stops_per_week: parseInt(targetStops) || 15,
        max_stops_per_week: maxStops ? parseInt(maxStops) : null,
      });
      toast.success("Ops config saved");
    } catch {
      toast.error("Could not save ops config");
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Configure operational parameters for route optimization and capacity planning.
      </p>

      <div className="space-y-2">
        <Label>Provider Home Base Label</Label>
        <Input
          placeholder="e.g. Main warehouse"
          value={homeLabel}
          onChange={(e) => setHomeLabel(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Latitude</Label>
          <Input
            type="number"
            step="any"
            placeholder="34.0522"
            value={homeLat}
            onChange={(e) => setHomeLat(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Longitude</Label>
          <Input
            type="number"
            step="any"
            placeholder="-118.2437"
            value={homeLng}
            onChange={(e) => setHomeLng(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Target Stops/Week</Label>
          <Input
            type="number"
            value={targetStops}
            onChange={(e) => setTargetStops(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max Stops/Week</Label>
          <Input
            type="number"
            placeholder="Optional"
            value={maxStops}
            onChange={(e) => setMaxStops(e.target.value)}
          />
        </div>
      </div>

      <Button size="sm" className="w-full" onClick={handleSave} disabled={upsert.isPending}>
        {upsert.isPending ? "Saving…" : config ? "Update Config" : "Create Config"}
      </Button>
    </div>
  );
}
