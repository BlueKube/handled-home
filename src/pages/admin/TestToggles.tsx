import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useZones } from "@/hooks/useZones";
import { useMarketZoneState } from "@/hooks/useMarketZoneState";
import { useGrowthSurfaceConfig } from "@/hooks/useGrowthSurfaceConfig";
import { toast } from "sonner";

const MARKET_STATES = ["CLOSED", "SOFT_LAUNCH", "OPEN", "PROTECT_QUALITY"] as const;

const SEEDED_DEFAULTS = {
  weights: { receipt_share: 1, provider_share: 1, cross_pollination: 1 },
  caps: { share_per_job: 2, reminder_per_week: 3 },
};

const CATEGORIES = ["mowing", "windows", "pest", "pool", "power_wash"];

export default function TestToggles() {
  const { data: zones } = useZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("mowing");

  const { states, overrideState } = useMarketZoneState(selectedZoneId || undefined);
  const { configs, upsertConfig } = useGrowthSurfaceConfig(selectedZoneId || undefined);

  // Auto-select first zone
  useEffect(() => {
    if (zones?.length && !selectedZoneId) setSelectedZoneId(zones[0].id);
  }, [zones, selectedZoneId]);

  const currentState = states.data?.find((s) => s.category === selectedCategory);
  const currentConfig = configs.data?.find((c) => c.category === selectedCategory);

  const currentWeights = (currentConfig?.surface_weights ?? SEEDED_DEFAULTS.weights) as Record<string, number>;
  const currentCaps = (currentConfig?.prompt_frequency_caps ?? SEEDED_DEFAULTS.caps) as Record<string, number>;

  const handleStateChange = (newState: string) => {
    if (!selectedZoneId) return;
    overrideState.mutate(
      { zoneId: selectedZoneId, category: selectedCategory, newState: newState as any, reason: "test toggle" },
      { onSuccess: () => toast.success(`Market state → ${newState}`) }
    );
  };

  const handleWeightChange = (key: string, value: number) => {
    if (!selectedZoneId) return;
    upsertConfig.mutate(
      { zone_id: selectedZoneId, category: selectedCategory, surface_weights: { ...currentWeights, [key]: value } as any },
      { onSuccess: () => toast.success(`${key} → ${value}`) }
    );
  };

  const handleCapChange = (key: string, value: number) => {
    if (!selectedZoneId) return;
    upsertConfig.mutate(
      { zone_id: selectedZoneId, category: selectedCategory, prompt_frequency_caps: { ...currentCaps, [key]: value } as any },
      { onSuccess: () => toast.success(`${key} cap → ${value}`) }
    );
  };

  const handleReset = () => {
    if (!selectedZoneId) return;
    overrideState.mutate(
      { zoneId: selectedZoneId, category: selectedCategory, newState: "OPEN", reason: "test toggle reset" },
      { onSuccess: () => toast.success("Market state → OPEN") }
    );
    upsertConfig.mutate(
      {
        zone_id: selectedZoneId,
        category: selectedCategory,
        surface_weights: SEEDED_DEFAULTS.weights as any,
        prompt_frequency_caps: SEEDED_DEFAULTS.caps as any,
      },
      { onSuccess: () => toast.success("Weights & caps reset to defaults") }
    );
  };

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-2xl mx-auto">
      <Alert className="border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-foreground font-medium">
          Test Toggles — changes affect live zone behavior. All changes are audit-logged.
        </AlertDescription>
      </Alert>

      <h1 className="text-h2">Test Toggles</h1>

      {/* Zone / Category selector */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Zone</Label>
          <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
            <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
            <SelectContent>
              {zones?.map((z) => (
                <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Market State */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Market State</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup
            value={currentState?.status ?? "OPEN"}
            onValueChange={handleStateChange}
            className="grid grid-cols-2 gap-3"
          >
            {MARKET_STATES.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <RadioGroupItem value={s} id={`state-${s}`} />
                <Label htmlFor={`state-${s}`} className="text-sm cursor-pointer">{s}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Surface Weights */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Surface Weights (0–1)</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(SEEDED_DEFAULTS.weights).map(([key]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{key}</Label>
                <span className="text-sm text-muted-foreground">{currentWeights[key] ?? 1}</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[currentWeights[key] ?? 1]}
                onValueCommit={([v]) => handleWeightChange(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Frequency Caps */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Frequency Caps</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(SEEDED_DEFAULTS.caps).map(([key, defaultVal]) => (
            <div key={key} className="flex items-center gap-4">
              <Label className="text-sm w-40">{key}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="w-24"
                value={currentCaps[key] ?? defaultVal}
                onChange={(e) => handleCapChange(key, Number(e.target.value))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reset */}
      <Button variant="outline" onClick={handleReset} className="w-full">
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset to Seeded Defaults
      </Button>
    </div>
  );
}