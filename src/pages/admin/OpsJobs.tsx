import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminJobs } from "@/hooks/useAdminJobs";
import { useZones } from "@/hooks/useZones";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

export default function OpsJobs() {
  const nav = useNavigate();
  const [status, setStatus] = useState<string>("");
  const [zoneId, setZoneId] = useState<string>("");
  const { data: zones } = useZones();

  const { jobs, loading } = useAdminJobs({
    status: status || undefined,
    zone_id: zoneId || undefined,
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-h2">Jobs & Proof Health</h1>
          <p className="text-caption">Search, filter, drill into jobs</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">All Status</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ISSUE">Issue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={zoneId} onValueChange={setZoneId}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_zones">All Zones</SelectItem>
            {zones?.map((z) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No jobs match filters.</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => (
            <Card
              key={job.id}
              className="p-4 cursor-pointer press-feedback"
              onClick={() => nav(`/admin/jobs/${job.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">{job.property?.street_address ?? "Unknown"}</p>
                  <p className="text-caption">{job.scheduled_date} • {job.property?.city}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                {job.job_skus?.map((s: any) => (
                  <span key={s.id} className="bg-muted px-2 py-0.5 rounded">{s.sku_name_snapshot}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
