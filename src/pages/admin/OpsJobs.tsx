import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminJobs } from "@/hooks/useAdminJobs";
import { useZones } from "@/hooks/useZones";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

export default function OpsJobs() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<string>(searchParams.get("status") || "");
  const [zoneId, setZoneId] = useState<string>(searchParams.get("zone_id") || "");
  const [providerOrgId, setProviderOrgId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState<string>(searchParams.get("date_to") || "");
  const [proofFilter, setProofFilter] = useState<string>(searchParams.get("proof") || "");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  const { data: zones } = useZones();

  // Fetch provider orgs for filter
  const { data: providerOrgs } = useQuery({
    queryKey: ["provider-orgs-list"],
    queryFn: async () => {
      const { data } = await supabase.from("provider_orgs").select("id, business_name").eq("status", "active");
      return data ?? [];
    },
  });

  // Fetch SKU categories for filter
  const { data: skuData } = useQuery({
    queryKey: ["sku-categories-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("service_skus").select("id, name, category").eq("status", "active");
      return data ?? [];
    },
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    (skuData ?? []).forEach((s: any) => { if (s.category) cats.add(s.category); });
    return Array.from(cats).sort();
  }, [skuData]);

  const skuIdsByCategory = useMemo(() => {
    if (!categoryFilter || categoryFilter.startsWith("all")) return null;
    const ids = new Set<string>();
    (skuData ?? []).forEach((s: any) => { if (s.category === categoryFilter) ids.add(s.id); });
    return ids;
  }, [categoryFilter, skuData]);

  const { jobs, totalCount, loading } = useAdminJobs({
    status: status && !status.startsWith("all") ? status : undefined,
    zone_id: zoneId && !zoneId.startsWith("all") ? zoneId : undefined,
    provider_org_id: providerOrgId && !providerOrgId.startsWith("all") ? providerOrgId : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  // Fetch proof & issue state for displayed jobs
  const jobIds = jobs.map((j: any) => j.id);
  const { data: proofData } = useQuery({
    queryKey: ["ops-jobs-proof", jobIds],
    enabled: jobIds.length > 0,
    queryFn: async () => {
      const [photosRes, checklistRes, issuesRes] = await Promise.all([
        supabase.from("job_photos").select("job_id").in("job_id", jobIds),
        supabase.from("job_checklist_items").select("job_id, is_required, status").in("job_id", jobIds),
        supabase.from("job_issues").select("job_id, status").in("job_id", jobIds),
      ]);

      const photosByJob = new Set((photosRes.data ?? []).map((p: any) => p.job_id));
      const requiredByJob = new Set<string>();
      (checklistRes.data ?? []).forEach((ci: any) => {
        if (ci.is_required) requiredByJob.add(ci.job_id);
      });

      const proofState: Record<string, "complete" | "missing" | "na"> = {};
      jobIds.forEach((id: string) => {
        if (!requiredByJob.has(id)) {
          proofState[id] = photosByJob.has(id) ? "complete" : "na";
        } else {
          proofState[id] = photosByJob.has(id) ? "complete" : "missing";
        }
      });

      const issueState: Record<string, "open" | "none"> = {};
      const openIssueJobs = new Set(
        (issuesRes.data ?? []).filter((i: any) => i.status === "OPEN").map((i: any) => i.job_id)
      );
      jobIds.forEach((id: string) => {
        issueState[id] = openIssueJobs.has(id) ? "open" : "none";
      });

      return { proofState, issueState };
    },
  });

  // Zone name lookup
  const zoneMap = new Map((zones ?? []).map((z: any) => [z.id, z.name]));
  const providerMap = new Map((providerOrgs ?? []).map((p: any) => [p.id, p.business_name]));

  // Client-side filters: proof + category
  let filteredJobs = jobs;
  if (proofFilter === "missing" && proofData) {
    filteredJobs = filteredJobs.filter((j: any) => proofData.proofState[j.id] === "missing");
  } else if (proofFilter === "complete" && proofData) {
    filteredJobs = filteredJobs.filter((j: any) => proofData.proofState[j.id] === "complete");
  }

  if (skuIdsByCategory) {
    filteredJobs = filteredJobs.filter((j: any) =>
      (j.job_skus ?? []).some((js: any) => skuIdsByCategory.has(js.sku_id))
    );
  }

  // Server-side pagination (totalCount from useAdminJobs), client-side category filter adjusts display
  const serverTotalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => setPage(0), [status, zoneId, providerOrgId, dateFrom, dateTo, proofFilter, categoryFilter]);

  return (
    <div className="animate-fade-in p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")} aria-label="Back to Ops Cockpit">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Jobs & Proof Health</h1>
          <p className="text-caption">Search, filter, drill into jobs</p>
        </div>
      </div>

      {/* Filters Row 1 */}
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
            {zones?.map((z: any) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={providerOrgId} onValueChange={setProviderOrgId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_providers">All Providers</SelectItem>
            {providerOrgs?.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.business_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={proofFilter} onValueChange={setProofFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Proof State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_proof">All Proof</SelectItem>
            <SelectItem value="missing">Missing Proof</SelectItem>
            <SelectItem value="complete">Proof Complete</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_categories">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters Row 2: Date Range */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[150px]"
          placeholder="From"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[150px]"
          placeholder="To"
        />
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
            Clear dates
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : filteredJobs.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No jobs match filters.</p>
      ) : (
        <>
          <div className="space-y-2">
            {filteredJobs.map((job: any) => {
              const proof = proofData?.proofState[job.id];
              const issue = proofData?.issueState[job.id];
              return (
                <Card
                  key={job.id}
                  className="p-4 cursor-pointer press-feedback"
                  onClick={() => nav(`/admin/jobs/${job.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{job.property?.street_address ?? "Unknown"}</p>
                      <p className="text-caption">
                        {job.scheduled_date} • {job.property?.city}
                        {job.zone_id && zoneMap.has(job.zone_id) && (
                          <> • <span className="text-foreground/70">{zoneMap.get(job.zone_id)}</span></>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {issue === "open" && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" /> Issue
                        </Badge>
                      )}
                      {proof === "missing" && (
                        <Badge variant="outline" className="text-xs gap-1 border-warning text-warning">
                          <Camera className="h-3 w-3" /> No Proof
                        </Badge>
                      )}
                      {proof === "complete" && (
                        <Badge variant="outline" className="text-xs gap-1 border-success/50 text-success">
                          <Camera className="h-3 w-3" /> ✓
                        </Badge>
                      )}
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    {job.provider_org_id && providerMap.has(job.provider_org_id) && (
                      <span className="bg-muted px-2 py-0.5 rounded">{providerMap.get(job.provider_org_id)}</span>
                    )}
                    {job.job_skus?.map((s: any) => (
                      <span key={s.id} className="bg-muted px-2 py-0.5 rounded">{s.sku_name_snapshot}</span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {serverTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {serverTotalPages} ({totalCount} jobs)
              </span>
              <Button variant="ghost" size="sm" disabled={page >= serverTotalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
