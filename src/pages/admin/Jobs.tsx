import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useAdminJobs } from "@/hooks/useAdminJobs";
import { useZones } from "@/hooks/useZones";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Briefcase } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["", "NOT_STARTED", "IN_PROGRESS", "ISSUE_REPORTED", "PARTIAL_COMPLETE", "COMPLETED", "CANCELED"];

export default function AdminJobs() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [zoneId, setZoneId] = useState("");

  // A1: Fetch zones for filter dropdown
  const zonesQuery = useZones();
  const zones = zonesQuery.data ?? [];

  const { jobs, loading } = useAdminJobs({
    status: status || undefined,
    zone_id: zoneId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      <h1 className="text-h2">Jobs</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {STATUSES.filter(Boolean).map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* A1: Zone filter */}
        <Select value={zoneId} onValueChange={setZoneId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All zones" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All zones</SelectItem>
            {(zones ?? []).map((z: any) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" placeholder="From" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" placeholder="To" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => (
            <Card key={job.id} className="p-3 press-feedback cursor-pointer" onClick={() => navigate(`/admin/jobs/${job.id}`)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusBadge status={job.status.toLowerCase()} />
                    {job.scheduled_date && (
                      <span className="text-xs text-muted-foreground">{format(new Date(job.scheduled_date), "MMM d")}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">
                    {job.property?.street_address ?? "Property"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {job.job_skus?.map((s: any) => s.sku_name_snapshot).filter(Boolean).join(", ")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
