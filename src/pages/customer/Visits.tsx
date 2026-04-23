import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { CalendarClock, Camera, CheckCircle, Clock, PlayCircle } from "lucide-react";
import { useCustomerJobs, type CustomerJob } from "@/hooks/useCustomerJobs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";

type Bucket = "upcoming" | "in_progress" | "past";

const BUCKETS: { key: Bucket; label: string; statuses: string[] }[] = [
  { key: "upcoming", label: "Upcoming", statuses: ["NOT_STARTED"] },
  { key: "in_progress", label: "In progress", statuses: ["IN_PROGRESS"] },
  { key: "past", label: "Past", statuses: ["COMPLETED", "PARTIAL_COMPLETE"] },
];

function partitionJobs(jobs: CustomerJob[]): Record<Bucket, CustomerJob[]> {
  const out: Record<Bucket, CustomerJob[]> = { upcoming: [], in_progress: [], past: [] };
  for (const job of jobs) {
    for (const bucket of BUCKETS) {
      if (bucket.statuses.includes(job.status)) {
        out[bucket.key].push(job);
        break;
      }
    }
    // ISSUE_REPORTED and other statuses are intentionally dropped from the
    // customer-facing Visits view — they surface via notifications / support
    // flows instead.
  }
  // Upcoming ascending by scheduled_date; In progress + Past descending by
  // most-recent activity.
  out.upcoming.sort((a, b) =>
    (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""),
  );
  out.in_progress.sort((a, b) =>
    (b.started_at ?? b.scheduled_date ?? "").localeCompare(
      a.started_at ?? a.scheduled_date ?? "",
    ),
  );
  out.past.sort((a, b) =>
    (b.completed_at ?? b.scheduled_date ?? "").localeCompare(
      a.completed_at ?? a.scheduled_date ?? "",
    ),
  );
  return out;
}

export default function CustomerVisits() {
  const { data: jobs = [], isLoading, isError, refetch } = useCustomerJobs("all", {
    includePhotos: true,
  });

  const buckets = useMemo(() => partitionJobs(jobs), [jobs]);

  if (isError) {
    return (
      <div className="p-4 pb-24 space-y-4 animate-fade-in">
        <h1 className="text-h2">Visits</h1>
        <QueryErrorCard message="Failed to load visits." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <h1 className="text-h2">Visits</h1>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-3">
          {BUCKETS.map((b) => (
            <TabsTrigger key={b.key} value={b.key}>
              {b.label}
              {!isLoading && buckets[b.key].length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                  {buckets[b.key].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {BUCKETS.map((b) => (
          <TabsContent key={b.key} value={b.key} className="mt-4">
            <BucketPanel bucket={b.key} jobs={buckets[b.key]} isLoading={isLoading} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function BucketPanel({
  bucket,
  jobs,
  isLoading,
}: {
  bucket: Bucket;
  jobs: CustomerJob[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  if (jobs.length === 0) {
    const empty = EMPTY_STATES[bucket];
    return <CustomerEmptyState icon={empty.icon} title={empty.title} body={empty.body} />;
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <VisitRow key={job.id} job={job} bucket={bucket} />
      ))}
    </div>
  );
}

const EMPTY_STATES: Record<Bucket, { icon: React.ElementType; title: string; body: string }> = {
  upcoming: {
    icon: CalendarClock,
    title: "No upcoming visits",
    body: "Your next scheduled services will show up here.",
  },
  in_progress: {
    icon: PlayCircle,
    title: "Nothing happening right now",
    body: "When a provider starts a visit, it'll appear here in real time.",
  },
  past: {
    icon: Clock,
    title: "Your service history will build here",
    body: "Each completed visit includes proof photos and a receipt.",
  },
};

function VisitRow({ job, bucket }: { job: CustomerJob; bucket: Bucket }) {
  const navigate = useNavigate();
  const title =
    job.skus
      ?.map((s) => s.sku_name_snapshot)
      .filter(Boolean)
      .join(", ") || "Service visit";

  const dateLabel = formatRowDate(job, bucket);
  const Icon = ROW_ICON[bucket];

  return (
    <Card
      onClick={() => navigate(`/customer/visits/${job.id}`)}
      className="p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/customer/visits/${job.id}`);
        }
      }}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
          {bucket === "past" && job.photo_count > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Camera className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {job.photo_count} photo{job.photo_count !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

const ROW_ICON: Record<Bucket, React.ElementType> = {
  upcoming: CalendarClock,
  in_progress: PlayCircle,
  past: CheckCircle,
};

function formatRowDate(job: CustomerJob, bucket: Bucket): string {
  if (bucket === "past") {
    const src = job.completed_at ?? job.scheduled_date;
    if (!src) return "Completed";
    return format(job.completed_at ? new Date(src) : parseISO(src), "EEE, MMM d");
  }
  if (bucket === "in_progress") {
    if (job.started_at) {
      return `Started ${format(new Date(job.started_at), "h:mm a")}`;
    }
    return "In progress";
  }
  // upcoming
  if (!job.scheduled_date) return "Scheduled";
  return format(parseISO(job.scheduled_date), "EEE, MMM d");
}
