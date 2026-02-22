import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useProviderJobs, ProviderJob } from "@/hooks/useProviderJobs";
import { MapPin, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

function JobCard({ job, index }: { job: ProviderJob; index: number }) {
  const navigate = useNavigate();
  const skuNames = job.job_skus?.map((s) => s.sku_name_snapshot).filter(Boolean).join(", ") || "No services listed";
  const addr = job.property;

  return (
    <Card
      className="p-4 press-feedback cursor-pointer"
      onClick={() => navigate(`/provider/jobs/${job.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-accent bg-accent/10 rounded-full px-2 py-0.5">
              #{index + 1}
            </span>
            <StatusBadge status={job.status.toLowerCase()} />
            {job.status === "IN_PROGRESS" && (
              <span className="text-xs text-warning font-medium">Resume</span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">
            {addr ? `${addr.street_address}, ${addr.city}` : "Property"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{skuNames}</p>
          {job.scheduled_date && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(job.scheduled_date), "EEE, MMM d")}</span>
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Card>
  );
}

function JobList({ filter }: { filter: "today" | "upcoming" }) {
  const { data: jobs, isLoading } = useProviderJobs(filter);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground font-medium">
          {filter === "today" ? "No jobs scheduled for today" : "No upcoming jobs"}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Jobs will appear here when assigned
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job, i) => (
        <JobCard key={job.id} job={job} index={i} />
      ))}
    </div>
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
          <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          <JobList filter="today" />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <JobList filter="upcoming" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
