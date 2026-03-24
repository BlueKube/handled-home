import { useState, useEffect, useMemo } from "react";
import { Activity, Shield, TrendingUp, AlertTriangle, Lock, RefreshCw, ChevronRight, Sliders, BarChart3, Inbox, Settings2, Rocket, UserPlus, Users, GitBranch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useZones } from "@/hooks/useZones";
import { useMarketZoneState, type ZoneCategoryState } from "@/hooks/useMarketZoneState";
import { useMarketHealth, type HealthSnapshot } from "@/hooks/useMarketHealth";
import { useAutopilotActions } from "@/hooks/useAutopilotActions";
import { useGrowthSurfaceConfig } from "@/hooks/useGrowthSurfaceConfig";
import { useGrowthEventStats, useByocFunnelStats, useReferralFunnelStats, useByopFunnelStats } from "@/hooks/useGrowthEvents";
import { useZoneStateRecommendations } from "@/hooks/useZoneStateRecommendations";
import { ZoneCategoryDetailPanel } from "@/components/admin/ZoneCategoryDetailPanel";
import { RecommendationsInbox } from "@/components/admin/RecommendationsInbox";
import { ThresholdDials } from "@/components/admin/ThresholdDials";
import { HelpTip } from "@/components/ui/help-tip";

const STATES = ["CLOSED", "WAITLIST_ONLY", "PROVIDER_RECRUITING", "SOFT_LAUNCH", "OPEN", "PROTECT_QUALITY"] as const;
const CATEGORIES = ["lawn_care", "cleaning", "landscaping", "pest_control", "pool_care"];

const STATE_COLORS: Record<string, string> = {
  CLOSED: "bg-muted text-muted-foreground",
  WAITLIST_ONLY: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  PROVIDER_RECRUITING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SOFT_LAUNCH: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PROTECT_QUALITY: "bg-destructive/10 text-destructive",
};

const HEALTH_COLORS: Record<string, string> = {
  stable: "text-green-600 dark:text-green-400",
  tight: "text-amber-600 dark:text-amber-400",
  risk: "text-destructive",
};

