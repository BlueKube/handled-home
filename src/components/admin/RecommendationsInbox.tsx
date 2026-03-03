import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, CheckCircle2, XCircle, AlarmClock, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useZoneStateRecommendations, type ZoneStateRecommendation } from "@/hooks/useZoneStateRecommendations";
import { useZones } from "@/hooks/useZones";

const STATE_COLORS: Record<string, string> = {
  CLOSED: "bg-muted text-muted-foreground",
  WAITLIST_ONLY: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  PROVIDER_RECRUITING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SOFT_LAUNCH: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PROTECT_QUALITY: "bg-destructive/10 text-destructive",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
};

const CATEGORIES = ["lawn_care", "cleaning", "landscaping", "pest_control", "pool_care"];

export function RecommendationsInbox() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { recommendations, approve, reject, snooze } = useZoneStateRecommendations({
    status: statusFilter === "all" ? undefined : statusFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  });

  const { data: zones } = useZones();
  const zoneMap = new Map(zones?.map((z: any) => [z.id, z.name]) ?? []);

  const filtered = (recommendations.data ?? []).filter((r) =>
    confidenceFilter === "all" || r.confidence === confidenceFilter
  );

  // Sort: PROTECT_QUALITY first, then high confidence, then by date
  const sorted = [...filtered].sort((a, b) => {
    const urgencyScore = (r: ZoneStateRecommendation) =>
      (r.recommended_state === "PROTECT_QUALITY" ? 100 : r.recommended_state === "WAITLIST_ONLY" ? 50 : 0) +
      (r.confidence === "high" ? 30 : r.confidence === "medium" ? 15 : 0);
    return urgencyScore(b) - urgencyScore(a) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleApprove = (rec: ZoneStateRecommendation) => {
    setActioningId(rec.id);
    approve.mutate({ recommendationId: rec.id }, {
      onSuccess: () => { toast.success("Approved"); setActioningId(null); },
      onError: (e: any) => { toast.error(e.message); setActioningId(null); },
    });
  };

  const handleReject = (rec: ZoneStateRecommendation) => {
    const note = rejectNotes[rec.id]?.trim();
    if (!note) { toast.error("Add a rejection reason"); return; }
    setActioningId(rec.id);
    reject.mutate({ recommendationId: rec.id, note }, {
      onSuccess: () => { toast.success("Rejected"); setActioningId(null); setRejectNotes((p) => ({ ...p, [rec.id]: "" })); },
      onError: (e: any) => { toast.error(e.message); setActioningId(null); },
    });
  };

  const handleSnooze = (rec: ZoneStateRecommendation, days: number) => {
    setActioningId(rec.id);
    snooze.mutate({ recommendationId: rec.id, snoozeDays: days }, {
      onSuccess: () => { toast.success(`Snoozed ${days}d`); setActioningId(null); },
      onError: (e: any) => { toast.error(e.message); setActioningId(null); },
    });
  };

  const handleBulkSnooze = () => {
    const pending = sorted.filter((r) => r.status === "pending");
    if (!pending.length) return;
    Promise.all(pending.map((r) => snooze.mutateAsync({ recommendationId: r.id, snoozeDays: 7 })))
      .then(() => toast.success(`Snoozed ${pending.length} recommendations`))
      .catch((e: any) => toast.error(e.message));
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="snoozed">Snoozed</SelectItem>
            <SelectItem value="superseded">Superseded</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any confidence</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        {statusFilter === "pending" && sorted.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleBulkSnooze}>
            <AlarmClock className="h-3.5 w-3.5 mr-1" /> Snooze All 7d
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{sorted.length} recommendation{sorted.length !== 1 ? "s" : ""}</p>

      {recommendations.isLoading && (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      )}

      {sorted.length === 0 && !recommendations.isLoading && (
        <div className="text-center py-12">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No recommendations match filters.</p>
        </div>
      )}

      {sorted.map((rec) => (
        <Card key={rec.id}>
          <CardContent className="py-3 px-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{zoneMap.get(rec.zone_id) ?? rec.zone_id.slice(0, 8)}</span>
                <span className="text-xs text-muted-foreground capitalize">• {rec.category.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className={`${CONFIDENCE_COLORS[rec.confidence]} text-[10px]`}>{rec.confidence}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{rec.status}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`${STATE_COLORS[rec.current_state]} text-xs`}>{rec.current_state.replace(/_/g, " ")}</Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge className={`${STATE_COLORS[rec.recommended_state]} text-xs`}>{rec.recommended_state.replace(/_/g, " ")}</Badge>
            </div>

            <ul className="text-xs text-muted-foreground space-y-0.5">
              {rec.reasons.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>

            {rec.metrics_snapshot && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(rec.metrics_snapshot).map(([k, v]) => (
                  <span key={k} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    {k}: {typeof v === "number" ? (v < 1 && v > 0 ? `${Math.round(v * 100)}%` : v) : String(v)}
                  </span>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">{new Date(rec.created_at).toLocaleString()}</p>

            {rec.status === "pending" && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleApprove(rec)} disabled={actioningId === rec.id}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSnooze(rec, 7)} disabled={actioningId === rec.id}>
                    <AlarmClock className="h-3 w-3 mr-1" /> 7d
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSnooze(rec, 14)} disabled={actioningId === rec.id}>
                    14d
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  <Textarea
                    className="text-xs h-12 flex-1"
                    placeholder="Rejection reason…"
                    value={rejectNotes[rec.id] ?? ""}
                    onChange={(e) => setRejectNotes((p) => ({ ...p, [rec.id]: e.target.value }))}
                  />
                  <Button size="sm" variant="destructive" className="h-7 text-xs self-end" onClick={() => handleReject(rec)} disabled={actioningId === rec.id}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            )}

            {rec.review_note && (
              <p className="text-xs text-muted-foreground border-t border-border/50 pt-1 mt-1">
                Review note: {rec.review_note}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
