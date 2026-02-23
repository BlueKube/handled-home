import { useNavigate } from "react-router-dom";
import { useZoneHealth } from "@/hooks/useZoneHealth";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Users, AlertTriangle, TrendingUp } from "lucide-react";

function Sparkline({ data, className = "" }: { data: number[]; className?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 48;
  const h = 16;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className={`inline-block ${className}`} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OpsZones() {
  const { data: zones, isLoading } = useZoneHealth();
  const nav = useNavigate();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2">Zone Health</h1>
          <p className="text-caption">Capacity, quality, and demand by zone</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : !zones?.length ? (
        <p className="text-muted-foreground text-center py-12">No zones found.</p>
      ) : (
        <div className="space-y-3">
          {zones.map((z) => (
            <Card
              key={z.id}
              className="p-4 cursor-pointer press-feedback space-y-3"
              onClick={() => nav(`/admin/ops/zones/${z.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{z.name}</p>
                  <p className="text-caption">{z.regionName}</p>
                </div>
                <StatusBadge status={z.status} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{z.assignedCount}/{z.maxStops} ({z.capacityPct}%)</span>
                </div>
                <Progress value={z.capacityPct} className="h-2" />
              </div>

              {/* Week load bars */}
              {z.weekLoadBars.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Week Load</p>
                  <div className="flex gap-1">
                    {z.weekLoadBars.map((bar, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className="h-6 bg-muted rounded-sm overflow-hidden relative">
                          <div
                            className={`absolute bottom-0 left-0 right-0 rounded-sm ${
                              bar.pct >= 90 ? "bg-destructive" : bar.pct >= 70 ? "bg-warning" : "bg-primary"
                            }`}
                            style={{ height: `${Math.min(bar.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{bar.day.slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground items-center">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {z.defaultServiceDay}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {z.activeSubscriptions} subs
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {z.issueRate7d}% issue rate
                  <Sparkline data={z.trendIssueRate} className="text-destructive" />
                </span>
                <span className="flex items-center gap-1">
                  Cap trend <Sparkline data={z.trendCapacity} className="text-primary" />
                </span>
                <span>+{z.newSignups7d} new (7d)</span>
                {z.growthPressure > 0 && (
                  <span className="flex items-center gap-1 text-warning">
                    <TrendingUp className="h-3.5 w-3.5" /> {z.growthPressure} pending
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
