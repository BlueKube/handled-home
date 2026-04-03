import { useState } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useExceptionAnalytics } from "@/hooks/useExceptionAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { AlertTriangle, Clock, CheckCircle, ShieldAlert, TrendingUp } from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const TYPE_LABELS: Record<string, string> = {
  window_at_risk: "Window at Risk",
  service_week_at_risk: "Service Week at Risk",
  provider_overload: "Provider Overload",
  coverage_break: "Coverage Break",
  provider_unavailable: "Provider Unavailable",
  access_failure: "Access Failure",
  customer_reschedule: "Customer Reschedule",
  weather_safety: "Weather / Safety",
  quality_block: "Quality Block",
};

const SEVERITY_COLORS: Record<string, string> = {
  urgent: "hsl(0 84% 60%)",
  soon: "hsl(38 92% 50%)",
  watch: "hsl(217 91% 60%)",
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(38 92% 50%)",
  "hsl(142 71% 45%)",
  "hsl(0 84% 60%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
  "hsl(25 95% 53%)",
  "hsl(339 90% 51%)",
  "hsl(171 77% 40%)",
];

export default function ExceptionAnalytics() {
  const [daysBack, setDaysBack] = useState(30);
  const { data, isLoading, isError } = useExceptionAnalytics(daysBack);

  if (isLoading) return <PageSkeleton />;
  if (isError) {
    return (
      <div className="p-6 space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h1 className="text-2xl font-bold">Exception Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load data. Check your connection and try again.
        </p>
      </div>
    );
  }
  if (!data) return <p className="text-center text-muted-foreground py-12">No data available.</p>;

  const typeChartData = (data.by_type ?? []).map((t) => ({
    name: TYPE_LABELS[t.exception_type] ?? t.exception_type,
    total: t.count,
    resolved: t.resolved_count,
    avgHours: t.avg_resolve_hours,
  }));

  const severityData = (data.by_severity ?? []).map((s) => ({
    name: s.severity,
    value: s.count,
  }));

  const resolutionData = (data.resolution_types ?? []).map((r) => ({
    name: r.resolution_type.replace(/_/g, " "),
    value: r.count,
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-h2">Exception Analytics</h1>
        <Select value={String(daysBack)} onValueChange={(v) => setDaysBack(Number(v))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard icon={AlertTriangle} label="Total" value={data.total_exceptions} />
        <KPICard icon={CheckCircle} label="Resolved" value={data.resolved_exceptions} />
        <KPICard icon={TrendingUp} label="Resolution %" value={`${data.resolution_rate}%`} />
        <KPICard icon={Clock} label="Avg Resolve" value={`${data.avg_resolve_hours}h`} />
        <KPICard icon={ShieldAlert} label="Break-Freeze" value={data.break_freeze_count} />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* By Type Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exceptions by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {typeChartData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeChartData} layout="vertical" margin={{ left: 100 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="resolved" fill="hsl(142 71% 45%)" name="Resolved" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No exceptions in period</p>
            )}
          </CardContent>
        </Card>

        {/* Severity Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {severityData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {severityData.map((entry, i) => (
                        <Cell key={i} fill={SEVERITY_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resolution Types + Zone Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Resolution Types Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolution Types</CardTitle>
          </CardHeader>
          <CardContent>
            {resolutionData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={resolutionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {resolutionData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No resolved exceptions</p>
            )}
          </CardContent>
        </Card>

        {/* Zone Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Zone</CardTitle>
          </CardHeader>
          <CardContent>
            {(data.by_zone ?? []).length > 0 ? (
              <div className="space-y-2">
                {data.by_zone.map((z) => (
                  <div key={z.zone_id ?? "none"} className="flex items-center justify-between text-sm">
                    <span className="truncate">{z.zone_name ?? "Unassigned"}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{z.count} total</Badge>
                      <Badge variant="outline" className="text-[10px]">{z.resolved_count} resolved</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time-to-Resolve by Type table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Avg Time-to-Resolve by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(data.by_type ?? []).filter(t => t.resolved_count > 0).map((t) => (
              <div key={t.exception_type} className="border rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[t.exception_type] ?? t.exception_type}</p>
                <p className="text-lg font-semibold">{t.avg_resolve_hours}h</p>
                <p className="text-[10px] text-muted-foreground">{t.resolved_count} of {t.count} resolved</p>
              </div>
            ))}
          </div>
          {(data.by_type ?? []).filter(t => t.resolved_count > 0).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No resolved exceptions to analyze</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
