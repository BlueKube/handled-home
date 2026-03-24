import { useParams, useNavigate } from "react-router-dom";
import { useZoneHealth, useZoneHealthDetail } from "@/hooks/useZoneHealth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Settings, CreditCard, TrendingUp, Camera, RotateCcw, Clock, AlertTriangle, Users, ShieldAlert } from "lucide-react";
import { AdminReadOnlyMap } from "@/components/admin/AdminReadOnlyMap";
import { format } from "date-fns";

export default function OpsZoneDetail() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const nav = useNavigate();
  const { data: zones } = useZoneHealth();
  const { data: detail, isLoading } = useZoneHealthDetail(zoneId ?? null);

  const zone = zones?.find((z) => z.id === zoneId);

  if (isLoading || !zone) {
    return (
      <div className="animate-fade-in p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const capacities = detail?.capacities ?? [];
  const providers = detail?.providers ?? [];
  const categoryCoverage = detail?.categoryCoverage ?? [];
  const gapCategories = categoryCoverage.filter((c) => c.hasGap);

  // Fetch today's jobs with coordinates for the map
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: zoneJobs } = useQuery({
    queryKey: ["zone-jobs-map", zoneId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, status, scheduled_date, property:properties(lat, lng, street_address)")
        .eq("zone_id", zoneId!)
        .eq("scheduled_date", today)
        .not("status", "eq", "CANCELED");
      if (error) throw error;
      return data;
    },
    enabled: !!zoneId,
  });

  const mapStops = (zoneJobs ?? [])
    .filter((j: any) => j.property?.lat && j.property?.lng)
    .map((j: any) => ({
      id: j.id,
      lat: j.property.lat,
      lng: j.property.lng,
      label: j.property.street_address,
      status: j.status,
    }));

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops/zones")} aria-label="Back to Zone Health">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">{zone.name}</h1>
          <p className="text-caption">{zone.regionName} • {zone.defaultServiceDay}</p>
        </div>
      </div>

      {/* Coverage Gap Alert */}
      {gapCategories.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4" role="alert">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-warning-foreground">
                Coverage Gap — {gapCategories.length} {gapCategories.length === 1 ? "category" : "categories"} below minimum
              </p>
              <p className="text-xs text-muted-foreground">
                Zones need at least 2 active providers per service category. Categories below threshold may trigger waitlisting for new activations.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {gapCategories.map((g) => (
                  <Badge key={g.category} variant="outline" className="text-warning border-warning/40 capitalize">
                    {g.category} ({g.activeProviders}/{2})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capacity */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Capacity</h2>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Overall</span>
            <span className="font-medium">{zone.assignedCount}/{zone.maxStops} ({zone.capacityPct}%)</span>
          </div>
          <Progress value={zone.capacityPct} className="h-2" />
        </div>
        {capacities.length > 0 && (
          <div className="space-y-2 mt-3">
            {capacities.map((c: any) => {
              const pct = c.max_homes > 0 ? Math.round((c.assigned_count / c.max_homes) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{c.day_of_week} {c.service_window}</span>
                  <span>{c.assigned_count}/{c.max_homes} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Demand */}
      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Demand</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{zone.activeSubscriptions}</p>
            <p className="text-caption">Active Subs</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{zone.newSignups7d}</p>
            <p className="text-caption">New (7d)</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{zone.newSignups30d}</p>
            <p className="text-caption">New (30d)</p>
          </div>
        </div>
      </Card>

      {/* Quality */}
      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Quality (7d)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{zone.issueRate7d}%</p>
            <p className="text-caption">Issue Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{zone.completedJobs7d}</p>
            <p className="text-caption">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{zone.issueCount7d}</p>
            <p className="text-caption">Issues</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{detail?.proofCompliance ?? 100}%</p>
            </div>
            <p className="text-caption">Proof Compliance</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{detail?.redoIntents ?? 0}</p>
            </div>
            <p className="text-caption">Redo Intents</p>
          </div>
        </div>
        {detail?.avgTimeOnSiteMinutes !== undefined && detail.avgTimeOnSiteMinutes > 0 && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Avg time on site: {detail.avgTimeOnSiteMinutes} min</span>
          </div>
        )}
      </Card>

      {/* Provider Coverage */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Provider Coverage</h2>
        {providers.length === 0 ? (
          <p className="text-caption">No providers assigned</p>
        ) : (
          <div className="space-y-2">
            {providers.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{p.businessName}</span>
                  <span className="text-caption ml-2 capitalize">({p.assignmentType})</span>
                </div>
                <span className="text-muted-foreground">{p.jobs7d} jobs (7d)</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Category Coverage Breakdown */}
      {categoryCoverage.length > 0 && (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Coverage by Category
          </h2>
          <div className="space-y-3">
            {categoryCoverage.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{cat.category}</span>
                    {cat.hasGap ? (
                      <Badge variant="outline" className="text-destructive border-destructive/40 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Gap
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-success border-success/40 text-xs">
                        Covered
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {cat.activeProviders} active / {cat.totalProviders} total
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.providers.map((p) => (
                    <Badge
                      key={p.orgId}
                      variant={p.status === "ACTIVE" ? "secondary" : "outline"}
                      className={`text-xs ${p.status !== "ACTIVE" ? "opacity-60" : ""}`}
                    >
                      {p.name}
                      {p.status !== "ACTIVE" && (
                        <span className="ml-1 lowercase">({p.status})</span>
                      )}
                    </Badge>
                  ))}
                  {cat.providers.length === 0 && (
                    <span className="text-xs text-muted-foreground">No providers</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Route Map */}
      {mapStops.length > 0 && (
        <AdminReadOnlyMap stops={mapStops} title={`Today's Route — ${zone.name}`} />
      )}

      {/* Actions */}
      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => nav(`/admin/zones`)}>
            <Settings className="h-3.5 w-3.5 mr-1" /> Edit Zone Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => nav(`/admin/plans`)}>
            <CreditCard className="h-3.5 w-3.5 mr-1" /> Manage Plans
          </Button>
          <Button variant="outline" size="sm" onClick={() => nav(`/admin/growth`)}>
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Growth Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
