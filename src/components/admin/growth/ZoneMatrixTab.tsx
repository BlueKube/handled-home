import { useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useZones } from "@/hooks/useZones";
import { useMarketZoneState, type ZoneCategoryState } from "@/hooks/useMarketZoneState";
import { useMarketHealth } from "@/hooks/useMarketHealth";
import { useZoneStateRecommendations } from "@/hooks/useZoneStateRecommendations";
import { ZoneCategoryDetailPanel } from "@/components/admin/ZoneCategoryDetailPanel";
import { STATES, STATE_COLORS, type ZoneTabProps } from "./shared";
import { ZoneFilter } from "./ZoneFilter";

const CATEGORIES = ["lawn_care", "cleaning", "landscaping", "pest_control", "pool_care"];

export function ZoneMatrixTab({ selectedZone, setSelectedZone }: ZoneTabProps) {
  const zonesQuery = useZones();
  const zones = zonesQuery.data;
  const { states, overrideState } = useMarketZoneState(selectedZone === "__all__" ? undefined : selectedZone);
  const { computeHealth } = useMarketHealth();
  const { recommendations: pendingRecs } = useZoneStateRecommendations({ status: "pending" });
  const [overrideDialog, setOverrideDialog] = useState<{ zoneId: string; category: string; currentState: string } | null>(null);
  const [overrideForm, setOverrideForm] = useState({ newState: "CLOSED", reason: "", lockDays: "" });
  const [detailCell, setDetailCell] = useState<{ zoneId: string; category: string; zoneName: string } | null>(null);

  const stateMap = new Map<string, ZoneCategoryState>();
  states.data?.forEach((s) => stateMap.set(`${s.zone_id}:${s.category}`, s));

  const recMap = new Map<string, { recommended_state: string; confidence: string }>();
  pendingRecs.data?.forEach((r) => {
    const key = `${r.zone_id}:${r.category}`;
    if (!recMap.has(key)) recMap.set(key, { recommended_state: r.recommended_state, confidence: r.confidence });
  });

  const handleOverride = () => {
    if (!overrideDialog) return;
    overrideState.mutate(
      {
        zoneId: overrideDialog.zoneId,
        category: overrideDialog.category,
        newState: overrideForm.newState as any,
        reason: overrideForm.reason,
        lockDays: overrideForm.lockDays ? parseInt(overrideForm.lockDays) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("State overridden");
          setOverrideDialog(null);
          setOverrideForm({ newState: "CLOSED", reason: "", lockDays: "" });
        },
        onError: (e: any) => toast.error(e.message),
      }
    );
  };

  const handleRefreshHealth = (zoneId: string, category: string) => {
    computeHealth.mutate({ zoneId, category }, {
      onSuccess: (data) => toast.success(`Health: ${(data as any)?.health_label} (${Math.round((data as any)?.health_score ?? 0)})`),
      onError: (e: any) => toast.error(e.message),
    });
  };

  if (states.isLoading) return <Skeleton className="h-48 mt-4" />;
  if (states.isError) return <p className="text-sm text-destructive mt-4">Failed to load zone states. Please try refreshing.</p>;

  const displayZones = zones?.filter((z: any) => selectedZone === "__all__" || z.id === selectedZone) ?? [];

  return (
    <div className="space-y-4 mt-4">
      <ZoneFilter selectedZone={selectedZone} setSelectedZone={setSelectedZone} />

      {displayZones.map((zone: any) => (
        <Card key={zone.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{zone.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CATEGORIES.map((cat) => {
              const state = stateMap.get(`${zone.id}:${cat}`);
              const currentStatus = state?.status ?? "CLOSED";
              const isLocked = state?.locked_until && new Date(state.locked_until) > new Date();
              const rec = recMap.get(`${zone.id}:${cat}`);

              return (
                <div
                  key={cat}
                  className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1 transition-colors"
                  onClick={() => setDetailCell({ zoneId: zone.id, category: cat, zoneName: zone.name })}
                >
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-sm capitalize font-medium">{cat.replace(/_/g, " ")}</span>
                    <Badge className={`text-xs ${STATE_COLORS[currentStatus]}`}>{currentStatus.replace(/_/g, " ")}</Badge>
                    {rec && (
                      <Badge variant="outline" className="text-[10px] border-dashed">
                        → {rec.recommended_state.replace(/_/g, " ")}
                      </Badge>
                    )}
                    {isLocked && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleRefreshHealth(zone.id, cat); }}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOverrideDialog({ zoneId: zone.id, category: cat, currentState: currentStatus });
                        setOverrideForm({ newState: currentStatus, reason: "", lockDays: "" });
                      }}
                    >
                      Override
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {displayZones.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No zones found.</p>
      )}

      <ZoneCategoryDetailPanel
        zoneId={detailCell?.zoneId ?? null}
        category={detailCell?.category ?? null}
        zoneName={detailCell?.zoneName}
        onClose={() => setDetailCell(null)}
      />

      <Dialog open={!!overrideDialog} onOpenChange={(o) => !o && setOverrideDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override State — {overrideDialog?.category?.replace(/_/g, " ")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current</label>
              <Badge className={`ml-2 text-xs ${STATE_COLORS[overrideDialog?.currentState ?? "CLOSED"]}`}>
                {overrideDialog?.currentState?.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium">New State</label>
              <Select value={overrideForm.newState} onValueChange={(v) => setOverrideForm({ ...overrideForm, newState: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea value={overrideForm.reason} onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })} placeholder="Why are you overriding?" />
            </div>
            <div>
              <label className="text-sm font-medium">Lock for N days (optional)</label>
              <Input type="number" value={overrideForm.lockDays} onChange={(e) => setOverrideForm({ ...overrideForm, lockDays: e.target.value })} placeholder="e.g. 7" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialog(null)}>Cancel</Button>
            <Button onClick={handleOverride} disabled={!overrideForm.reason || overrideState.isPending}>Confirm Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
