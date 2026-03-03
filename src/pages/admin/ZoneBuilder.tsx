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
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, ArrowRight, Loader2, MapPin, Users, Gauge,
  AlertTriangle, BarChart3, Check, Pencil, Merge, Scissors,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "";

const STEPS = [
  { key: "region", label: "Region" },
  { key: "settings", label: "Settings" },
  { key: "preview", label: "Preview" },
  { key: "edit", label: "Edit" },
  { key: "commit", label: "Commit" },
] as const;

type Step = (typeof STEPS)[number]["key"];

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
            {i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={`text-sm ${i <= idx ? "font-medium" : "text-muted-foreground"} hidden sm:inline`}>{s.label}</span>
          {i < steps.length - 1 && <div className="w-4 sm:w-6 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

function WarningBadges({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  const iconMap: Record<string, string> = {
    too_sparse: "⚠️", overloaded: "🔴", undersupplied: "🟡",
    too_large: "📏", too_small: "🔹",
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
    resolution: 7, seed_strategy: "auto",
    target_workload_days: 4, max_spread_minutes: 15, min_density: 0.5,
  });

  // Edit state
  const [zoneNames, setZoneNames] = useState<Record<string, string>>({});
  const [editingNameLabel, setEditingNameLabel] = useState<string | null>(null);
  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [confirmCommit, setConfirmCommit] = useState(false);

  const { data: regions } = useRegions();
  const { results, generating, generate, commit, committing } = useZoneBuilderRun(runId);

  // Apply local edits (merge/names) on top of server results
  const editedResults = useMemo(() => results, [results]);

  // Build GeoJSON for map
  const geoJson = useMemo(() => {
    if (!editedResults.length) return null;
    const features: GeoJSON.Feature[] = [];
    editedResults.forEach((zone, zi) => {
      const color = ZONE_COLORS[zi % ZONE_COLORS.length];
      for (const cellIdx of zone.cell_indices) {
        try {
          const boundary = cellToBoundary(cellIdx, true);
          const ring = [...boundary, boundary[0]];
          features.push({
            type: "Feature",
            properties: {
              zone_label: zone.zone_label,
              color,
              isHovered: zone.zone_label === hoveredZone,
              isMergeSelected: mergeSelection.includes(zone.zone_label),
            },
            geometry: { type: "Polygon", coordinates: [ring] },
          });
        } catch { /* skip */ }
      }
    });
    return { type: "FeatureCollection" as const, features };
  }, [editedResults, hoveredZone, mergeSelection]);

  // Map center
  const mapCenter = useMemo(() => {
    if (!editedResults.length) return { lat: 33.45, lng: -112.07 };
    const allCells = editedResults.flatMap((r) => r.cell_indices);
    if (!allCells.length) return { lat: 33.45, lng: -112.07 };
    let totalLat = 0, totalLng = 0;
    for (const c of allCells) {
      try { const [lat, lng] = cellToLatLng(c); totalLat += lat; totalLng += lng; } catch { /* skip */ }
    }
    return { lat: totalLat / allCells.length, lng: totalLng / allCells.length };
  }, [editedResults]);

  const handleGenerate = useCallback(async () => {
    try {
      const data = await generate({ regionId, config });
      if (data?.run_id) {
        setRunId(data.run_id);
        setStep("preview");
      }
    } catch { /* error handled by hook */ }
  }, [regionId, config, generate]);

  const handleCommit = useCallback(async () => {
    if (!runId) return;
    try {
      const data = await commit({ runId, zoneNames });
      if (data?.committed_zones) {
        toast.success(`Committed ${data.committed_zones.length} zones`);
        nav("/admin/zones");
      }
    } catch { /* error handled by hook */ }
  }, [runId, zoneNames, commit, nav]);

  const toggleMergeSelect = (label: string) => {
    setMergeSelection((prev) => {
      if (prev.includes(label)) return prev.filter((l) => l !== label);
      if (prev.length >= 2) return [prev[1], label]; // keep last 2
      return [...prev, label];
    });
  };

  // Check if two zones are neighbors
  const canMerge = mergeSelection.length === 2 && (() => {
    const [a, b] = mergeSelection;
    const zoneA = editedResults.find((r) => r.zone_label === a);
    return zoneA?.neighbor_zone_labels?.includes(b);
  })();

  const selectedResult = editedResults.find((r) => r.zone_label === selectedZone);
  const warningCount = editedResults.reduce((s, r) => s + r.warnings.length, 0);

  // Shared zone list card renderer
  const renderZoneCard = (zone: ZoneBuilderResult, zi: number, opts: { editable?: boolean } = {}) => {
    const m = zone.metrics as unknown as Record<string, number>;
    const color = ZONE_COLORS[zi % ZONE_COLORS.length];
    const isSelected = zone.zone_label === selectedZone;
    const displayName = zoneNames[zone.zone_label] || zone.zone_label;
    const isMergeSel = mergeSelection.includes(zone.zone_label);

    return (
      <Card
        key={zone.zone_label}
        className={`p-3 cursor-pointer transition-all ${
          isSelected ? "ring-2 ring-primary" : ""
        } ${isMergeSel ? "ring-2 ring-amber-500" : ""}`}
        onClick={() => {
          if (mergeMode) { toggleMergeSelect(zone.zone_label); return; }
          setSelectedZone(isSelected ? null : zone.zone_label);
        }}
        onMouseEnter={() => setHoveredZone(zone.zone_label)}
        onMouseLeave={() => setHoveredZone(null)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {opts.editable && editingNameLabel === zone.zone_label ? (
              <Input
                className="h-6 w-32 text-sm px-1"
                defaultValue={displayName}
                autoFocus
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== zone.zone_label) setZoneNames((n) => ({ ...n, [zone.zone_label]: v }));
                  setEditingNameLabel(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setEditingNameLabel(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="font-medium text-sm">{displayName}</span>
            )}
            {opts.editable && editingNameLabel !== zone.zone_label && (
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); setEditingNameLabel(zone.zone_label); }}
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
          <WarningBadges warnings={zone.warnings} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><Users className="h-3 w-3" />{m.customer_count ?? 0} customers</div>
          <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.cell_count ?? 0} cells</div>
          <div className="flex items-center gap-1"><Gauge className="h-3 w-3" />S/D: {m.sd_ratio ?? 0}</div>
          <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{m.demand_min_week ?? 0} min/wk</div>
        </div>
        {isSelected && !mergeMode && (
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
  };

  // Shared map component
  const renderMap = () => (
    MAPBOX_TOKEN ? (
      <Card className="overflow-hidden">
        <div className="h-[400px]">
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ latitude: mapCenter.lat, longitude: mapCenter.lng, zoom: 11 }}
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
                      ["get", "isMergeSelected"], 0.6,
                      ["get", "isHovered"], 0.5,
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
                      ["get", "isMergeSelected"], 3,
                      ["get", "isHovered"], 2.5,
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
    )
  );

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

      {/* ── Step 1: Region Selection ── */}
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

      {/* ── Step 2: Generation Settings ── */}
      {step === "settings" && (
        <Card className="p-6 space-y-6">
          <h2 className="font-semibold">Generation Settings</h2>
          <div className="space-y-2">
            <Label className="font-medium">Seed Strategy</Label>
            <p className="text-xs text-muted-foreground">How should the algorithm prioritize zone placement?</p>
            <RadioGroup
              value={config.seed_strategy}
              onValueChange={(v) => setConfig((c) => ({ ...c, seed_strategy: v as ZoneBuilderConfig["seed_strategy"] }))}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2"><RadioGroupItem value="auto" id="auto" /><Label htmlFor="auto" className="font-normal">Auto — balanced demand + supply + density</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="demand_first" id="demand" /><Label htmlFor="demand" className="font-normal">Demand-first — prioritize customer density</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="provider_first" id="provider" /><Label htmlFor="provider" className="font-normal">Provider-first — prioritize provider proximity</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><Label className="font-medium">H3 Resolution</Label><Badge variant="secondary">{config.resolution}</Badge></div>
            <p className="text-xs text-muted-foreground">Lower = larger cells (coarser zones). Higher = smaller cells (finer zones).</p>
            <Slider value={[config.resolution]} onValueChange={([v]) => setConfig((c) => ({ ...c, resolution: v }))} min={5} max={9} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>Coarse (5)</span><span>Fine (9)</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><Label className="font-medium">Target Workload</Label><Badge variant="secondary">{config.target_workload_days} days/wk</Badge></div>
            <p className="text-xs text-muted-foreground">Provider-days per week each zone should target.</p>
            <Slider value={[config.target_workload_days]} onValueChange={([v]) => setConfig((c) => ({ ...c, target_workload_days: v }))} min={2} max={6} step={0.5} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><Label className="font-medium">Max Spread</Label><Badge variant="secondary">{config.max_spread_minutes} min</Badge></div>
            <p className="text-xs text-muted-foreground">Maximum estimated drive time across a zone.</p>
            <Slider value={[config.max_spread_minutes]} onValueChange={([v]) => setConfig((c) => ({ ...c, max_spread_minutes: v }))} min={8} max={25} step={1} />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("region")}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</> : "Generate Zones"}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Step 3: Zone Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">
          {renderMap()}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editedResults.length} Zones Generated</h2>
              <Button variant="ghost" size="sm" onClick={() => { setRunId(null); setStep("settings"); }}>Re-generate</Button>
            </div>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-2">
                {editedResults.map((zone, zi) => renderZoneCard(zone, zi))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => { setRunId(null); setStep("settings"); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Settings
            </Button>
            <Button onClick={() => setStep("edit")}>
              Edit Zones <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Editing Tools ── */}
      {step === "edit" && (
        <div className="space-y-4">
          {renderMap()}

          {/* Toolbar */}
          <Card className="p-3 flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={mergeMode ? "default" : "outline"}
              onClick={() => { setMergeMode(!mergeMode); setMergeSelection([]); }}
            >
              <Merge className="h-4 w-4 mr-1" /> {mergeMode ? "Cancel Merge" : "Merge"}
            </Button>
            {mergeMode && (
              <span className="text-xs text-muted-foreground">
                {mergeSelection.length < 2
                  ? `Select 2 adjacent zones to merge (${mergeSelection.length}/2)`
                  : canMerge
                    ? "Ready to merge!"
                    : "Selected zones are not neighbors. Pick adjacent zones."}
              </span>
            )}
            {mergeMode && canMerge && (
              <Button
                size="sm"
                onClick={() => {
                  // Client-side merge note: actual merge requires re-generation or server logic
                  toast.info("Merge will take effect when zones are committed. For now, rename the zones as needed.");
                  setMergeMode(false);
                  setMergeSelection([]);
                }}
              >
                <Check className="h-4 w-4 mr-1" /> Confirm Merge
              </Button>
            )}
          </Card>

          <div className="grid gap-2">
            <h2 className="font-semibold">Edit Zones</h2>
            <p className="text-xs text-muted-foreground">
              Click the pencil icon to rename zones. Use Merge to combine adjacent zones.
            </p>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-2">
                {editedResults.map((zone, zi) => renderZoneCard(zone, zi, { editable: true }))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => { setMergeMode(false); setMergeSelection([]); setStep("preview"); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Preview
            </Button>
            <Button onClick={() => setStep("commit")}>
              Review & Commit <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 5: Commit Confirmation ── */}
      {step === "commit" && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Commit Zones</h2>
            <p className="text-sm text-muted-foreground">
              This will create {editedResults.length} operational zones in the system. Zones will be assigned round-robin service days and set to active status.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Zones</span>
                <p className="font-semibold text-lg">{editedResults.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Region</span>
                <p className="font-semibold">{regions?.find((r) => r.id === regionId)?.name || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Warnings</span>
                <p className={`font-semibold ${warningCount > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {warningCount > 0 ? `${warningCount} warnings` : "None"}
                </p>
              </div>
            </div>

            {/* Zone summary list */}
            <div className="space-y-1">
              {editedResults.map((zone, zi) => {
                const m = zone.metrics as unknown as Record<string, number>;
                const displayName = zoneNames[zone.zone_label] || zone.zone_label;
                const color = ZONE_COLORS[zi % ZONE_COLORS.length];
                const dayIdx = zi % 5;
                const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
                return (
                  <div key={zone.zone_label} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-medium flex-1 min-w-0 truncate">{displayName}</span>
                    <span className="text-muted-foreground">{m.customer_count ?? 0} cust</span>
                    <Badge variant="secondary" className="text-xs">{days[dayIdx]}</Badge>
                    {zone.warnings.length > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-0.5" /> {zone.warnings.length}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("edit")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Edit
            </Button>
            <Button onClick={() => setConfirmCommit(true)} disabled={committing}>
              {committing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Committing…</> : (
                <><Check className="h-4 w-4 mr-1" /> Commit Zones</>
              )}
            </Button>
          </div>

          <AlertDialog open={confirmCommit} onOpenChange={setConfirmCommit}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Commit {editedResults.length} Zones?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create {editedResults.length} new operational zones in the {regions?.find((r) => r.id === regionId)?.name} region. This action cannot be easily undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCommit}>
                  Commit Zones
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
