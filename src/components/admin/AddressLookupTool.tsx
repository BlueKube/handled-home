import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Hexagon, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { latLngToCell, gridDisk } from "h3-js";
import { toast } from "sonner";

interface LookupResult {
  address: string;
  lat: number;
  lng: number;
  h3Index: string;
  zoneId: string | null;
  zoneName: string | null;
  method: string;
}

export function AddressLookupTool() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const handleLookup = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // Step 1: Geocode via Mapbox
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!mapboxToken) {
        toast.error("Mapbox token not configured");
        setLoading(false);
        return;
      }

      const geoRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1&country=US`
      );
      const geoData = await geoRes.json();

      if (!geoData.features?.length) {
        toast.error("Address not found");
        setLoading(false);
        return;
      }

      const [lng, lat] = geoData.features[0].center;
      const address = geoData.features[0].place_name;

      // Step 2: Compute H3 cell
      const h3Index = latLngToCell(lat, lng, 7);

      // Step 3: Try direct RPC lookup
      const { data: directResult } = await supabase.rpc("resolve_zone_by_h3", {
        p_h3_index: h3Index,
      });

      const dr = directResult as any;
      if (dr?.zone_id) {
        setResult({
          address,
          lat,
          lng,
          h3Index,
          zoneId: dr.zone_id,
          zoneName: dr.zone_name,
          method: "direct",
        });
        setLoading(false);
        return;
      }

      // Step 4: Ring expansion (client-side h3-js)
      const MAX_RINGS = 5;
      let found = false;
      for (let ring = 1; ring <= MAX_RINGS && !found; ring++) {
        const neighbors = gridDisk(h3Index, ring);
        for (const neighbor of neighbors) {
          const { data: ringResult } = await supabase.rpc("resolve_zone_by_h3", {
            p_h3_index: neighbor,
          });
          const rr = ringResult as any;
          if (rr?.zone_id) {
            setResult({
              address,
              lat,
              lng,
              h3Index,
              zoneId: rr.zone_id,
              zoneName: rr.zone_name,
              method: `ring_${ring}`,
            });
            setLoading(false);
            found = true;
            break;
          }
        }
      }
      if (found) return;

      // Step 5: Zip fallback via resolve_property_zone RPC
      const { data: zipResult } = await supabase.rpc("resolve_property_zone", {
        p_lat: lat,
        p_lng: lng,
      });

      const zr = zipResult as any;
      if (zr?.zone_id) {
        setResult({
          address,
          lat,
          lng,
          h3Index,
          zoneId: zr.zone_id,
          zoneName: zr.zone_name,
          method: zr.method,
        });
      } else {
        setResult({
          address,
          lat,
          lng,
          h3Index,
          zoneId: null,
          zoneName: null,
          method: "no_match",
        });
      }
    } catch (err: any) {
      console.error("Address lookup error:", err);
      toast.error("Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4" /> Address Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Enter address to check zone assignment..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          />
          <Button onClick={handleLookup} disabled={loading || !query.trim()} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border p-3 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{result.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hexagon className="h-4 w-4 text-muted-foreground" />
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.h3Index}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {result.lat.toFixed(5)}, {result.lng.toFixed(5)}
              </span>
            </div>

            <div className="pt-1 border-t flex items-center gap-2">
              {result.zoneId ? (
                <>
                  <Badge variant="default">{result.zoneName}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {result.method === "direct"
                      ? "Direct H3 match"
                      : result.method.startsWith("ring_")
                      ? `Ring ${result.method.split("_")[1]} expansion`
                      : result.method === "zip_fallback"
                      ? "ZIP code fallback"
                      : result.method}
                  </Badge>
                </>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>No zone match found</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
