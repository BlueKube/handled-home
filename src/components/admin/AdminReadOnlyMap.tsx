import { useMemo } from "react";
import Map, { Marker } from "react-map-gl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapStop {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  status?: string;
}

interface AdminReadOnlyMapProps {
  stops: MapStop[];
  title?: string;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "hsl(var(--accent))",
  IN_PROGRESS: "hsl(var(--warning, 45 93% 47%))",
  ASSIGNED: "hsl(var(--primary))",
  SCHEDULED: "hsl(var(--primary))",
};

export function AdminReadOnlyMap({ stops, title }: AdminReadOnlyMapProps) {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const validStops = useMemo(
    () => stops.filter((s) => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng)),
    [stops]
  );

  const center = useMemo(() => {
    if (validStops.length === 0) return { lat: 39.8283, lng: -98.5795 }; // US center
    const avgLat = validStops.reduce((s, p) => s + p.lat, 0) / validStops.length;
    const avgLng = validStops.reduce((s, p) => s + p.lng, 0) / validStops.length;
    return { lat: avgLat, lng: avgLng };
  }, [validStops]);

  if (!token) {
    return (
      <Card className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Map unavailable — VITE_MAPBOX_ACCESS_TOKEN not set.</p>
      </Card>
    );
  }

  if (validStops.length === 0) {
    return (
      <Card className="p-4 text-center">
        <p className="text-xs text-muted-foreground">No geocoded stops to display.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {title && (
        <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <Badge variant="outline" className="text-xs">{validStops.length} stops</Badge>
        </div>
      )}
      <div className="h-64">
        <Map
          mapboxAccessToken={token}
          initialViewState={{
            latitude: center.lat,
            longitude: center.lng,
            zoom: validStops.length === 1 ? 14 : 11,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactive={false}
        >
          {validStops.map((stop, i) => (
            <Marker key={stop.id} latitude={stop.lat} longitude={stop.lng}>
              <div
                className="flex items-center justify-center rounded-full text-[10px] font-bold shadow-md"
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: STATUS_COLORS[stop.status || "ASSIGNED"] || "hsl(var(--primary))",
                  color: "white",
                }}
              >
                {i + 1}
              </div>
            </Marker>
          ))}
        </Map>
      </div>
    </Card>
  );
}