import { useMemo } from "react";
import { Bell, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return { value: `${h}:00:00`, label: `${h}:00` };
});

let toggleIdCounter = 0;

function ToggleRow({
  label,
  helper,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  helper: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (v: boolean) => void;
}) {
  const id = `notif-toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function NotificationPreferences() {
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <ToggleRow
          label="Critical Alerts"
          helper="Payment issues, security alerts. Cannot be disabled."
          checked={true}
          disabled
        />
        <ToggleRow
          label="Service Updates"
          helper="Job reminders, schedule changes, completion receipts"
          checked={preferences.service_updates_enabled}
          onCheckedChange={(v) => updatePreference({ field: "service_updates_enabled", value: v })}
        />
        <ToggleRow
          label="Marketing & Tips"
          helper="Seasonal tips, referral rewards, new services"
          checked={preferences.marketing_enabled}
          onCheckedChange={(v) => updatePreference({ field: "marketing_enabled", value: v })}
        />

        <Separator className="my-3" />

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 py-2">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Moon className="h-4 w-4" /> Quiet Hours
              </Label>
              <p className="text-xs text-muted-foreground">
                Non-critical notifications held until quiet hours end
              </p>
            </div>
            <Switch
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(v) => updatePreference({ field: "quiet_hours_enabled", value: v })}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <QuietHoursConfig
              start={preferences.quiet_hours_start}
              end={preferences.quiet_hours_end}
              onStartChange={(v) => updatePreference({ field: "quiet_hours_start", value: v })}
              onEndChange={(v) => updatePreference({ field: "quiet_hours_end", value: v })}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuietHoursConfig({ start, end, onStartChange, onEndChange }: {
  start: string; end: string;
  onStartChange: (v: string) => void; onEndChange: (v: string) => void;
}) {
  const duration = useMemo(() => {
    const s = parseInt(start);
    const e = parseInt(end);
    const hrs = e > s ? e - s : 24 - s + e;
    return `${hrs}h window`;
  }, [start, end]);

  return (
    <div className="space-y-1.5 pl-1">
      <div className="flex items-center gap-2">
        <Select value={start} onValueChange={onStartChange}>
          <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (<SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">to</span>
        <Select value={end} onValueChange={onEndChange}>
          <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (<SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-[11px] text-muted-foreground/70">{duration}</p>
    </div>
  );
}
