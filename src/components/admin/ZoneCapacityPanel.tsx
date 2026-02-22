import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUpdateZone, type ZoneWithRegion } from "@/hooks/useZones";
import { useServiceDayCapacity } from "@/hooks/useServiceDayCapacity";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ZoneCapacityPanelProps {
  zone: ZoneWithRegion;
}

export function ZoneCapacityPanel({ zone }: ZoneCapacityPanelProps) {
  const [maxStops, setMaxStops] = useState(zone.max_stops_per_day);
  const [maxMinutes, setMaxMinutes] = useState(zone.max_minutes_per_day);
  const [buffer, setBuffer] = useState(zone.buffer_percent);
  const updateZone = useUpdateZone();
  const { capacities } = useServiceDayCapacity(zone.id);

  useEffect(() => {
    setMaxStops(zone.max_stops_per_day);
    setMaxMinutes(zone.max_minutes_per_day);
    setBuffer(zone.buffer_percent);
  }, [zone]);

  const handleSave = async () => {
    try {
      await updateZone.mutateAsync({
        id: zone.id,
        max_stops_per_day: maxStops,
        max_minutes_per_day: maxMinutes,
        buffer_percent: buffer,
      });
      toast.success("Capacity updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const hasChanges =
    maxStops !== zone.max_stops_per_day ||
    maxMinutes !== zone.max_minutes_per_day ||
    buffer !== zone.buffer_percent;

  const totalAssigned = capacities.reduce((s, c) => s + c.assigned_count, 0);
  const totalMax = capacities.reduce((s, c) => s + c.max_homes + Math.floor(c.max_homes * c.buffer_percent / 100), 0);
  const pct = totalMax > 0 ? Math.round((totalAssigned / totalMax) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Max Homes / Day</Label>
          <Input type="number" min={1} value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Max Minutes / Day</Label>
          <Input type="number" min={1} value={maxMinutes} onChange={(e) => setMaxMinutes(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Buffer %</Label>
          <Input type="number" min={0} max={100} value={buffer} onChange={(e) => setBuffer(Number(e.target.value))} />
          <p className="text-caption">Overbooking tolerance (advisory)</p>
        </div>
      </div>

      <Card className="bg-muted/50 p-4 space-y-2">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Capacity: {totalAssigned} / {totalMax > 0 ? totalMax : maxStops} scheduled
            </p>
            {totalMax > 0 && <Progress value={pct} className="h-2 mt-2" />}
            {totalMax === 0 && (
              <p className="text-caption">Configure service day capacity rows to enable assignment.</p>
            )}
          </div>
        </div>
      </Card>

      {hasChanges && (
        <Button onClick={handleSave} disabled={updateZone.isPending} className="w-full">
          {updateZone.isPending ? "Saving…" : "Save Capacity"}
        </Button>
      )}
    </div>
  );
}
