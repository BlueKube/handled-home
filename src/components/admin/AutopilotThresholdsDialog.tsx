import { useState } from "react";
import { useAssignmentConfig, useUpdateAssignmentConfig } from "@/hooks/useAssignmentConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const AUTOPILOT_DIALS = [
  { key: "autopilot_max_unassigned_locked", label: "Max unassigned in LOCKED", unit: "jobs", default: 0 },
  { key: "autopilot_max_open_exceptions", label: "Max open exceptions (RED)", unit: "exceptions", default: 5 },
  { key: "autopilot_sla_risk_threshold", label: "SLA risk threshold (YELLOW)", unit: "jobs", default: 3 },
  { key: "autopilot_max_issue_rate_7d", label: "Max issue rate (7d)", unit: "%", default: 5 },
  { key: "autopilot_max_proof_missing_rate", label: "Max proof missing rate", unit: "%", default: 10 },
  { key: "autopilot_max_reschedule_rate_locked", label: "Max reschedule rate (LOCKED)", unit: "%", default: 5 },
  { key: "autopilot_max_provider_callouts_day", label: "Max provider call-outs/day", unit: "call-outs", default: 2 },
  { key: "autopilot_max_avg_drive_minutes", label: "Max avg drive minutes/route", unit: "min", default: 45 },
  { key: "autopilot_max_redo_intents_7d", label: "Max redo intents (7d)", unit: "redos", default: 2 },
];

export function AutopilotThresholdsDialog() {
  const { data: allConfig, isLoading } = useAssignmentConfig();
  const updateConfig = useUpdateAssignmentConfig();
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);

  const configMap = new Map(
    (allConfig ?? []).map((c) => [c.config_key, c])
  );

  const getValue = (key: string, defaultVal: number): number => {
    if (key in edits) return edits[key];
    const row = configMap.get(key);
    if (row) return typeof row.config_value === "number" ? row.config_value : Number(row.config_value) || defaultVal;
    return defaultVal;
  };

  const isDirty = Object.keys(edits).length > 0;

  const handleSave = async () => {
    for (const [key, value] of Object.entries(edits)) {
      const row = configMap.get(key);
      if (row) {
        await updateConfig.mutateAsync({ id: row.id, config_value: value });
      }
    }
    setEdits({});
    toast.success("Thresholds updated");
  };

  const handleReset = () => setEdits({});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Thresholds
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Autopilot Health Thresholds</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-4">
          These values control when the autopilot banner transitions between GREEN → YELLOW → RED.
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {AUTOPILOT_DIALS.map((dial) => (
              <div key={dial.key} className="flex items-center gap-3">
                <Label className="text-xs flex-1 min-w-0">{dial.label}</Label>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    className="w-20 h-8 text-xs text-right"
                    value={getValue(dial.key, dial.default)}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [dial.key]: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-[10px] text-muted-foreground w-12">{dial.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={!isDirty}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || updateConfig.isPending}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
