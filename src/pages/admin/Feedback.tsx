import { useAdminFeedback } from "@/hooks/useAdminFeedback";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function AdminFeedback() {
  const { quickFeedback, privateRatings, issueCount, isLoading } = useAdminFeedback();

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
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
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
