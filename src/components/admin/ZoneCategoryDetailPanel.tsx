import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, ArrowRight, Clock, CheckCircle2, XCircle, AlarmClock, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMarketZoneState, type MarketZoneCategoryStatus, type ZoneCategoryState } from "@/hooks/useMarketZoneState";
import { useZoneStateRecommendations, type ZoneStateRecommendation } from "@/hooks/useZoneStateRecommendations";
import { useZoneStateChangeLog, type ZoneStateChangeLogEntry } from "@/hooks/useZoneStateChangeLog";

const ALL_STATES: MarketZoneCategoryStatus[] = ["CLOSED", "WAITLIST_ONLY", "PROVIDER_RECRUITING", "SOFT_LAUNCH", "OPEN", "PROTECT_QUALITY"];

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

interface ZoneCategoryDetailPanelProps {
  zoneId: string | null;
  category: string | null;
  zoneName?: string;
  onClose: () => void;
}

export function ZoneCategoryDetailPanel({ zoneId, category, zoneName, onClose }: ZoneCategoryDetailPanelProps) {
  const { states, overrideState } = useMarketZoneState(zoneId ?? undefined);
  const { recommendations, approve, reject, snooze } = useZoneStateRecommendations({
    zoneId: zoneId ?? undefined,
    category: category ?? undefined,
    status: "pending",
  });
  const changeLog = useZoneStateChangeLog(zoneId ?? undefined, category ?? undefined, 20);

  const [mode, setMode] = useState<"view" | "override">("view");
  const [overrideForm, setOverrideForm] = useState({ newState: "CLOSED" as string, reason: "", lockDays: "" });
  const [rejectNote, setRejectNote] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const isOpen = !!(zoneId && category);
  const state = states.data?.find((s) => s.zone_id === zoneId && s.category === category);
  const pendingRecs = recommendations.data ?? [];
  const currentStatus = state?.status ?? "CLOSED";
  const isLocked = state?.locked_until && new Date(state.locked_until) > new Date();

  const handleOverride = () => {
    if (!zoneId || !category) return;
    overrideState.mutate(
      {
        zoneId,
        category,
        newState: overrideForm.newState as MarketZoneCategoryStatus,
        reason: overrideForm.reason,
        lockDays: overrideForm.lockDays ? parseInt(overrideForm.lockDays) : undefined,
      },
      {
        onSuccess: () => { toast.success("State overridden"); setMode("view"); },
        onError: (e: any) => toast.error(e.message),
      }
    );
  };

  const handleApprove = (rec: ZoneStateRecommendation) => {
    setActioningId(rec.id);
    approve.mutate(
      { recommendationId: rec.id },
      {
        onSuccess: () => { toast.success("Recommendation approved — state updated"); setActioningId(null); },
        onError: (e: any) => { toast.error(e.message); setActioningId(null); },
      }
    );
  };

  const handleReject = (rec: ZoneStateRecommendation) => {
    if (!rejectNote.trim()) { toast.error("Please add a reason for rejecting"); return; }
    setActioningId(rec.id);
    reject.mutate(
      { recommendationId: rec.id, note: rejectNote },
      {
        onSuccess: () => { toast.success("Recommendation rejected"); setRejectNote(""); setActioningId(null); },
        onError: (e: any) => { toast.error(e.message); setActioningId(null); },
      }
    );
  };

  const handleSnooze = (rec: ZoneStateRecommendation, days: number) => {
    setActioningId(rec.id);
    snooze.mutate(
      { recommendationId: rec.id, snoozeDays: days },
      {
        onSuccess: () => { toast.success(`Snoozed for ${days} days`); setActioningId(null); },
        onError: (e: any) => { toast.error(e.message); setActioningId(null); },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => { if (!o) { onClose(); setMode("view"); } }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <SheetTitle className="text-left">
                <span className="capitalize">{category?.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground font-normal text-sm ml-2">in {zoneName}</span>
              </SheetTitle>
            </SheetHeader>

            {/* Current State */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current State</p>
              <div className="flex items-center gap-2">
                <Badge className={`${STATE_COLORS[currentStatus]} text-sm`}>{currentStatus.replace(/_/g, " ")}</Badge>
                {isLocked && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" /> until {new Date(state!.locked_until!).toLocaleDateString()}
                  </span>
                )}
              </div>
              {state?.last_state_change_at && (
                <p className="text-xs text-muted-foreground">
                  Changed {new Date(state.last_state_change_at).toLocaleString()}
                  {state.previous_status && <> from <Badge variant="outline" className="text-[10px] ml-1">{state.previous_status}</Badge></>}
                </p>
              )}
              {state?.lock_reason && (
                <p className="text-xs text-muted-foreground italic">Lock reason: {state.lock_reason}</p>
              )}
            </div>

            <Separator />

            {/* Pending Recommendations */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pending Recommendations ({pendingRecs.length})
              </p>
              {recommendations.isLoading && <Skeleton className="h-20" />}
              {pendingRecs.length === 0 && !recommendations.isLoading && (
                <p className="text-sm text-muted-foreground">No pending recommendations.</p>
              )}
              {pendingRecs.map((rec) => (
                <div key={rec.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${STATE_COLORS[rec.current_state]} text-xs`}>{rec.current_state.replace(/_/g, " ")}</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge className={`${STATE_COLORS[rec.recommended_state]} text-xs`}>{rec.recommended_state.replace(/_/g, " ")}</Badge>
                    <Badge className={`${CONFIDENCE_COLORS[rec.confidence]} text-[10px] ml-auto`}>{rec.confidence}</Badge>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {rec.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                  {rec.metrics_snapshot && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(rec.metrics_snapshot).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {k}: {typeof v === "number" ? (v < 1 && v > 0 ? `${Math.round(v * 100)}%` : v) : String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5 pt-1">
                    <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleApprove(rec)} disabled={actioningId === rec.id}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSnooze(rec, 7)} disabled={actioningId === rec.id}>
                      <AlarmClock className="h-3 w-3 mr-1" /> 7d
                    </Button>
                  </div>
                  <div className="flex gap-1.5">
                    <Textarea
                      className="text-xs h-16"
                      placeholder="Rejection reason…"
                      value={actioningId === rec.id ? rejectNote : rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                    />
                    <Button size="sm" variant="destructive" className="h-7 text-xs self-end" onClick={() => handleReject(rec)} disabled={actioningId === rec.id}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Override */}
            {mode === "view" ? (
              <Button variant="outline" className="w-full" onClick={() => { setMode("override"); setOverrideForm({ newState: currentStatus, reason: "", lockDays: "" }); }}>
                <Shield className="h-4 w-4 mr-2" /> Manual Override
              </Button>
            ) : (
              <div className="border border-border rounded-lg p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Manual Override</p>
                <Select value={overrideForm.newState} onValueChange={(v) => setOverrideForm({ ...overrideForm, newState: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_STATES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Reason for override (required)"
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Lock days (optional)"
                  value={overrideForm.lockDays}
                  onChange={(e) => setOverrideForm({ ...overrideForm, lockDays: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setMode("view")}>Cancel</Button>
                  <Button className="flex-1" onClick={handleOverride} disabled={!overrideForm.reason || overrideState.isPending}>
                    Confirm
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Audit Log */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Change History</p>
              {changeLog.isLoading && <Skeleton className="h-20" />}
              {changeLog.data?.length === 0 && !changeLog.isLoading && (
                <p className="text-sm text-muted-foreground">No changes recorded.</p>
              )}
              {changeLog.data?.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <Clock className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      {entry.previous_state && (
                        <>
                          <Badge variant="outline" className="text-[10px]">{entry.previous_state}</Badge>
                          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                        </>
                      )}
                      <Badge variant="outline" className="text-[10px]">{entry.new_state}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{entry.change_source.replace(/_/g, " ")}</Badge>
                    </div>
                    {entry.reason && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{entry.reason}</p>}
                    <p className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
