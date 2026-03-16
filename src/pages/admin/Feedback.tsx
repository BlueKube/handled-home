import { useAdminFeedback } from "@/hooks/useAdminFeedback";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, Star, MessageSquare, Gift, ShieldAlert, ClipboardEdit } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ActionType = "credit" | "coaching" | "warning";
interface ActionTarget {
  type: ActionType;
  provider_org_id: string;
  customer_id: string;
  job_id: string;
}

export default function AdminFeedback() {
  const { quickFeedback, privateRatings, issueCount, isLoading } = useAdminFeedback();
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async () => {
    if (!actionTarget) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (actionTarget.type === "credit") {
        await supabase.from("customer_credits").insert({
          customer_id: actionTarget.customer_id,
          amount_cents: 500,
          reason: actionNote || "Goodwill credit from feedback review",
          issued_by_admin_user_id: user.id,
          status: "active",
        });
        toast.success("$5 credit issued to customer");
      } else {
        // coaching or warning → admin audit log
        await supabase.from("admin_audit_log").insert({
          admin_user_id: user.id,
          action: actionTarget.type === "warning" ? "provider_warning" : "provider_coaching_note",
          entity_type: "provider_org",
          entity_id: actionTarget.provider_org_id,
          reason: actionNote || `${actionTarget.type} from feedback review`,
          after: { job_id: actionTarget.job_id, feedback_type: actionTarget.type } as any,
        });
        toast.success(actionTarget.type === "warning" ? "Warning logged" : "Coaching note saved");
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setSubmitting(false);
      setActionTarget(null);
      setActionNote("");
    }
  };

  const actionLabel: Record<ActionType, string> = {
    credit: "Issue Credit",
    coaching: "Add Coaching Note",
    warning: "Log Provider Warning",
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in p-6 max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 max-w-4xl space-y-4">
      <div>
        <h1 className="text-h2">Customer Feedback</h1>
        <p className="text-sm text-muted-foreground">
          Full transparency — all feedback visible immediately with context.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{quickFeedback.length}</p>
          <p className="text-xs text-muted-foreground">Quick Feedback</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{issueCount}</p>
          <p className="text-xs text-muted-foreground">Issues Flagged</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{privateRatings.length}</p>
          <p className="text-xs text-muted-foreground">Private Reviews</p>
        </Card>
      </div>

      <Tabs defaultValue="quick">
        <TabsList>
          <TabsTrigger value="quick">
            Quick Feedback {issueCount > 0 && <Badge variant="destructive" className="ml-1 h-5 text-[10px]">{issueCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ratings">Private Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-2 mt-3">
          {quickFeedback.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No feedback yet.</p>
          ) : (
            quickFeedback.map((f) => (
              <Card key={f.id} className="p-3 flex items-start gap-3">
                {f.outcome === "GOOD" ? (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={f.outcome === "GOOD" ? "secondary" : "destructive"} className="text-[10px]">
                      {f.outcome}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(f.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                    Job: {f.job_id.slice(0, 8)}… | Customer: {f.customer_id.slice(0, 8)}… | Provider: {f.provider_org_id.slice(0, 8)}…
                  </p>
                  {Array.isArray(f.tags) && (f.tags as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(f.tags as string[]).map((t) => (
                        <span key={t} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                  {/* D8-F2: One-click actions */}
                  <div className="flex gap-1.5 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setActionTarget({ type: "credit", customer_id: f.customer_id, provider_org_id: f.provider_org_id, job_id: f.job_id })}
                    >
                      <Gift className="h-3 w-3" /> Credit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setActionTarget({ type: "coaching", customer_id: f.customer_id, provider_org_id: f.provider_org_id, job_id: f.job_id })}
                    >
                      <ClipboardEdit className="h-3 w-3" /> Coach
                    </Button>
                    {f.outcome === "ISSUE" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs gap-1"
                        onClick={() => setActionTarget({ type: "warning", customer_id: f.customer_id, provider_org_id: f.provider_org_id, job_id: f.job_id })}
                      >
                        <ShieldAlert className="h-3 w-3" /> Warn
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="ratings" className="space-y-2 mt-3">
          {privateRatings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No private ratings yet.</p>
          ) : (
            privateRatings.map((r) => (
              <Card key={r.id} className="p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {r.submitted_at ? format(new Date(r.submitted_at), "MMM d, h:mm a") : "Pending"}
                  </span>
                  {r.rating <= 2 && (
                    <Badge variant="destructive" className="text-[10px]">Low Score</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  Job: {r.job_id.slice(0, 8)}… | Customer: {r.customer_id.slice(0, 8)}… | Provider: {r.provider_org_id.slice(0, 8)}…
                </p>
                {r.comment_public_candidate && (
                  <div className="flex items-start gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm">{r.comment_public_candidate}</p>
                  </div>
                )}
                {r.comment_private && (
                  <div className="bg-destructive/5 border border-destructive/10 rounded p-2">
                    <p className="text-[10px] font-semibold text-destructive uppercase mb-0.5">Confidential</p>
                    <p className="text-sm">{r.comment_private}</p>
                  </div>
                )}
                {Array.isArray(r.tags) && (r.tags as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(r.tags as string[]).map((t) => (
                      <span key={t} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
                {/* D8-F2: Actions on ratings */}
                <div className="flex gap-1.5 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => setActionTarget({ type: "credit", customer_id: r.customer_id, provider_org_id: r.provider_org_id, job_id: r.job_id })}
                  >
                    <Gift className="h-3 w-3" /> Credit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => setActionTarget({ type: "coaching", customer_id: r.customer_id, provider_org_id: r.provider_org_id, job_id: r.job_id })}
                  >
                    <ClipboardEdit className="h-3 w-3" /> Coach
                  </Button>
                  {r.rating <= 2 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs gap-1"
                      onClick={() => setActionTarget({ type: "warning", customer_id: r.customer_id, provider_org_id: r.provider_org_id, job_id: r.job_id })}
                    >
                      <ShieldAlert className="h-3 w-3" /> Warn
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Action dialog */}
      <Dialog open={!!actionTarget} onOpenChange={(open) => { if (!open) { setActionTarget(null); setActionNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionTarget ? actionLabel[actionTarget.type] : ""}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={actionTarget?.type === "credit" ? "Reason for credit (optional)" : "Note for the record…"}
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionTarget(null); setActionNote(""); }}>Cancel</Button>
            <Button onClick={handleAction} disabled={submitting}>
              {submitting ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