export default function AdminGrowth() {
  const [selectedZone, setSelectedZone] = useState<string>("__all__");

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Growth Console</h1>
          <p className="text-sm text-muted-foreground">Market health, state machine, and autopilot controls</p>
        </div>
      </div>

      <Tabs defaultValue="matrix">
        <TabsList className="w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="matrix" className="flex-1">Matrix</TabsTrigger>
          <TabsTrigger value="recommendations" className="flex-1">
            <Inbox className="h-3.5 w-3.5 mr-1" /> Recs
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex-1">
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Dials
          </TabsTrigger>
          <TabsTrigger value="health" className="flex-1">Health</TabsTrigger>
          <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
          <TabsTrigger value="surfaces" className="flex-1">Surfaces</TabsTrigger>
          <TabsTrigger value="funnels" className="flex-1">
            <GitBranch className="h-3.5 w-3.5 mr-1" /> Funnels
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
        </TabsList>
        <TabsContent value="funnels"><FunnelsTab /></TabsContent>
        <TabsContent value="matrix"><ZoneMatrixTab selectedZone={selectedZone} setSelectedZone={setSelectedZone} /></TabsContent>
        <TabsContent value="recommendations"><RecommendationsInbox /></TabsContent>
        <TabsContent value="thresholds"><ThresholdDials /></TabsContent>
        <TabsContent value="health"><HealthTab selectedZone={selectedZone} setSelectedZone={setSelectedZone} /></TabsContent>
        <TabsContent value="actions"><ActionsTab selectedZone={selectedZone} setSelectedZone={setSelectedZone} /></TabsContent>
        <TabsContent value="surfaces"><SurfacesTab selectedZone={selectedZone} setSelectedZone={setSelectedZone} /></TabsContent>
        <TabsContent value="events"><EventsTab selectedZone={selectedZone} setSelectedZone={setSelectedZone} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ZoneFilter({ selectedZone, setSelectedZone }: { selectedZone: string; setSelectedZone: (v: string) => void }) {
  const zonesQuery = useZones();
  const zones = zonesQuery.data;
  return (
    <Select value={selectedZone} onValueChange={setSelectedZone}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="All zones" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All zones</SelectItem>
        {zones?.map((z: any) => (
          <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ZoneMatrixTab({ selectedZone, setSelectedZone }: { selectedZone: string; setSelectedZone: (v: string) => void }) {
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

  // Build recommendation lookup: zone_id:category → recommendation
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

function HealthTab({ selectedZone, setSelectedZone }: { selectedZone: string; setSelectedZone: (v: string) => void }) {
  const { snapshots } = useMarketHealth(selectedZone === "__all__" ? undefined : selectedZone);

  if (snapshots.isLoading) return <Skeleton className="h-48 mt-4" />;

  // Group by zone+category, take latest
  const latestMap = new Map<string, HealthSnapshot>();
  snapshots.data?.forEach((s) => {
    const key = `${s.zone_id}:${s.category}`;
    if (!latestMap.has(key)) latestMap.set(key, s);
  });
  const latestSnapshots = Array.from(latestMap.values());

  return (
    <div className="space-y-4 mt-4">
      <ZoneFilter selectedZone={selectedZone} setSelectedZone={setSelectedZone} />

      {latestSnapshots.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No health data yet. Use the Zone Matrix to compute health scores.</p>
      )}

      {latestSnapshots.map((s) => (
        <Card key={s.id}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-sm capitalize">{s.category.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.snapshot_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${HEALTH_COLORS[s.health_label] ?? ""}`}>
                  {Math.round(s.health_score)}
                </span>
                <Badge variant="outline" className={`text-xs ${HEALTH_COLORS[s.health_label] ?? ""}`}>
                  {s.health_label}
                </Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <ScoreBar label="Supply" score={s.supply_score} detail={`${s.inputs?.provider_count ?? 0} providers`} />
              <ScoreBar label="Demand" score={s.demand_score} detail={`${s.inputs?.active_subs ?? 0} subs`} />
              <ScoreBar label="Quality" score={s.quality_score} detail={`${s.inputs?.recent_issues ?? 0}/${s.inputs?.recent_jobs ?? 0} issues`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ScoreBar({ label, score, detail }: { label: string; score: number; detail: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-14 text-muted-foreground">{label}</span>
      <Progress value={score} className="h-2 flex-1" />
      <span className="text-xs w-20 text-right text-muted-foreground">{Math.round(score)} — {detail}</span>
    </div>
  );
}

function ActionsTab({ selectedZone, setSelectedZone }: { selectedZone: string; setSelectedZone: (v: string) => void }) {
  const actions = useAutopilotActions(selectedZone === "__all__" ? undefined : selectedZone);

  if (actions.isLoading) return <Skeleton className="h-48 mt-4" />;

  return (
    <div className="space-y-4 mt-4">
      <ZoneFilter selectedZone={selectedZone} setSelectedZone={setSelectedZone} />

      {actions.data?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No autopilot actions recorded yet.</p>
      )}

      {actions.data?.map((a) => (
        <Card key={a.id}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {a.trigger_source === "admin" ? (
                    <Shield className="h-4 w-4 text-primary" />
                  ) : (
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{a.action_type.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className="text-xs capitalize">{a.trigger_source}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{a.category.replace(/_/g, " ")}</p>
                {a.reason && <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>}
              </div>
              <div className="text-right">
                {a.previous_state && a.new_state && (
                  <div className="flex items-center gap-1 text-xs">
                    <Badge className={`${STATE_COLORS[a.previous_state] ?? "bg-muted"} text-xs`}>{a.previous_state.replace("_", " ")}</Badge>
                    <ChevronRight className="h-3 w-3" />
                    <Badge className={`${STATE_COLORS[a.new_state] ?? "bg-muted"} text-xs`}>{a.new_state.replace("_", " ")}</Badge>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SurfacesTab({ selectedZone, setSelectedZone }: { selectedZone: string; setSelectedZone: (v: string) => void }) {
  const zonesQuery = useZones();
  const zones = zonesQuery.data ?? [];
  const { configs, upsertConfig } = useGrowthSurfaceConfig(selectedZone === "__all__" ? undefined : selectedZone);

  const displayZones = zones.filter((z: any) => selectedZone === "__all__" || z.id === selectedZone);

  const configMap = new Map<string, any>();
  configs.data?.forEach((c: any) => configMap.set(`${c.zone_id}:${c.category}`, c));

  const handleWeightChange = (zoneId: string, category: string, surface: string, value: number) => {
    const existing = configMap.get(`${zoneId}:${category}`);
    const weights = { receipt_share: 1, provider_share: 1, cross_pollination: 0.5, ...(existing?.surface_weights ?? {}) };
    weights[surface] = value;
    upsertConfig.mutate(
      { zone_id: zoneId, category, surface_weights: weights },
      { onError: (e: any) => toast.error(e.message) }
    );
  };

  const handleToggle = (zoneId: string, category: string, field: string, value: any) => {
    upsertConfig.mutate(
      { zone_id: zoneId, category, [field]: value } as any,
      { onError: (e: any) => toast.error(e.message) }
    );
  };

  if (configs.isLoading) return <Skeleton className="h-48 mt-4" />;

  return (
    <div className="space-y-4 mt-4">
      <ZoneFilter selectedZone={selectedZone} setSelectedZone={setSelectedZone} />

      {displayZones.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No zones found.</p>
      )}

      {displayZones.map((zone: any) => (
        <Card key={zone.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              {zone.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {CATEGORIES.map((cat) => {
              const cfg = configMap.get(`${zone.id}:${cat}`);
              const weights = { receipt_share: 1, provider_share: 1, cross_pollination: 0.5, ...(cfg?.surface_weights ?? {}) };
              const caps = { share_per_job: 1, reminder_per_week: 1, ...(cfg?.prompt_frequency_caps ?? {}) };

              return (
                <div key={cat} className="border border-border rounded-lg p-3 space-y-3">
                  <p className="text-sm font-medium capitalize">{cat.replace(/_/g, " ")}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["receipt_share", "provider_share", "cross_pollination"] as const).map((surface) => (
                      <div key={surface} className="space-y-1">
                        <Label className="text-xs capitalize">{surface.replace(/_/g, " ")}</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            min={0} max={1} step={0.1}
                            value={[weights[surface] ?? 0]}
                            onValueCommit={([v]) => handleWeightChange(zone.id, cat, surface, v)}
                            className="flex-1"
                          />
                          <span className="text-xs w-8 text-muted-foreground text-right">{(weights[surface] ?? 0).toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cfg?.incentive_visibility ?? false}
                        onCheckedChange={(v) => handleToggle(zone.id, cat, "incentive_visibility", v)}
                      />
                      <Label className="text-xs">Show incentives</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Brand</Label>
                      <Select
                        value={cfg?.share_brand_default ?? "minimal"}
                        onValueChange={(v) => handleToggle(zone.id, cat, "share_brand_default", v)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Expiry</Label>
                      <Input
                        type="number" className="h-7 w-16 text-xs"
                        value={cfg?.share_link_expiry_days ?? 30}
                        onChange={(e) => handleToggle(zone.id, cat, "share_link_expiry_days", parseInt(e.target.value) || 30)}
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FunnelBar({ steps }: { steps: { label: string; count: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-3">
          <span className="text-xs w-24 text-muted-foreground">{step.label}</span>
          <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-sm transition-all"
              style={{ width: `${(step.count / max) * 100}%`, minWidth: step.count > 0 ? "2px" : 0 }}
            />
          </div>
          <span className="text-xs font-medium w-12 text-right">{step.count}</span>
          {i > 0 && steps[i - 1].count > 0 && (
            <span className="text-xs text-muted-foreground w-12 text-right">
              {Math.round((step.count / steps[i - 1].count) * 100)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function FunnelsTab() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");

  const dateFilter = useMemo(() => {
    if (dateRange === "all") return undefined;
    const start = new Date();
    start.setDate(start.getDate() - (dateRange === "7d" ? 7 : 30));
    return { start: start.toISOString(), end: new Date().toISOString() };
  }, [dateRange]);

  const byoc = useByocFunnelStats(dateFilter);
  const referral = useReferralFunnelStats(dateFilter);
  const byop = useByopFunnelStats(dateFilter);

  const isLoading = byoc.isLoading || referral.isLoading || byop.isLoading;
  if (isLoading) return <div className="space-y-4 mt-4"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;

  const byocData = byoc.data ?? { invitesSent: 0, landingViews: 0, signups: 0, activated: 0 };
  const refData = referral.data ?? { codesShared: 0, landingViews: 0, signups: 0, subscribed: 0, firstVisit: 0 };
  const byopData = byop.data ?? { submitted: 0, underReview: 0, accepted: 0, notAFit: 0 };

  // K-factor: activations per invite sent
  const byocKFactor = byocData.invitesSent > 0 ? (byocData.activated / byocData.invitesSent) : 0;
  const refKFactor = refData.codesShared > 0 ? (refData.signups / refData.codesShared) : 0;

  const hasAnyData = byocData.invitesSent > 0 || refData.codesShared > 0 || byopData.submitted > 0;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7d" | "30d" | "all")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasAnyData && (
        <Card>
          <CardContent className="py-12 text-center">
            <Rocket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No growth events yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your signups, BYOC activations, and referral conversions will appear here.</p>
          </CardContent>
        </Card>
      )}

      {/* BYOC Activation Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            BYOC Activation Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelBar steps={[
            { label: "Invites Sent", count: byocData.invitesSent },
            { label: "Landing Views", count: byocData.landingViews },
            { label: "Signups", count: byocData.signups },
            { label: "Activated", count: byocData.activated },
          ]} />
        </CardContent>
      </Card>

      {/* Referral Conversion Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Referral Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelBar steps={[
            { label: "Codes Shared", count: refData.codesShared },
            { label: "Landing Views", count: refData.landingViews },
            { label: "Signups", count: refData.signups },
            { label: "Subscribed", count: refData.subscribed },
            { label: "First Visit", count: refData.firstVisit },
          ]} />
        </CardContent>
      </Card>

      {/* BYOP Recommendation Tracker */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            BYOP Recommendation Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelBar steps={[
            { label: "Submitted", count: byopData.submitted },
            { label: "Under Review", count: byopData.underReview },
            { label: "Accepted", count: byopData.accepted },
          ]} />
          {byopData.notAFit > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{byopData.notAFit} marked as not a fit</p>
          )}
        </CardContent>
      </Card>

      {/* K-factor Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            K-factor Summary
          </CardTitle>
          <p className="text-xs text-muted-foreground">Activations per invite sent by loop</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{byocKFactor.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">BYOC K-factor</p>
              <p className="text-xs text-muted-foreground">{byocData.activated} / {byocData.invitesSent} invites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{refKFactor.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Referral K-factor</p>
              <p className="text-xs text-muted-foreground">{refData.signups} / {refData.codesShared} codes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const FUNNEL_STEPS = [
  { key: "prompt_shown", label: "Prompted" },
  { key: "share_initiated", label: "Initiated" },
  { key: "share_completed", label: "Shared" },
  { key: "landing_viewed", label: "Viewed" },
  { key: "signup_completed", label: "Signed up" },
];

function EventsTab({ selectedZone, setSelectedZone }: { selectedZone: string; setSelectedZone: (v: string) => void }) {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");

  const dateFilter = useMemo(() => {
    if (dateRange === "all") return undefined;
    const start = new Date();
    start.setDate(start.getDate() - (dateRange === "7d" ? 7 : 30));
    return { start: start.toISOString(), end: new Date().toISOString() };
  }, [dateRange]);

  const stats = useGrowthEventStats(selectedZone === "__all__" ? undefined : selectedZone, dateFilter);

  if (stats.isLoading) return <Skeleton className="h-48 mt-4" />;

  const { byType = {}, bySurface = {}, total = 0 } = stats.data ?? {};

  // Build funnel data
  const funnelData = FUNNEL_STEPS.map((step) => ({
    ...step,
    count: byType[step.key] ?? 0,
  }));
  const maxFunnel = Math.max(1, ...funnelData.map((f) => f.count));

  // Sort surfaces by count desc
  const surfaceEntries = Object.entries(bySurface).sort(([, a], [, b]) => (b as number) - (a as number));
  const maxSurface = Math.max(1, ...surfaceEntries.map(([, v]) => v as number));

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <ZoneFilter selectedZone={selectedZone} setSelectedZone={setSelectedZone} />
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7d" | "30d" | "all")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Conversion Funnel
          </CardTitle>
          <p className="text-xs text-muted-foreground">{total} total events ({dateRange === "all" ? "all time" : `last ${dateRange === "7d" ? "7" : "30"} days`})</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {funnelData.map((step, i) => (
            <div key={step.key} className="flex items-center gap-3">
              <span className="text-xs w-20 text-muted-foreground">{step.label}</span>
              <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-sm transition-all"
                  style={{ width: `${(step.count / maxFunnel) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">{step.count}</span>
              {i > 0 && funnelData[i - 1].count > 0 && (
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {Math.round((step.count / funnelData[i - 1].count) * 100)}%
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">By Surface</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {surfaceEntries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No events recorded yet.</p>
          )}
          {surfaceEntries.map(([surface, count]) => (
            <div key={surface} className="flex items-center gap-3">
              <span className="text-xs w-40 capitalize text-muted-foreground">{surface.replace(/_/g, " ")}</span>
              <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-accent rounded-sm transition-all"
                  style={{ width: `${((count as number) / maxSurface) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right">{count as number}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).sort(([, a], [, b]) => (b as number) - (a as number)).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.replace(/_/g, " ")}: {count as number}
              </Badge>
            ))}
            {Object.keys(byType).length === 0 && (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
