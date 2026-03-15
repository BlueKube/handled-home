import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderWorkProfile, type WorkingHours } from "@/hooks/useProviderWorkProfile";
import { useProviderBlockedWindows, type CreateBlockedWindowInput } from "@/hooks/useProviderBlockedWindows";
import { useProviderAvailability } from "@/hooks/useProviderAvailability";
import { useAssignmentConfig, DIAL_META } from "@/hooks/useAssignmentConfig";
import { toast } from "sonner";
import {
  Clock, Plus, Trash2, AlertTriangle, CheckCircle2, Calendar, MapPin, Shield, Activity, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 5;
  const m = i % 2 === 0 ? "00" : "30";
  const val = `${String(h).padStart(2, "0")}:${m}`;
  const ampm = h >= 12 ? "PM" : "AM";
  const display = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${ampm}`;
  return { value: val, label: display };
});

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatTime(time: string): string {
  const opt = TIME_OPTIONS.find((t) => t.value === time);
  return opt?.label ?? time;
}

export default function ProviderAvailability() {
  const navigate = useNavigate();
  const { org, loading: orgLoading } = useProviderOrg();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useProviderWorkProfile(org?.id);
  const { windows, isLoading: windowsLoading, isError: windowsError, refetch: refetchWindows, create, remove } = useProviderBlockedWindows();
  const { blocks: offDayBlocks, shortNoticeBlocks } = useProviderAvailability();
  const { data: configRows } = useAssignmentConfig();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWindow, setNewWindow] = useState<CreateBlockedWindowInput>({
    day_of_week: 1,
    start_time: "10:00",
    end_time: "11:30",
    label: "",
    is_recurring: true,
    specific_date: null,
  });

  const loading = orgLoading || profileLoading || windowsLoading;

  // Get config dials for availability thresholds
  const configMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of configRows ?? []) {
      m.set(r.config_key, Number(r.config_value));
    }
    return m;
  }, [configRows]);

  const minHoursPerWeek = configMap.get("min_handled_hours_per_week") ?? 8;
  const fullHoursPerWeek = configMap.get("full_marketplace_hours_per_week") ?? 12;
  const maxRecurringBlocks = configMap.get("max_recurring_blocks_per_week") ?? 3;
  const maxSegmentsPerDay = configMap.get("max_segments_per_day") ?? 3;
  const minSegmentMinutes = configMap.get("min_segment_minutes") ?? 90;

  // Compute weekly available hours from working_hours
  const workingHours = (profile?.working_hours as WorkingHours) ?? {};
  const weeklyStats = useMemo(() => {
    let totalMinutes = 0;
    let activeDays = 0;
    const dayMinutes: Record<string, number> = {};

    for (const dayKey of WEEKDAY_KEYS) {
      const day = workingHours[dayKey];
      if (day?.start && day?.end) {
        const mins = parseTimeToMinutes(day.end) - parseTimeToMinutes(day.start);
        if (mins > 0) {
          totalMinutes += mins;
          activeDays++;
          dayMinutes[dayKey] = mins;
        }
      }
    }

    // Subtract recurring blocked windows
    let blockedMinutes = 0;
    const recurringWindows = windows.filter((w) => w.is_recurring);
    for (const w of recurringWindows) {
      const dur = parseTimeToMinutes(w.end_time) - parseTimeToMinutes(w.start_time);
      if (dur > 0) blockedMinutes += dur;
    }

    const netMinutes = Math.max(0, totalMinutes - blockedMinutes);
    const netHours = netMinutes / 60;

    return { totalMinutes, activeDays, netMinutes, netHours, blockedMinutes, dayMinutes };
  }, [workingHours, windows]);

  // Availability health
  const healthLabel = useMemo(() => {
    if (weeklyStats.netHours >= fullHoursPerWeek) return "great";
    if (weeklyStats.netHours >= minHoursPerWeek) return "good";
    return "limited";
  }, [weeklyStats.netHours, fullHoursPerWeek, minHoursPerWeek]);

  // Fragmentation warnings
  const fragmentationWarnings = useMemo(() => {
    const warnings: string[] = [];
    const recurringCount = windows.filter((w) => w.is_recurring).length;

    if (recurringCount > maxRecurringBlocks) {
      warnings.push(`You have ${recurringCount} recurring blocks (max recommended: ${maxRecurringBlocks}).`);
    }

    // Check segments per day
    for (let dow = 0; dow < 7; dow++) {
      const dayKey = WEEKDAY_KEYS[dow];
      const dayHours = workingHours[dayKey];
      if (!dayHours?.start || !dayHours?.end) continue;

      const dayBlocks = windows.filter((w) => w.is_recurring && w.day_of_week === dow);
      const segmentCount = dayBlocks.length + 1;

      if (segmentCount > maxSegmentsPerDay) {
        warnings.push(`${DAY_FULL[dow]} has ${segmentCount} segments (max: ${maxSegmentsPerDay}).`);
      }

      // Check min segment duration
      if (dayBlocks.length > 0) {
        const workStart = parseTimeToMinutes(dayHours.start);
        const workEnd = parseTimeToMinutes(dayHours.end);
        const sorted = dayBlocks
          .map((b) => ({ start: parseTimeToMinutes(b.start_time), end: parseTimeToMinutes(b.end_time) }))
          .sort((a, b) => a.start - b.start);

        let cursor = workStart;
        for (const block of sorted) {
          const segDuration = block.start - cursor;
          if (segDuration > 0 && segDuration < minSegmentMinutes) {
            warnings.push(`${DAY_FULL[dow]}: ${segDuration}min gap before block is too short (min: ${minSegmentMinutes}min).`);
          }
          cursor = block.end;
        }
        const lastSeg = workEnd - cursor;
        if (lastSeg > 0 && lastSeg < minSegmentMinutes) {
          warnings.push(`${DAY_FULL[dow]}: ${lastSeg}min gap after last block is too short (min: ${minSegmentMinutes}min).`);
        }
      }
    }

    return warnings;
  }, [windows, workingHours, maxRecurringBlocks, maxSegmentsPerDay, minSegmentMinutes]);

  const handleCreateWindow = async () => {
    try {
      await create.mutateAsync(newWindow);
      toast.success("Blocked window added");
      setDialogOpen(false);
      setNewWindow({ day_of_week: 1, start_time: "10:00", end_time: "11:30", label: "", is_recurring: true, specific_date: null });
    } catch {
      toast.error("Failed to add blocked window");
    }
  };

  const handleRemoveWindow = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Blocked window removed");
    } catch {
      toast.error("Failed to remove blocked window");
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (profileError || windowsError) {
    return (
      <div className="p-4">
        <QueryErrorCard
          message="Failed to load availability data."
          onRetry={() => { refetchProfile(); refetchWindows(); }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/provider/coverage")} aria-label="Back to coverage">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Availability</h1>
          <p className="text-caption mt-0.5">Manage your schedule and blocked windows</p>
        </div>
      </div>

      {/* Availability Health Meter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Availability Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Weekly available hours</span>
            <span className="text-lg font-semibold">{weeklyStats.netHours.toFixed(1)}h</span>
          </div>

          {/* Health bar */}
          <div className="space-y-1.5">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  healthLabel === "great" && "bg-primary",
                  healthLabel === "good" && "bg-accent",
                  healthLabel === "limited" && "bg-destructive"
                )}
                style={{ width: `${Math.min(100, (weeklyStats.netHours / fullHoursPerWeek) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0h</span>
              <span className="flex items-center gap-1">
                Min {minHoursPerWeek}h
              </span>
              <span>Full {fullHoursPerWeek}h</span>
            </div>
          </div>

          <Badge
            variant={healthLabel === "great" ? "default" : healthLabel === "good" ? "secondary" : "destructive"}
            className="text-xs"
          >
            {healthLabel === "great" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {healthLabel === "limited" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {healthLabel === "great"
              ? "Great for routing"
              : healthLabel === "good"
              ? "Good availability"
              : "Limited — may miss job assignments"}
          </Badge>

          {weeklyStats.blockedMinutes > 0 && (
            <p className="text-xs text-muted-foreground">
              {(weeklyStats.blockedMinutes / 60).toFixed(1)}h/week blocked by recurring windows
            </p>
          )}
        </CardContent>
      </Card>

      {/* Working Hours Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Weekly Schedule
          </CardTitle>
          <CardDescription className="text-xs">
            Set in <a href="/provider/work-setup" className="text-primary underline">Work Setup</a>. {weeklyStats.activeDays} active days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_KEYS.map((dayKey, i) => {
              const day = workingHours[dayKey];
              const active = day?.start && day?.end;
              return (
                <div
                  key={dayKey}
                  className={cn(
                    "text-center rounded-lg py-2 px-1",
                    active ? "bg-primary/10" : "bg-muted/50"
                  )}
                >
                  <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                    {DAY_LABELS[i]}
                  </span>
                  {active && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {day.start}–{day.end}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Windows */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Blocked Windows
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Time slots reserved for legacy clients or personal commitments.
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Add Blocked Window</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Recurring toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Recurring weekly</Label>
                    <Switch
                      checked={newWindow.is_recurring}
                      onCheckedChange={(v) =>
                        setNewWindow((p) => ({
                          ...p,
                          is_recurring: v,
                          day_of_week: v ? (p.day_of_week ?? 1) : null,
                          specific_date: v ? null : p.specific_date,
                        }))
                      }
                    />
                  </div>

                  {/* Day of week or specific date */}
                  {newWindow.is_recurring ? (
                    <div className="space-y-1.5">
                      <Label className="text-sm">Day of week</Label>
                      <Select
                        value={String(newWindow.day_of_week ?? 1)}
                        onValueChange={(v) => setNewWindow((p) => ({ ...p, day_of_week: parseInt(v) }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAY_FULL.map((d, i) => (
                            <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-sm">Date</Label>
                      <Input
                        type="date"
                        value={newWindow.specific_date ?? ""}
                        onChange={(e) => setNewWindow((p) => ({ ...p, specific_date: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Time range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start</Label>
                      <Select
                        value={newWindow.start_time}
                        onValueChange={(v) => setNewWindow((p) => ({ ...p, start_time: v }))}
                      >
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End</Label>
                      <Select
                        value={newWindow.end_time}
                        onValueChange={(v) => setNewWindow((p) => ({ ...p, end_time: v }))}
                      >
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Label */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Label</Label>
                    <Input
                      placeholder="e.g. Legacy client – Mrs. Chen"
                      value={newWindow.label}
                      onChange={(e) => setNewWindow((p) => ({ ...p, label: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">Cancel</Button>
                  </DialogClose>
                  <Button
                    size="sm"
                    onClick={handleCreateWindow}
                    disabled={create.isPending || (!newWindow.is_recurring && !newWindow.specific_date)}
                  >
                    {create.isPending ? "Adding…" : "Add Window"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {windows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No blocked windows. Add one if you have recurring commitments.
            </p>
          ) : (
            <div className="space-y-2">
              {windows.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {w.is_recurring ? (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          <Calendar className="h-2.5 w-2.5 mr-0.5" />
                          {w.day_of_week !== null ? DAY_LABELS[w.day_of_week] : "—"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {w.specific_date ?? "One-off"}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(w.start_time)} – {formatTime(w.end_time)}
                      </span>
                    </div>
                    {w.label && (
                      <p className="text-sm mt-1 truncate">{w.label}</p>
                    )}
                    {(w.location_lat || w.location_lng) && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {w.location_lat?.toFixed(4)}, {w.location_lng?.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveWindow(w.id)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Off-Day Blocks (from existing availability system) */}
      {offDayBlocks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Vacation & Off Days
            </CardTitle>
            <CardDescription className="text-xs">
              {offDayBlocks.length} active block{offDayBlocks.length !== 1 ? "s" : ""}
              {shortNoticeBlocks.length > 0 && (
                <span className="text-destructive ml-1">
                  ({shortNoticeBlocks.length} within 48h)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offDayBlocks.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm">{b.block_type}</span>
                    <p className="text-xs text-muted-foreground">
                      {b.start_date} → {b.end_date}
                    </p>
                  </div>
                  {shortNoticeBlocks.some((s) => s.id === b.id) && (
                    <Badge variant="destructive" className="text-[10px]">
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      Short notice
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fragmentation Warnings */}
      {fragmentationWarnings.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Routing Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {fragmentationWarnings.map((w, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  {w}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Too many blocked windows fragment your day, making routes less efficient.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
