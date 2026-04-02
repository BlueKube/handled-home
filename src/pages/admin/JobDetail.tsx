import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useAdminJobs } from "@/hooks/useAdminJobs";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, CheckCircle2, Camera, AlertTriangle, Clock, Shield, XCircle, Brain } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { DecisionTraceCard } from "@/components/admin/DecisionTraceCard";
import { AdminPropertyProfileCard } from "@/components/admin/AdminPropertyProfileCard";

export default function AdminJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useJobDetail(jobId);
  const { overrideComplete, resolveIssue } = useAdminJobs();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideNote, setOverrideNote] = useState("");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // A3: Generate signed URLs for photos
  useEffect(() => {
    if (!data?.photos) return;
    const uploaded = data.photos.filter((p) => p.upload_status === "UPLOADED");
    if (uploaded.length === 0) return;

    const fetchSignedUrls = async () => {
      const urls: Record<string, string> = {};
      await Promise.all(
        uploaded.map(async (p) => {
          const { data: urlData } = await supabase.storage
            .from("job-photos")
            .createSignedUrl(p.storage_path, 3600);
          if (urlData?.signedUrl) urls[p.id] = urlData.signedUrl;
        })
      );
      setSignedUrls(urls);
    };
    fetchSignedUrls();
  }, [data?.photos]);

  if (isError) {
    return (
      <div className="animate-fade-in p-6 text-center space-y-3">
        <p className="text-sm text-destructive">Failed to load job details. Please try again.</p>
        <Button variant="link" onClick={() => navigate(-1)}>← Go back</Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="animate-fade-in p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full rounded-xl" /></div>;
  }

  const { job, skus, checklist, photos, issues, events, property } = data;

  const handleOverride = async () => {
    if (!jobId || !overrideReason) return;
    try {
      await overrideComplete.mutateAsync({ jobId, reason: overrideReason, note: overrideNote || undefined });
      toast({ title: "Job completed via override" });
      setOverrideOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleResolve = async () => {
    if (!resolveId || !jobId) return;
    try {
      await resolveIssue.mutateAsync({ issueId: resolveId, jobId, note: resolveNote });
      toast({ title: "Issue resolved" });
      setResolveId(null);
      setResolveNote("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="animate-fade-in p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/jobs")} aria-label="Back to jobs"><ChevronLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h1 className="text-h3">Job Detail</h1>
          <p className="text-caption">{property?.street_address ?? "Property"}</p>
        </div>
        <StatusBadge status={job.status.toLowerCase()} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="checklist" className="flex-1">Checklist</TabsTrigger>
          <TabsTrigger value="photos" className="flex-1">Photos</TabsTrigger>
          <TabsTrigger value="issues" className="flex-1">Issues</TabsTrigger>
          <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
          <TabsTrigger value="decisions" className="flex-1"><Brain className="h-3 w-3 mr-1" />Trace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-3">
          <Card className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={job.status.toLowerCase()} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span>{job.scheduled_date ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span>{job.started_at ? format(new Date(job.started_at), "HH:mm") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{job.completed_at ? format(new Date(job.completed_at), "HH:mm") : "—"}</span></div>
            {job.provider_summary && <div className="pt-2 border-t"><p className="text-xs text-muted-foreground">Provider summary:</p><p>{job.provider_summary}</p></div>}
          </Card>
          <Card className="p-4"><h3 className="text-sm font-semibold mb-2">Services</h3>{skus.map((s) => <p key={s.id} className="text-sm">{s.sku_name_snapshot}{s.duration_minutes_snapshot ? ` (${s.duration_minutes_snapshot} min)` : ""}</p>)}</Card>
          <AdminPropertyProfileCard propertyId={job.property_id} />
          {job.status !== "COMPLETED" && job.status !== "CANCELED" && (
            <Button variant="outline" className="w-full" onClick={() => setOverrideOpen(true)}><Shield className="h-4 w-4 mr-2" />Override Complete</Button>
          )}
        </TabsContent>

        <TabsContent value="checklist" className="mt-4 space-y-2">
          {checklist.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No checklist items</p> : checklist.map((item) => (
            <Card key={item.id} className="p-3 flex items-center gap-2">
              {item.status === "DONE" ? <CheckCircle2 className="h-4 w-4 text-success" /> : item.status === "NOT_DONE_WITH_REASON" ? <XCircle className="h-4 w-4 text-warning" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
              <div className="flex-1"><p className="text-sm">{item.label}</p>{item.reason_code && <p className="text-xs text-muted-foreground">Reason: {item.reason_code}{item.note ? ` — ${item.note}` : ""}</p>}</div>
            </Card>
          ))}
        </TabsContent>

        {/* A3: Photos with signed URL thumbnails */}
        <TabsContent value="photos" className="mt-4 space-y-2">
          {photos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No photos</p> : photos.map((p) => (
            <Card key={p.id} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1"><p className="text-sm capitalize">{p.slot_key?.replace(/_/g, " ") ?? "Extra"}</p><p className="text-xs text-muted-foreground">{p.upload_status}</p></div>
              </div>
              {signedUrls[p.id] && (
                <img
                  src={signedUrls[p.id]}
                  alt={p.slot_key ?? "Photo"}
                  className="w-full h-40 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                    if (import.meta.env.DEV) console.warn('[AdminJobDetail] Failed to load photo:', p.storage_path);
                  }}
                />
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="issues" className="mt-4 space-y-2">
          {issues.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No issues</p> : issues.map((issue) => (
            <Card key={issue.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-sm font-medium">{issue.issue_type.replace(/_/g, " ")}</p><p className="text-xs text-muted-foreground">{issue.severity} · {issue.status}</p>{issue.description && <p className="text-xs mt-1">{issue.description}</p>}{issue.resolution_note && <p className="text-xs text-success mt-1">Resolution: {issue.resolution_note}</p>}</div>
                {issue.status === "OPEN" && <Button size="sm" variant="outline" onClick={() => setResolveId(issue.id)}>Resolve</Button>}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-2">
          {events.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No events</p> : events.map((ev) => (
            <Card key={ev.id} className="p-3">
              <div className="flex items-center justify-between"><p className="text-sm font-medium">{ev.event_type}</p><span className="text-xs text-muted-foreground">{format(new Date(ev.created_at), "MMM d HH:mm")}</span></div>
              <p className="text-xs text-muted-foreground">{ev.actor_role}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="decisions" className="mt-4">
          <DecisionTraceCard entityType="job" entityId={jobId} />
        </TabsContent>
      </Tabs>

      {/* Override dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent><DialogHeader><DialogTitle>Override Complete</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason (required)" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={2} />
          <Textarea placeholder="Note (optional)" value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} rows={2} />
          <DialogFooter><Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button><Button onClick={handleOverride} disabled={!overrideReason}>Override</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve issue dialog */}
      <Dialog open={!!resolveId} onOpenChange={(o) => !o && setResolveId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Resolve Issue</DialogTitle></DialogHeader>
          <Textarea placeholder="Resolution note" value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} rows={2} />
          <DialogFooter><Button variant="outline" onClick={() => setResolveId(null)}>Cancel</Button><Button onClick={handleResolve} disabled={!resolveNote}>Resolve</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
