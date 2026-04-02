import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrowthEventStats } from "@/hooks/useGrowthEvents";
import { ZoneFilter } from "./ZoneFilter";
import { type ZoneTabProps } from "./shared";

const FUNNEL_STEPS = [
  { key: "prompt_shown", label: "Prompted" },
  { key: "share_initiated", label: "Initiated" },
  { key: "share_completed", label: "Shared" },
  { key: "landing_viewed", label: "Viewed" },
  { key: "signup_completed", label: "Signed up" },
];

export function EventsTab({ selectedZone, setSelectedZone }: ZoneTabProps) {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");

  const dateFilter = useMemo(() => {
    if (dateRange === "all") return undefined;
    const start = new Date();
    start.setDate(start.getDate() - (dateRange === "7d" ? 7 : 30));
    return { start: start.toISOString(), end: new Date().toISOString() };
  }, [dateRange]);

  const stats = useGrowthEventStats(selectedZone === "__all__" ? undefined : selectedZone, dateFilter);

  if (stats.isLoading) return <Skeleton className="h-48 mt-4" />;

  const { byType = {}, bySurface = {}, total = 0 } = stats.data ?? {};

  const funnelData = FUNNEL_STEPS.map((step) => ({
    ...step,
    count: byType[step.key] ?? 0,
  }));
  const maxFunnel = Math.max(1, ...funnelData.map((f) => f.count));

  const surfaceEntries = Object.entries(bySurface).sort(([, a], [, b]) => (b as number) - (a as number));
  const maxSurface = Math.max(1, ...surfaceEntries.map(([, v]) => v as number));

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <ZoneFilter selectedZone={selectedZone} setSelectedZone={setSelectedZone} />
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7d" | "30d" | "all")}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Conversion Funnel
          </CardTitle>
          <p className="text-xs text-muted-foreground">{total} total events ({dateRange === "all" ? "all time" : `last ${dateRange === "7d" ? "7" : "30"} days`})</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {funnelData.map((step, i) => (
            <div key={step.key} className="flex items-center gap-3">
              <span className="text-xs w-20 text-muted-foreground">{step.label}</span>
              <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                <div className="h-full bg-primary/70 rounded-sm transition-all" style={{ width: `${(step.count / maxFunnel) * 100}%` }} />
              </div>
              <span className="text-xs font-medium w-10 text-right">{step.count}</span>
              {i > 0 && funnelData[i - 1].count > 0 && (
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {Math.round((step.count / funnelData[i - 1].count) * 100)}%
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">By Surface</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {surfaceEntries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No events recorded yet.</p>
          )}
          {surfaceEntries.map(([surface, count]) => (
            <div key={surface} className="flex items-center gap-3">
              <span className="text-xs w-40 capitalize text-muted-foreground">{surface.replace(/_/g, " ")}</span>
              <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                <div className="h-full bg-accent rounded-sm transition-all" style={{ width: `${((count as number) / maxSurface) * 100}%` }} />
              </div>
              <span className="text-xs font-medium w-8 text-right">{count as number}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">All Event Types</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).sort(([, a], [, b]) => (b as number) - (a as number)).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.replace(/_/g, " ")}: {count as number}
              </Badge>
            ))}
            {Object.keys(byType).length === 0 && (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
