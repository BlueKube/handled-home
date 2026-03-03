import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Sliders } from "lucide-react";
import { toast } from "sonner";
import { useZoneStateThresholds, type ZoneStateThresholdConfig } from "@/hooks/useZoneStateThresholds";

const THRESHOLD_LABELS: Record<string, { label: string; description: string; format: "number" | "percent" | "days" }> = {
  min_providers_to_open: { label: "Min Providers to Open", description: "Minimum qualified providers before OPEN is recommended", format: "number" },
  open_utilization_enter: { label: "Open Utilization (Enter)", description: "Max utilization to recommend OPEN", format: "percent" },
  open_utilization_exit: { label: "Open Utilization (Exit)", description: "Utilization above this exits OPEN → SOFT_LAUNCH", format: "percent" },
  protect_quality_utilization_enter: { label: "Protect Quality (Enter)", description: "Utilization at which PROTECT_QUALITY triggers", format: "percent" },
  protect_quality_utilization_exit: { label: "Protect Quality (Exit)", description: "Utilization below this exits PROTECT_QUALITY", format: "percent" },
  coverage_risk_waitlist_threshold: { label: "Coverage Risk → Waitlist", description: "Coverage risk above this → WAITLIST_ONLY", format: "percent" },
  coverage_risk_recruiting_threshold: { label: "Coverage Risk → Recruiting", description: "Coverage risk above this → PROVIDER_RECRUITING", format: "percent" },
  provider_recruiting_utilization_trigger: { label: "Recruiting Utilization", description: "Utilization above this → PROVIDER_RECRUITING", format: "percent" },
  min_time_in_state_days: { label: "Min Time in State", description: "Minimum days before non-emergency state change", format: "days" },
  soft_launch_intake_cap_per_week: { label: "Soft Launch Intake Cap", description: "Max new subscriptions per week during SOFT_LAUNCH", format: "number" },
};

export function ThresholdDials() {
  const { thresholds, updateThreshold } = useZoneStateThresholds();
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  if (thresholds.isLoading) return <Skeleton className="h-48 mt-4" />;

  const configs = thresholds.data ?? [];

  const handleEdit = (id: string, value: number) => {
    setEdits((p) => ({ ...p, [id]: value }));
  };

  const handleSave = async (config: ZoneStateThresholdConfig) => {
    const newValue = edits[config.id];
    if (newValue === undefined || newValue === config.config_value?.value) return;
    setSaving(config.id);
    try {
      await updateThreshold.mutateAsync({ id: config.id, value: newValue });
      toast.success(`Updated ${THRESHOLD_LABELS[config.config_key]?.label ?? config.config_key}`);
      setEdits((p) => { const n = { ...p }; delete n[config.id]; return n; });
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(null);
  };

  const handleReset = (config: ZoneStateThresholdConfig) => {
    setEdits((p) => { const n = { ...p }; delete n[config.id]; return n; });
  };

  const formatDisplay = (key: string, value: number) => {
    const meta = THRESHOLD_LABELS[key];
    if (!meta) return String(value);
    if (meta.format === "percent") return `${Math.round(value * 100)}%`;
    if (meta.format === "days") return `${value} days`;
    return String(value);
  };

  const getInputValue = (config: ZoneStateThresholdConfig) => {
    const val = edits[config.id] ?? config.config_value?.value ?? 0;
    const meta = THRESHOLD_LABELS[config.config_key];
    if (meta?.format === "percent") return Math.round(val * 100);
    return val;
  };

  const setInputValue = (config: ZoneStateThresholdConfig, raw: number) => {
    const meta = THRESHOLD_LABELS[config.config_key];
    const val = meta?.format === "percent" ? raw / 100 : raw;
    handleEdit(config.id, val);
  };

  // Group by type
  const utilizationConfigs = configs.filter((c) => c.config_key.includes("utilization"));
  const coverageConfigs = configs.filter((c) => c.config_key.includes("coverage"));
  const otherConfigs = configs.filter((c) => !c.config_key.includes("utilization") && !c.config_key.includes("coverage"));

  const renderGroup = (title: string, items: ZoneStateThresholdConfig[]) => (
    <Card key={title}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sliders className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((config) => {
          const meta = THRESHOLD_LABELS[config.config_key];
          const hasEdit = edits[config.id] !== undefined && edits[config.id] !== config.config_value?.value;

          return (
            <div key={config.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{meta?.label ?? config.config_key}</Label>
                <Badge variant="outline" className="text-[10px]">
                  Current: {formatDisplay(config.config_key, config.config_value?.value ?? 0)}
                </Badge>
              </div>
              {meta?.description && <p className="text-xs text-muted-foreground">{meta.description}</p>}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24 h-8 text-sm"
                  value={getInputValue(config)}
                  onChange={(e) => setInputValue(config, parseFloat(e.target.value) || 0)}
                  step={meta?.format === "percent" ? 1 : meta?.format === "days" ? 1 : 1}
                />
                <span className="text-xs text-muted-foreground">
                  {meta?.format === "percent" ? "%" : meta?.format === "days" ? "days" : ""}
                </span>
                {hasEdit && (
                  <>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReset(config)}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleSave(config)} disabled={saving === config.id}>
                      <Save className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </>
                )}
              </div>
              {config.updated_at && (
                <p className="text-[10px] text-muted-foreground">Last updated: {new Date(config.updated_at).toLocaleString()}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 mt-4">
      <p className="text-xs text-muted-foreground">
        These thresholds control the recommendation engine. Changes take effect on the next nightly run.
      </p>
      {renderGroup("Utilization Thresholds", utilizationConfigs)}
      {renderGroup("Coverage Risk Thresholds", coverageConfigs)}
      {renderGroup("General Thresholds", otherConfigs)}
    </div>
  );
}
