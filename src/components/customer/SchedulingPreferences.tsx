import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Users, Home, Clock } from "lucide-react";

export interface SchedulingPrefs {
  align_days_preference: boolean;
  must_be_home: boolean;
  must_be_home_window: string | null;
}

interface SchedulingPreferencesProps {
  value: SchedulingPrefs;
  onChange: (prefs: SchedulingPrefs) => void;
  alignmentExplanation?: string | null;
  compact?: boolean;
}

const WINDOW_OPTIONS = [
  { value: "morning", label: "Morning (8am–12pm)" },
  { value: "afternoon", label: "Afternoon (12pm–5pm)" },
];

export function SchedulingPreferences({
  value,
  onChange,
  alignmentExplanation,
  compact = false,
}: SchedulingPreferencesProps) {
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Align Days Toggle */}
      <Card className="border-border/60">
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="align-days" className="text-sm font-medium cursor-pointer">
                  Try to align service days
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If you have multiple service categories, we'll try to schedule them on the same day. This may not always be possible due to route density.
                </p>
              </div>
            </div>
            <Switch
              id="align-days"
              checked={value.align_days_preference}
              onCheckedChange={(checked) =>
                onChange({ ...value, align_days_preference: checked })
              }
            />
          </div>

          {/* Alignment explanation when preference can't be met */}
          {value.align_days_preference && alignmentExplanation && (
            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/40">
              <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {alignmentExplanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Must Be Home Toggle */}
      <Card className="border-border/60">
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Home className="h-4 w-4 text-accent" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="must-be-home" className="text-sm font-medium cursor-pointer">
                  I need to be home
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We'll schedule within a time window that works for you. This may reduce available days or increase credit cost.
                </p>
              </div>
            </div>
            <Switch
              id="must-be-home"
              checked={value.must_be_home}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  must_be_home: checked,
                  must_be_home_window: checked ? "morning" : null,
                })
              }
            />
          </div>

          {/* Window selector when must-be-home is on */}
          {value.must_be_home && (
            <div className="mt-3 flex items-center gap-3 pl-11">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={value.must_be_home_window ?? "morning"}
                onValueChange={(v) =>
                  onChange({ ...value, must_be_home_window: v })
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINDOW_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
