import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Map } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  zip_codes?: string[] | null;
}

interface MapboxZoneSelectorProps {
  zones: Zone[];
  selectedZoneIds: string[];
  onToggleZone: (zoneId: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
}

export default function MapboxZoneSelector({
  zones,
  selectedZoneIds,
  onToggleZone,
  disabled,
  emptyMessage = "No zones available.",
}: MapboxZoneSelectorProps) {
  const hasMapboxToken = !!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  return (
    <div className="space-y-3">
      {/* Map placeholder — renders when Mapbox token is configured (future) */}
      {!hasMapboxToken && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-dashed border-border">
          <Map className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Map view coming soon</p>
            <p className="text-xs text-muted-foreground/70">Select zones from the list below</p>
          </div>
        </div>
      )}

      {/* Zone card list */}
      {zones.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
      ) : (
        zones.map((zone) => {
          const selected = selectedZoneIds.includes(zone.id);
          return (
            <Card
              key={zone.id}
              className={`press-feedback cursor-pointer ${selected ? "ring-2 ring-accent" : ""} ${disabled ? "opacity-60 pointer-events-none" : ""}`}
              onClick={() => onToggleZone(zone.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleZone(zone.id); } }}
              aria-label={`${selected ? "Deselect" : "Select"} ${zone.name}`}
            >
              <CardContent className="py-4 flex items-center gap-3">
                <Checkbox checked={selected} className="pointer-events-none" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{zone.name}</span>
                  </div>
                  {zone.zip_codes && zone.zip_codes.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ZIP: {zone.zip_codes.slice(0, 3).join(", ")}{zone.zip_codes.length > 3 ? ` +${zone.zip_codes.length - 3} more` : ""}
                    </p>
                  )}
                </div>
                {selected && <Badge variant="secondary">Requested</Badge>}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
