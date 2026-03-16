import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useAssignmentConfig, useUpdateAssignmentConfig, DIAL_META, type AssignmentConfigRow } from "@/hooks/useAssignmentConfig";
import { toast } from "sonner";
import { Save, RotateCcw, SlidersHorizontal, Target, Gauge, Package, Route, Clock, Calendar, Anchor, Timer } from "lucide-react";

const GROUP_META = {
  weights: { label: "Scoring Weights", icon: SlidersHorizontal, description: "How much each factor matters in the assignment score (lower score = better match)" },
  thresholds: { label: "Thresholds", icon: Target, description: "Limits and stability rules for reassignment decisions" },
  capacity: { label: "Capacity & Timing", icon: Gauge, description: "Provider capacity targets, task defaults, and buffers" },
  bundling: { label: "Bundling", icon: Package, description: "Setup time discounts when multiple tasks are grouped at one stop" },
  sequencing: { label: "Sequencing", icon: Route, description: "Route optimization objective weights and improvement thresholds" },
  eta: { label: "ETA Ranges", icon: Clock, description: "Customer-facing arrival window widths by stop position" },
  availability: { label: "Availability", icon: Calendar, description: "Provider availability requirements and fragmentation limits" },
  anchored: { label: "Anchored Stops", icon: Anchor, description: "Constraints for blocked-window location stops" },
  late: { label: "Late Detection", icon: Timer, description: "Grace periods for provider lateness tracking" },
} as const;

function DialCard({
  meta,
  row,
  localValue,
  onChange,
  onSave,
  isSaving,
}: {
  meta: typeof DIAL_META[number];
  row: AssignmentConfigRow;
  localValue: number;
  onChange: (v: number) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const originalValue = typeof row.config_value === "number" ? row.config_value : Number(row.config_value);
  const isDirty = localValue !== originalValue;

  return (
    <div className="p-4 rounded-xl border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{meta.label}</p>
          {row.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold tabular-nums">
            {localValue}{meta.unit ? ` ${meta.unit}` : ""}
          </span>
          {isDirty && (
            <Badge variant="secondary" className="text-[10px]">changed</Badge>
          )}
        </div>
      </div>

      <Slider
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={[localValue]}
        onValueChange={([v]) => onChange(v)}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{meta.min}{meta.unit ? ` ${meta.unit}` : ""}</span>
        <span>{meta.max}{meta.unit ? ` ${meta.unit}` : ""}</span>
      </div>

      {isDirty && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => onChange(originalValue)} className="text-xs">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving} className="text-xs">
            <Save className="h-3 w-3 mr-1" /> Save
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AssignmentConfig() {
  const { data: configs, isLoading } = useAssignmentConfig();
  const updateConfig = useUpdateAssignmentConfig();
  const [localValues, setLocalValues] = useState<Record<string, number>>({});

  if (isLoading) {
    return (
      <div className="animate-fade-in p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-h2">Assignment Tuning Dials</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  const configMap = new Map((configs ?? []).map((c) => [c.config_key, c]));

  const getLocalValue = (key: string) => {
    if (key in localValues) return localValues[key];
    const row = configMap.get(key);
    if (!row) return 0;
    return typeof row.config_value === "number" ? row.config_value : Number(row.config_value);
  };

  const handleSave = async (key: string) => {
    const row = configMap.get(key);
    if (!row) return;
    try {
      await updateConfig.mutateAsync({ id: row.id, config_value: getLocalValue(key) });
      // Clear local override so it reads from server
      setLocalValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success(`Updated ${key}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update config");
    }
  };

  return (
    <div className="animate-fade-in p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-h2">Assignment Tuning Dials</h1>
        <p className="text-sm text-muted-foreground">Adjust weights, thresholds, and capacity parameters for the assignment engine</p>
      </div>

      {(["weights", "thresholds", "capacity", "bundling", "sequencing", "eta", "availability", "anchored", "late"] as const).map((group) => {
        const meta = GROUP_META[group];
        const dials = DIAL_META.filter((d) => d.group === group);

        return (
          <Card key={group}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <meta.icon className="h-4 w-4 text-primary" />
                {meta.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {dials.map((dial) => {
                const row = configMap.get(dial.key);
                if (!row) return (
                  <div key={dial.key} className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    {dial.label} — not configured
                  </div>
                );

                return (
                  <DialCard
                    key={dial.key}
                    meta={dial}
                    row={row}
                    localValue={getLocalValue(dial.key)}
                    onChange={(v) => setLocalValues((prev) => ({ ...prev, [dial.key]: v }))}
                    onSave={() => handleSave(dial.key)}
                    isSaving={updateConfig.isPending}
                  />
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
