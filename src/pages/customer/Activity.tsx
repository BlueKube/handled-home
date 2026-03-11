import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerJobs } from "@/hooks/useCustomerJobs";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Camera,
  Clock,
  Calendar,
  TrendingUp,
  Shield,
} from "lucide-react";
import { format, differenceInMonths } from "date-fns";

function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-xl border p-3 text-center">
      <Icon className="h-4 w-4 text-accent mx-auto mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Activity() {
  const navigate = useNavigate();
  const { data: completedJobs, isLoading } = useCustomerJobs("completed");
  const { data: subscription } = useCustomerSubscription();

  const stats = useMemo(() => {
    if (!completedJobs) return null;
    const totalServices = completedJobs.length;
    const photosCount = completedJobs.reduce(
      (sum, j: any) => sum + (j.job_photos?.length ?? 0),
      0
    );
    const memberSince = subscription?.created_at
      ? differenceInMonths(new Date(), new Date(subscription.created_at))
      : 0;

    return { totalServices, photosCount, memberSince };
  }, [completedJobs, subscription]);

  const groupedJobs = useMemo(() => {
    if (!completedJobs) return [];
    const groups: Record<string, any[]> = {};
    for (const job of completedJobs) {
      const key = job.scheduled_date
        ? format(new Date(job.scheduled_date), "MMMM yyyy")
        : "Unscheduled";
      if (!groups[key]) groups[key] = [];
      groups[key].push(job);
    }
    return Object.entries(groups);
  }, [completedJobs]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        <h1 className="text-h2">Activity</h1>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <h1 className="text-h2">Activity</h1>

      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatPill icon={CheckCircle} label="Services" value={stats.totalServices} />
          <StatPill icon={Camera} label="Photos" value={stats.photosCount} />
          <StatPill
            icon={Clock}
            label="Member"
            value={stats.memberSince > 0 ? `${stats.memberSince}mo` : "New"}
          />
        </div>
      )}

      {/* Value card */}
      {stats && stats.totalServices > 0 && (
        <Card className="p-4 bg-accent/5 border-accent/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-accent shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Your subscription has delivered {stats.totalServices} service{stats.totalServices !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All verified with proof-of-work receipts
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Trust badge */}
      <div className="flex items-center gap-2 justify-center">
        <Shield className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">Insured providers · Proof on every visit</span>
      </div>

      {/* Timeline */}
      {groupedJobs.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No completed services yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Your service history will build here over time.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedJobs.map(([month, jobs]) => (
            <div key={month}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">{month}</h2>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {jobs.length} visit{jobs.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="space-y-2 pl-2 border-l-2 border-accent/20">
                {jobs.map((job: any) => (
                  <Card
                    key={job.id}
                    className="p-3 ml-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => navigate(`/customer/visits/${job.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {job.job_skus
                            ?.map((s: any) => s.sku_name_snapshot)
                            .filter(Boolean)
                            .join(", ") || "Service visit"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.scheduled_date
                            ? format(new Date(job.scheduled_date), "EEE, MMM d")
                            : "Completed"}
                          {job.job_photos?.length > 0 && (
                            <span className="ml-2">
                              <Camera className="h-3 w-3 inline" /> {job.job_photos.length}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photos CTA */}
      {stats && stats.photosCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/customer/photos")}
        >
          <Camera className="h-4 w-4 mr-2" />
          View all photos
        </Button>
      )}
    </div>
  );
}
