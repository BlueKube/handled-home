import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRegions } from "@/hooks/useRegions";
import { useZoneBuilderRun, type ZoneBuilderConfig, type ZoneBuilderResult } from "@/hooks/useZoneBuilderRun";
import { cellToBoundary, cellToLatLng } from "h3-js";
import Map, { Source, Layer, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Users, Gauge, AlertTriangle, BarChart3 } from "lucide-react";
import { useRef } from "react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "";

const STEPS = [
  { key: "region", label: "Region" },
  { key: "settings", label: "Settings" },
  { key: "preview", label: "Preview" },
] as const;

type Step = (typeof STEPS)[number]["key"];

// Zone color palette
const ZONE_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
  "#e11d48", "#84cc16", "#0ea5e9", "#a855f7", "#64748b",
];

function Stepper({ current, steps }: { current: Step; steps: typeof STEPS }) {
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold
              ${i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {i + 1}
          </div>
          <span className={`text-sm ${i <= idx ? "font-medium" : "text-muted-foreground"}`}>{s.label}</span>
          {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

function WarningBadges({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  const iconMap: Record<string, string> = {
    too_sparse: "⚠️",
    overloaded: "🔴",
    undersupplied: "🟡",
    too_large: "📏",
    too_small: "🔹",
  };
  return (
    <div className="flex flex-wrap gap-1">
      {warnings.map((w) => (
        <Badge key={w} variant="outline" className="text-xs">
          {iconMap[w] || "⚠️"} {w.replace(/_/g, " ")}
        </Badge>
      ))}
    </div>
  );
}

export default function ZoneBuilder() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("region");
  const [regionId, setRegionId] = useState<string>("");
  const [runId, setRunId] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

  // Config state
  const [config, setConfig] = useState<ZoneBuilderConfig>({
    resolution: 7,
    seed_strategy: "auto",
    target_workload_days: 4,
    max_spread_minutes: 15,
    min_density: 0.5,
  });

  const { data: regions } = useRegions();
  const { results, generating, generate } = useZoneBuilderRun(runId);

  // Build GeoJSON for map
  const geoJson = useMemo(() => {
    if (!results.length) return null;
    const features: GeoJSON.Feature[] = [];
    results.forEach((zone, zi) => {
      const color = ZONE_COLORS[zi % ZONE_COLORS.length];
      for (const cellIdx of zone.cell_indices) {
        try {
          const boundary = cellToBoundary(cellIdx, true); // [lng, lat]
          features.push({
            type: "Feature",
            properties: {
              zone_label: zone.zone_label,
              color,
              isHovered: zone.zone_label === hoveredZone,
            },
            geometry: {
              type: "Polygon",
              coordinates: [boundary.map(([lat, lng]) => [lng, lat])],
            },
          });
        } catch {
          // skip invalid cells
        }
      }
    });
    return { type: "FeatureCollection" as const, features };
  }, [results, hoveredZone]);

  // Map center from results
  const mapCenter = useMemo(() => {
    if (!results.length) return { lat: 33.45, lng: -112.07 }; // Phoenix default
    const allCells = results.flatMap((r) => r.cell_indices);
    if (!allCells.length) return { lat: 33.45, lng: -112.07 };
    let totalLat = 0, totalLng = 0;
    for (const c of allCells) {
      try {
        const [lat, lng] = cellToLatLng(c);
        totalLat += lat;
        totalLng += lng;
      } catch { /* skip */ }
    }
    return { lat: totalLat / allCells.length, lng: totalLng / allCells.length };
  }, [results]);

  const handleGenerate = useCallback(async () => {
    try {
      const data = await generate({ regionId, config });
      if (data?.run_id) {
        setRunId(data.run_id);
        setStep("preview");
      }
    } catch {
      // error handled by hook
    }
  }, [regionId, config, generate]);

  const selectedResult = results.find((r) => r.zone_label === selectedZone);

  return (
    <div className="animate-fade-in space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/zones")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-h2">Zone Builder</h1>
          <p className="text-caption">Generate optimized zones from demand and supply data.</p>
        </div>
      </div>

      <Stepper current={step} steps={STEPS} />

      {/* Step 1: Region Selection */}
      {step === "region" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Select Region</h2>
          <p className="text-sm text-muted-foreground">
            Choose the region to generate zones for. The builder will analyze all properties and providers in this region.
          </p>
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Select a region…" />
            </SelectTrigger>
            <SelectContent>
              {regions?.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end">
            <Button disabled={!regionId} onClick={() => setStep("settings")}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Generation Settings */}
      {step === "settings" && (
        <Card className="p-6 space-y-6">
          <h2 className="font-semibold">Generation Settings</h2>

          {/* Seed Strategy */}
          <div className="space-y-2">
            <Label className="font-medium">Seed Strategy</Label>
            <p className="text-xs text-muted-foreground">How should the algorithm prioritize zone placement?</p>
            <RadioGroup
              value={config.seed_strategy}
              onValueChange={(v) => setConfig((c) => ({ ...c, seed_strategy: v as ZoneBuilderConfig["seed_strategy"] }))}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="font-normal">Auto — balanced demand + supply + density</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="demand_first" id="demand" />
                <Label htmlFor="demand" className="font-normal">Demand-first — prioritize customer density</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="provider_first" id="provider" />
                <Label htmlFor="provider" className="font-normal">Provider-first — prioritize provider proximity</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="font-medium">H3 Resolution</Label>
              <Badge variant="secondary">{config.resolution}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Lower = larger cells (coarser zones). Higher = smaller cells (finer zones). Default: 7.
            </p>
            <Slider
              value={[config.resolution]}
              onValueChange={([v]) => setConfig((c) => ({ ...c, resolution: v }))}
              min={5}
              max={9}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Coarse (5)</span>
              <span>Fine (9)</span>
            </div>
          </div>

          {/* Target Workload */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="font-medium">Target Workload</Label>
              <Badge variant="secondary">{config.target_workload_days} days/wk</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              How many provider-days per week each zone should target. Higher = fewer larger zones.
            </p>
            <Slider
              value={[config.target_workload_days]}
              onValueChange={([v]) => setConfig((c) => ({ ...c, target_workload_days: v }))}
              min={2}
              max={6}
              step={0.5}
            />
          </div>

          {/* Max Spread */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="font-medium">Max Spread</Label>
              <Badge variant="secondary">{config.max_spread_minutes} min</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum estimated drive time across a zone. Limits zone sprawl.
            </p>
            <Slider
              value={[config.max_spread_minutes]}
              onValueChange={([v]) => setConfig((c) => ({ ...c, max_spread_minutes: v }))}
              min={8}
              max={25}
              step={1}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("region")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…
                </>
              ) : (
                "Generate Zones"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Zone Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Map */}
          {MAPBOX_TOKEN ? (
            <Card className="overflow-hidden">
              <div className="h-[400px]">
                <Map
                  ref={mapRef}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  initialViewState={{
                    latitude: mapCenter.lat,
                    longitude: mapCenter.lng,
                    zoom: 11,
                  }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/light-v11"
                >
                  {geoJson && (
                    <Source id="zones" type="geojson" data={geoJson}>
                      <Layer
                        id="zone-fill"
                        type="fill"
                        paint={{
                          "fill-color": ["get", "color"],
                          "fill-opacity": [
                            "case",
                            ["get", "isHovered"],
                            0.5,
                            0.3,
                          ],
                        }}
                      />
                      <Layer
                        id="zone-outline"
                        type="line"
                        paint={{
                          "line-color": ["get", "color"],
                          "line-width": [
                            "case",
                            ["get", "isHovered"],
                            2.5,
                            1,
                          ],
                        }}
                      />
                    </Source>
                  )}
                </Map>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">Map unavailable — Mapbox token not configured.</p>
            </Card>
          )}

          {/* Zone List */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{results.length} Zones Generated</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRunId(null);
                  setStep("settings");
                }}
              >
                Re-generate
              </Button>
            </div>

            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-2">
                {results.map((zone, zi) => {
                  const m = zone.metrics as unknown as Record<string, number>;
                  const color = ZONE_COLORS[zi % ZONE_COLORS.length];
                  const isSelected = zone.zone_label === selectedZone;

                  return (
                    <Card
                      key={zone.zone_label}
                      className={`p-3 cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedZone(isSelected ? null : zone.zone_label)}
                      onMouseEnter={() => setHoveredZone(zone.zone_label)}
                      onMouseLeave={() => setHoveredZone(null)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-medium text-sm">{zone.zone_label}</span>
                        </div>
                        <WarningBadges warnings={zone.warnings} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {m.customer_count ?? 0} customers
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {m.cell_count ?? 0} cells
                        </div>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          S/D: {m.sd_ratio ?? 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {m.demand_min_week ?? 0} min/wk
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div>Supply: <span className="font-medium">{m.supply_min_week ?? 0} min/wk</span></div>
                            <div>Providers: <span className="font-medium">{m.provider_count ?? 0}</span></div>
                            <div>Area: <span className="font-medium">{m.total_area_km2 ?? 0} km²</span></div>
                            <div>Density: <span className="font-medium">{m.density ?? 0} cust/km²</span></div>
                            <div>Compactness: <span className="font-medium">{m.compactness ?? 0}</span></div>
                            <div>Max drive: <span className="font-medium">{m.max_spread_drive_min ?? 0} min</span></div>
                          </div>
                          {zone.neighbor_zone_labels.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Neighbors: {zone.neighbor_zone_labels.join(", ")}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setRunId(null);
                setStep("settings");
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Settings
            </Button>
            {/* Phase 4 will add Edit + Commit buttons here */}
          </div>
        </div>
      )}
    </div>
  );
}
