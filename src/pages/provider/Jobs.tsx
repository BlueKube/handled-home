import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useProviderJobs, ProviderJob } from "@/hooks/useProviderJobs";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderRoutePlan } from "@/hooks/useProviderRoutePlan";
import { useOptimizeRoute, useReorderRoute } from "@/hooks/useRouteOptimization";
import { useProviderVisits } from "@/hooks/useProviderVisits";
import { ProviderMapView } from "@/components/provider/ProviderMapView";
import { TodayLoadout, DayPlanSummary } from "@/components/provider/DayPlanComponents";
import { VisitJobCard } from "@/components/provider/VisitJobCard";
import { WeekDueQueue } from "@/components/provider/WeekDueQueue";
import { EmptyState } from "@/components/ui/empty-state";
import { MapPin, Clock, ChevronRight, ArrowUp, ArrowDown, Route, Loader2, Lock, Map as MapIcon, List, ShieldCheck, Timer, CalendarClock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

function JobCard({ job, index, total, onMoveUp, onMoveDown, showReorder, isSelected, onSelect }: {
  job: ProviderJob;
  index: number;
  total: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showReorder: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const navigate = useNavigate();
  const skuNames = job.job_skus?.map((s) => s.sku_name_snapshot).filter(Boolean).join(", ") || "No services listed";
  const totalMinutes = job.job_skus?.reduce((sum, s) => sum + (s.duration_minutes_snapshot ?? 0), 0) ?? 0;
  const addr = job.property;
  const isNext = index === 0 && job.status !== "IN_PROGRESS";

  // Determine if job is in freeze window (≤7 days) or planning horizon (>7 days)
  const daysUntil = job.scheduled_date
    ? differenceInDays(parseISO(job.scheduled_date), new Date())
    : 0;
  const isScheduledWindow = daysUntil <= 7;
  const planLabel = isScheduledWindow ? "Scheduled" : "Planned";

  return (
    <Card
      className={`p-4 press-feedback cursor-pointer ${isNext ? "ring-2 ring-accent/40" : ""} ${isSelected ? "bg-accent/5 border-accent/30" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
         {showReorder && (
          <div className="flex flex-col gap-0.5 shrink-0 pt-1">
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6"
              disabled={index === 0 || job.status === "IN_PROGRESS"}
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6"
              disabled={index === total - 1 || job.status === "IN_PROGRESS"}
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div
          className="flex-1 min-w-0"
          onClick={(e) => { e.stopPropagation(); navigate(`/provider/jobs/${job.id}`); }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-accent bg-accent/10 rounded-full px-2 py-0.5">
              {isNext ? "Next" : `#${index + 1}`}
            </span>
            <StatusBadge status={job.status.toLowerCase()} />
            {!showReorder && (
              <Badge
                variant={isScheduledWindow ? "default" : "outline"}
                className="text-[10px] px-1.5 py-0"
              >
                {planLabel}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
              Primary
            </Badge>
            {job.status === "IN_PROGRESS" && (
              <span className="text-xs text-warning font-medium">Resume</span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">
            {addr ? `${addr.street_address}, ${addr.city}` : "Property"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{skuNames}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {job.scheduled_date && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(job.scheduled_date), "EEE, MMM d")}
              </span>
            )}
            {totalMinutes > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                ~{totalMinutes} min
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Card>
  );
}

function TodayJobList() {
  const navigate = useNavigate();
  const { data: jobs, isLoading, isError } = useProviderJobs("today");
  const { org } = useProviderOrg();
  const { isLocked } = useProviderRoutePlan();
  const optimizeRoute = useOptimizeRoute();
  const reorderRoute = useReorderRoute();
  const [localJobs, setLocalJobs] = useState<ProviderJob[] | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">(
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? "map" : "list"
  );
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const displayJobs = localJobs ?? jobs;
  const today = new Date().toISOString().split("T")[0];

  const handleOptimize = () => {
    if (!org?.id) return;
    optimizeRoute.mutate(
      { providerOrgId: org.id, date: today },
      {
        onSuccess: (data) => {
          setLocalJobs(null);
          toast.success(`Route optimized — ${data.optimized} stops ordered`);
        },
        onError: () => toast.error("Failed to optimize route"),
      }
    );
  };

  const handleMove = (fromIdx: number, toIdx: number) => {
    if (!displayJobs || !org?.id) return;
    const reordered = [...displayJobs];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setLocalJobs(reordered);

    const jobOrders = reordered
      .filter((j) => j.status !== "IN_PROGRESS")
      .map((j, i) => ({ job_id: j.id, route_order: i + 1 }));

    reorderRoute.mutate(
      { providerOrgId: org.id, date: today, jobOrders },
      {
        onSuccess: () => toast.success("Route order saved"),
        onError: () => {
          setLocalJobs(null);
          toast.error("Failed to save route order");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        compact
        icon={MapPin}
        title="Couldn't load jobs"
        body="Something went wrong loading your route. Pull down to retry."
      />
    );
  }

  if (!displayJobs || displayJobs.length === 0) {
    return (
      <EmptyState
        compact
        icon={MapPin}
        title="No jobs scheduled for today"
        body="Jobs will appear here when assigned to your route. In the meantime, invite your existing customers to get started."
        ctaLabel="Invite Customers"
        ctaAction={() => navigate("/provider/byoc")}
        ctaVariant="outline"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {displayJobs.length} stop{displayJobs.length !== 1 ? "s" : ""}
          {isLocked && (
            <span className="ml-2 inline-flex items-center gap-1 text-accent font-medium">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {/* List / Map toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 rounded-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 rounded-none"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          {viewMode === "list" && !isLocked && (
            <Button
              variant="outline" size="sm"
              onClick={handleOptimize}
              disabled={optimizeRoute.isPending || displayJobs.length < 3}
            >
              {optimizeRoute.isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Route className="h-3 w-3 mr-1" />
              )}
              Optimize
            </Button>
          )}
        </div>
      </div>

      {viewMode === "map" ? (
        <ProviderMapView
          jobs={displayJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
      ) : (
        displayJobs.map((job, i) => (
          <JobCard
            key={job.id}
            job={job}
            index={i}
            total={displayJobs.length}
            showReorder={!isLocked && displayJobs.length > 1}
            isSelected={job.id === selectedJobId}
            onSelect={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
            onMoveUp={() => handleMove(i, i - 1)}
            onMoveDown={() => handleMove(i, i + 1)}
          />
        ))
      )}
    </div>
  );
}

function UpcomingJobList() {
  const navigate = useNavigate();
  const { data: jobs, isLoading, isError } = useProviderJobs("upcoming");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        compact
        icon={MapPin}
        title="Couldn't load upcoming jobs"
        body="Something went wrong. Please try again later."
      />
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        compact
        icon={MapPin}
        title="No upcoming jobs"
        body="Jobs will appear here when assigned to your schedule. Invite customers to start filling your route."
        ctaLabel="Invite Customers"
        ctaAction={() => navigate("/provider/byoc")}
        ctaVariant="outline"
      />
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job, i) => (
        <JobCard key={job.id} job={job} index={i} total={jobs.length} showReorder={false} />
      ))}
    </div>
  );
}

function WeekView() {
  const { data: visits, isLoading, isError } = useProviderVisits("week");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        compact
        icon={MapPin}
        title="Couldn't load this week's schedule"
        body="Something went wrong. Please try again later."
      />
    );
  }

  // Separate due queue from regular scheduled visits
  const dueVisits = visits?.filter((v) => v.due_status === "due_soon" || v.due_status === "overdue") ?? [];
  const scheduledVisits = visits?.filter((v) => !v.due_status || (v.due_status !== "due_soon" && v.due_status !== "overdue")) ?? [];

  // Group scheduled by date
  const byDate = new Map<string, typeof scheduledVisits>();
  scheduledVisits.forEach((v) => {
    const existing = byDate.get(v.scheduled_date) ?? [];
    existing.push(v);
    byDate.set(v.scheduled_date, existing);
  });

  const sortedDates = Array.from(byDate.keys()).sort();

  return (
    <div className="space-y-5">
      {/* Due queue at top — pass pre-filtered data to avoid redundant fetch */}
      {dueVisits.length > 0 && (
        <WeekDueQueue visits={dueVisits} />
      )}

      {/* Daily breakdown */}
      {sortedDates.length === 0 && dueVisits.length === 0 && (
        <EmptyState
          compact
          icon={CalendarClock}
          title="No visits this week"
          body="Visits will appear here when scheduled for your route."
        />
      )}

      {sortedDates.map((date) => {
        const dayVisits = byDate.get(date) ?? [];
        return (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              {format(parseISO(date), "EEEE, MMM d")}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {dayVisits.length} stop{dayVisits.length !== 1 ? "s" : ""}
              </span>
            </h3>
            {dayVisits.map((visit, i) => (
              <VisitJobCard
                key={visit.id}
                visit={visit}
                index={i}
                total={dayVisits.length}
                showReorder={false}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function StartNextJobCTA() {
  const { data: jobs } = useProviderJobs("today");
  const navigate = useNavigate();

  if (!jobs || jobs.length === 0) return null;

  const nextJob = jobs.find((j) => !["COMPLETED", "CANCELED"].includes(j.status));
  if (!nextJob) return null;

  return (
    <Button
      variant="accent"
      size="lg"
      className="w-full"
      onClick={() => navigate(`/provider/jobs/${nextJob.id}`)}
    >
      <Play className="h-4 w-4 mr-2" />
      Start Next Job
    </Button>
  );
}

export default function ProviderJobs() {
  const [tab, setTab] = useState("today");

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      <h1 className="text-h2">My Jobs</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
          <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4 space-y-3">
          <TodayLoadout />
          <DayPlanSummary />
          <StartNextJobCTA />
          <TodayJobList />
        </TabsContent>
        <TabsContent value="week" className="mt-4">
          <WeekView />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <UpcomingJobList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
