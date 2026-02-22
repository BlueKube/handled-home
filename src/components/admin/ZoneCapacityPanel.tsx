import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUpdateZone, type ZoneWithRegion } from "@/hooks/useZones";
import { toast } from "sonner";
import { Info } from "lucide-react";

interface ZoneCapacityPanelProps {
  zone: ZoneWithRegion;
}

export function ZoneCapacityPanel({ zone }: ZoneCapacityPanelProps) {
  const [maxStops, setMaxStops] = useState(zone.max_stops_per_day);
  const [maxMinutes, setMaxMinutes] = useState(zone.max_minutes_per_day);
  const [buffer, setBuffer] = useState(zone.buffer_percent);
  const updateZone = useUpdateZone();

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

      <Card className="bg-muted/50 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Capacity: 0 / {maxStops} scheduled</p>
          <p className="text-caption">Scheduling starts in Module 06.</p>
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
