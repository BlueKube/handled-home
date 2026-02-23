import { useParams, useNavigate } from "react-router-dom";
import { useZoneHealth, useZoneHealthDetail } from "@/hooks/useZoneHealth";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Settings, CreditCard, TrendingUp } from "lucide-react";

export default function OpsZoneDetail() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const nav = useNavigate();
  const { data: zones } = useZoneHealth();
  const { data: detail, isLoading } = useZoneHealthDetail(zoneId ?? null);

  const zone = zones?.find((z) => z.id === zoneId);

  if (isLoading || !zone) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const capacities = detail?.capacities ?? [];
  const providers = detail?.providers ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops/zones")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2">{zone.name}</h1>
          <p className="text-caption">{zone.regionName} • {zone.defaultServiceDay}</p>
        </div>
      </div>

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
        <div className="grid grid-cols-3 gap-4 text-center">
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
        </div>
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
