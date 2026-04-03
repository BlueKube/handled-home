import { useState } from "react";
import { Activity, Shield, ChevronRight, Sliders, Inbox, Settings2, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useZones } from "@/hooks/useZones";
import { useMarketHealth, type HealthSnapshot } from "@/hooks/useMarketHealth";
import { useAutopilotActions } from "@/hooks/useAutopilotActions";
import { useGrowthSurfaceConfig } from "@/hooks/useGrowthSurfaceConfig";
import { RecommendationsInbox } from "@/components/admin/RecommendationsInbox";
import { ThresholdDials } from "@/components/admin/ThresholdDials";
import { HelpTip } from "@/components/ui/help-tip";
import { ZoneMatrixTab } from "@/components/admin/growth/ZoneMatrixTab";
import { FunnelsTab } from "@/components/admin/growth/FunnelsTab";
import { EventsTab } from "@/components/admin/growth/EventsTab";
import { ZoneFilter } from "@/components/admin/growth/ZoneFilter";
import { STATE_COLORS, HEALTH_COLORS, type ZoneTabProps } from "@/components/admin/growth/shared";
import { QueryErrorCard } from "@/components/QueryErrorCard";

const CATEGORIES = ["lawn_care", "cleaning", "landscaping", "pest_control", "pool_care"];

export default function AdminGrowth() {
  const [selectedZone, setSelectedZone] = useState<string>("__all__");

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Growth Console <HelpTip text="Growth Console tracks viral loop performance — BYOC activations, referral conversions, and BYOP recommendations." /></h1>
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

function HealthTab({ selectedZone, setSelectedZone }: ZoneTabProps) {
  const { snapshots } = useMarketHealth(selectedZone === "__all__" ? undefined : selectedZone);

  if (snapshots.isLoading) return <Skeleton className="h-48 mt-4" />;
  if (snapshots.isError) return <div className="mt-4"><QueryErrorCard /></div>;

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
                <span className={`text-lg font-bold ${HEALTH_COLORS[s.health_label] ?? ""}`}>{Math.round(s.health_score)}</span>
                <Badge variant="outline" className={`text-xs ${HEALTH_COLORS[s.health_label] ?? ""}`}>{s.health_label}</Badge>
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

function ActionsTab({ selectedZone, setSelectedZone }: ZoneTabProps) {
  const actions = useAutopilotActions(selectedZone === "__all__" ? undefined : selectedZone);
  if (actions.isLoading) return <Skeleton className="h-48 mt-4" />;
  if (actions.isError) return <div className="mt-4"><QueryErrorCard /></div>;
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
                  {a.trigger_source === "admin" ? <Shield className="h-4 w-4 text-primary" /> : <Activity className="h-4 w-4 text-muted-foreground" />}
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

function SurfacesTab({ selectedZone, setSelectedZone }: ZoneTabProps) {
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
    upsertConfig.mutate({ zone_id: zoneId, category, surface_weights: weights }, { onError: (e: any) => toast.error(e.message) });
  };

  const handleToggle = (zoneId: string, category: string, field: string, value: any) => {
    upsertConfig.mutate({ zone_id: zoneId, category, [field]: value } as any, { onError: (e: any) => toast.error(e.message) });
  };

  if (configs.isLoading) return <Skeleton className="h-48 mt-4" />;
  if (configs.isError) return <div className="mt-4"><QueryErrorCard /></div>;

  return (
    <div className="space-y-4 mt-4">
      <ZoneFilter selectedZone={selectedZone} setSelectedZone={setSelectedZone} />
      {displayZones.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No zones found.</p>}
      {displayZones.map((zone: any) => (
        <Card key={zone.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Sliders className="h-4 w-4" />{zone.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {CATEGORIES.map((cat) => {
              const cfg = configMap.get(`${zone.id}:${cat}`);
              const weights = { receipt_share: 1, provider_share: 1, cross_pollination: 0.5, ...(cfg?.surface_weights ?? {}) };
              return (
                <div key={cat} className="border border-border rounded-lg p-3 space-y-3">
                  <p className="text-sm font-medium capitalize">{cat.replace(/_/g, " ")}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["receipt_share", "provider_share", "cross_pollination"] as const).map((surface) => (
                      <div key={surface} className="space-y-1">
                        <Label className="text-xs capitalize">{surface.replace(/_/g, " ")}</Label>
                        <div className="flex items-center gap-2">
                          <Slider min={0} max={1} step={0.1} value={[weights[surface] ?? 0]} onValueCommit={([v]) => handleWeightChange(zone.id, cat, surface, v)} className="flex-1" />
                          <span className="text-xs w-8 text-muted-foreground text-right">{(weights[surface] ?? 0).toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <Switch checked={cfg?.incentive_visibility ?? false} onCheckedChange={(v) => handleToggle(zone.id, cat, "incentive_visibility", v)} />
                      <Label className="text-xs">Show incentives</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Brand</Label>
                      <Select value={cfg?.share_brand_default ?? "minimal"} onValueChange={(v) => handleToggle(zone.id, cat, "share_brand_default", v)}>
                        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Expiry</Label>
                      <Input type="number" className="h-7 w-16 text-xs" value={cfg?.share_link_expiry_days ?? 30} onChange={(e) => handleToggle(zone.id, cat, "share_link_expiry_days", parseInt(e.target.value) || 30)} />
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
