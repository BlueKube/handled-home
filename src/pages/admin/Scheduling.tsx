import { useState } from "react";
import { useZones } from "@/hooks/useZones";
import { useServiceDayAdmin } from "@/hooks/useServiceDayAdmin";
import { useServiceDayCapacity } from "@/hooks/useServiceDayCapacity";
import { useAssignmentLog } from "@/hooks/useAssignmentLog";
import { ServiceDayOverrideModal } from "@/components/admin/ServiceDayOverrideModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CalendarClock, CloudRain, FileText, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function AdminScheduling() {
  const { data: zones, isLoading: zonesLoading } = useZones();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<any>(null);
  const [weatherMode, setWeatherMode] = useState(false);

  const activeZones = (zones ?? []).filter((z) => z.status === "active");
  const zoneId = selectedZoneId || activeZones[0]?.id || null;
  const zoneName = activeZones.find((z) => z.id === zoneId)?.name ?? "—";

  const { assignments, overrideLogs, isLoading: assignLoading, overrideAssignment } = useServiceDayAdmin(zoneId);
  const { capacities: capacityData } = useServiceDayCapacity(zoneId);
  const { data: assignmentLogs, isLoading: logLoading } = useAssignmentLog({ zoneId: zoneId ?? undefined, limit: 50 });

  const handleWeatherToggle = () => {
    setWeatherMode(!weatherMode);
    toast.info(weatherMode ? "Weather mode deactivated" : "Weather mode activated — all jobs will be rescheduled");
  };

  // Group assignments by day
  const byDay: Record<string, typeof assignments> = {};
  DAYS.forEach((d) => { byDay[d] = []; });
  assignments.forEach((a) => {
    const day = a.day_of_week?.toLowerCase();
    if (byDay[day]) byDay[day].push(a);
  });

  // Capacity summary per day
  const capByDay: Record<string, { max: number; assigned: number }> = {};
  (capacityData ?? []).forEach((c: any) => {
    const day = c.day_of_week?.toLowerCase();
    if (!capByDay[day]) capByDay[day] = { max: 0, assigned: 0 };
    capByDay[day].max += c.max_homes || 0;
    capByDay[day].assigned += c.assigned_count || 0;
  });

  const isLoading = zonesLoading || assignLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Scheduling Operations</h1>
          <p className="text-caption">Manage service day assignments, overrides & weather events</p>
        </div>
        <Button
          variant={weatherMode ? "destructive" : "outline"}
          className="gap-2"
          onClick={handleWeatherToggle}
        >
          <CloudRain className="h-4 w-4" />
          {weatherMode ? "Weather Mode ON" : "Weather Mode"}
        </Button>
      </div>

      {/* Zone picker */}
      <div className="flex items-center gap-3">
        <Select value={zoneId ?? ""} onValueChange={setSelectedZoneId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select zone" />
          </SelectTrigger>
          <SelectContent>
            {activeZones.map((z) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {zoneId && <Badge variant="outline">{assignments.length} assignments</Badge>}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="assignments">
          <TabsList>
            <TabsTrigger value="assignments" className="gap-1.5"><Users className="h-3.5 w-3.5" />Assignments</TabsTrigger>
            <TabsTrigger value="capacity" className="gap-1.5"><CalendarClock className="h-3.5 w-3.5" />Capacity</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Override Log</TabsTrigger>
            <TabsTrigger value="assignment-log" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Assignment Log</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            {DAYS.map((day) => {
              const dayAssignments = byDay[day] ?? [];
              const cap = capByDay[day];
              const pct = cap && cap.max > 0 ? Math.round((cap.assigned / cap.max) * 100) : 0;
              if (dayAssignments.length === 0 && !cap) return null;
              return (
                <Card key={day}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize flex items-center gap-2">
                        {day}
                        <Badge variant="secondary">{dayAssignments.length} homes</Badge>
                      </CardTitle>
                      {pct >= 90 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />{pct}% full
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {dayAssignments.length > 0 && (
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Window</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayAssignments.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-mono text-xs">{a.customer_id.slice(0, 8)}…</TableCell>
                              <TableCell>{a.service_window}</TableCell>
                              <TableCell>
                                <Badge variant={a.status === "confirmed" ? "default" : "secondary"}>
                                  {a.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => setOverrideTarget(a)}>
                                  Override
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              );
            })}
            {assignments.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No assignments in this zone</p>
            )}
          </TabsContent>

          <TabsContent value="capacity">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {DAYS.map((day) => {
                    const cap = capByDay[day];
                    const pct = cap && cap.max > 0 ? Math.round((cap.assigned / cap.max) * 100) : 0;
                    return (
                      <div key={day} className="rounded-lg border border-border p-3 space-y-1">
                        <p className="text-xs font-medium capitalize">{day}</p>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-bold">{cap?.assigned ?? 0}</span>
                          <span className="text-sm text-muted-foreground">/ {cap?.max ?? "—"}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-primary"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                {overrideLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No overrides recorded</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overrideLogs.slice(0, 20).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {new Date(log.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.before?.day_of_week ?? "?"} → {log.after?.day_of_week ?? "?"}
                          </TableCell>
                          <TableCell className="text-xs">{log.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignment-log">
            <Card>
              <CardContent className="pt-6">
                {logLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : !assignmentLogs?.length ? (
                  <p className="text-center text-muted-foreground py-6">No assignment logs yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>By</TableHead>
                        <TableHead className="max-w-[200px]">Admin Explanation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignmentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              log.assignment_reason === "primary_available" ? "default" :
                              log.assignment_reason === "backup_fallback" ? "secondary" :
                              log.assignment_reason.startsWith("no_show") ? "destructive" :
                              "outline"
                            } className="text-[10px]">
                              {log.assignment_reason.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.provider_org_name ?? (log.provider_org_id ? log.provider_org_id.slice(0, 8) + "…" : "—")}
                          </TableCell>
                          <TableCell className="text-xs">{log.assigned_by}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={log.explain_admin ?? ""}>
                            {log.explain_admin ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {overrideTarget && (
        <ServiceDayOverrideModal
          open={!!overrideTarget}
          onOpenChange={(open) => { if (!open) setOverrideTarget(null); }}
          assignmentId={overrideTarget.id}
          currentDay={overrideTarget.day_of_week}
          onOverride={async ({ assignmentId, newDay, newWindow, reason, notes }) => {
            await overrideAssignment.mutateAsync({
              assignmentId,
              newDay,
              newWindow,
              reason,
              notes,
            });
            setOverrideTarget(null);
          }}
          isPending={overrideAssignment.isPending}
          capacities={(capacityData ?? []).map((c) => ({
            day_of_week: c.day_of_week,
            max_homes: c.max_homes,
            buffer_percent: c.buffer_percent,
            assigned_count: c.assigned_count,
          }))}
        />
      )}
    </div>
  );
}
