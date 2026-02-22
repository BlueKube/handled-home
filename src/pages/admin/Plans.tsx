import { useState } from "react";
import { usePlans, useCreatePlan, useUpdatePlan, useDuplicatePlan, usePlanZoneAvailability, usePlanEntitlementVersions, useUpdateZoneAvailability, useCreateEntitlementVersion, useUpdateEntitlementVersion, useManageSkuRules, useSkuRulesForVersion, Plan, PlanEntitlementVersion } from "@/hooks/usePlans";
import { useZones } from "@/hooks/useZones";
import { useSkus } from "@/hooks/useSkus";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Copy, Archive, Search, Globe, Package } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["all", "active", "draft", "hidden", "retired"];

export default function AdminPlans() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: plans, isLoading } = usePlans(statusFilter);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const duplicatePlan = useDuplicatePlan();

  const filteredPlans = plans?.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingPlan({ name: "", status: "draft", tagline: "", display_price_text: "", recommended_rank: 0 });
    setSelectedPlan(null);
    setFormOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setSelectedPlan(plan);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan?.name) { toast.error("Name is required"); return; }
    try {
      if (selectedPlan) {
        await updatePlan.mutateAsync({ id: selectedPlan.id, updates: editingPlan });
        toast.success("Plan updated");
      } else {
        await createPlan.mutateAsync(editingPlan);
        toast.success("Plan created");
      }
      setFormOpen(false);
    } catch {
      toast.error("Could not save plan");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicatePlan.mutateAsync(id);
      toast.success("Plan duplicated");
    } catch {
      toast.error("Could not duplicate plan");
    }
  };

  const handleRetire = async (plan: Plan) => {
    try {
      await updatePlan.mutateAsync({ id: plan.id, updates: { status: "retired" } });
      toast.success("Plan retired");
    } catch {
      toast.error("Could not retire plan");
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-h2">Subscription Plans</h1>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Plan</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search plans…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {STATUSES.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {filteredPlans?.map((plan) => (
            <Card key={plan.id} className="press-feedback cursor-pointer" onClick={() => openEdit(plan)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{plan.name}</p>
                    <StatusBadge status={plan.status} />
                  </div>
                  {plan.tagline && <p className="text-xs text-muted-foreground truncate">{plan.tagline}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {plan.display_price_text && <span>{plan.display_price_text}</span>}
                    {plan.stripe_price_id && <span className="text-accent">Stripe linked</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDuplicate(plan.id); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {plan.status !== "retired" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <Archive className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Retire "{plan.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>This plan will be hidden from customers. Existing subscribers will keep their plan until they change or cancel.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRetire(plan)}>Retire</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {(!filteredPlans || filteredPlans.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No plans found.</p>
          )}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedPlan ? "Edit Plan" : "New Plan"}</SheetTitle>
          </SheetHeader>
          {editingPlan && (
            <PlanForm plan={editingPlan} onChange={setEditingPlan} onSave={handleSave} saving={createPlan.isPending || updatePlan.isPending} planId={selectedPlan?.id} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const MODEL_LABELS: Record<string, string> = {
  credits_per_cycle: "Credits per Cycle",
  count_per_cycle: "Count per Cycle",
  minutes_per_cycle: "Minutes per Cycle",
};

const RULE_OPTIONS = [
  { value: "none", label: "No rule" },
  { value: "included", label: "Included" },
  { value: "extra_allowed", label: "Extra allowed" },
  { value: "blocked", label: "Blocked" },
  { value: "provider_only", label: "Provider only" },
];

function PlanForm({ plan, onChange, onSave, saving, planId }: {
  plan: Partial<Plan>;
  onChange: (p: Partial<Plan>) => void;
  onSave: () => void;
  saving: boolean;
  planId?: string;
}) {
  const isEditing = !!planId;
  const { data: zones } = useZones();
  const { data: zoneAvail } = usePlanZoneAvailability(planId ?? null);
  const { data: versions } = usePlanEntitlementVersions(planId ?? null);
  const { data: skus } = useSkus({ status: "active" });
  const updateZone = useUpdateZoneAvailability();
  const createVersion = useCreateEntitlementVersion();
  const updateVersion = useUpdateEntitlementVersion();
  const manageSkuRule = useManageSkuRules();

  const currentVersion = versions?.[0];

  return (
    <div className="space-y-6 py-4">
      {/* Basics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basics</h3>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={plan.name ?? ""} onChange={(e) => onChange({ ...plan, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Tagline</Label>
          <Input value={plan.tagline ?? ""} onChange={(e) => onChange({ ...plan, tagline: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Display Price Text</Label>
          <Input placeholder="e.g. $99/mo" value={plan.display_price_text ?? ""} onChange={(e) => onChange({ ...plan, display_price_text: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={plan.status ?? "draft"} onValueChange={(v) => onChange({ ...plan, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["draft", "active", "hidden", "retired"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Recommended Rank</Label>
          <Input type="number" value={plan.recommended_rank ?? 0} onChange={(e) => onChange({ ...plan, recommended_rank: parseInt(e.target.value) || 0 })} />
        </div>
      </div>

      {/* Stripe */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stripe</h3>
        <div className="space-y-2">
          <Label>Stripe Product ID</Label>
          <Input placeholder="prod_..." value={plan.stripe_product_id ?? ""} onChange={(e) => onChange({ ...plan, stripe_product_id: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Stripe Price ID</Label>
          <Input placeholder="price_..." value={plan.stripe_price_id ?? ""} onChange={(e) => onChange({ ...plan, stripe_price_id: e.target.value })} />
        </div>
      </div>

      {/* Zone Availability */}
      {planId && zones && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Globe className="h-4 w-4" /> Zone Availability
          </h3>
          {zones.map((zone) => {
            const avail = zoneAvail?.find((a) => a.zone_id === zone.id);
            return (
              <div key={zone.id} className="flex items-center justify-between">
                <span className="text-sm">{zone.name}</span>
                <Switch
                  checked={avail?.is_enabled ?? false}
                  onCheckedChange={(checked) => updateZone.mutate({ planId: planId!, zoneId: zone.id, isEnabled: checked })}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Entitlements */}
      {planId && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Package className="h-4 w-4" /> Entitlements
          </h3>
          {currentVersion ? (
            <EntitlementEditor
              version={currentVersion}
              planId={planId}
              skus={skus ?? []}
              onUpdateVersion={updateVersion}
              onCreateVersion={createVersion}
            />
          ) : (
            <CreateFirstVersion planId={planId} createVersion={createVersion} />
          )}
        </div>
      )}

      <Button className="w-full" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : isEditing ? "Update Plan" : "Create Plan"}
      </Button>
    </div>
  );
}

function CreateFirstVersion({ planId, createVersion }: { planId: string; createVersion: ReturnType<typeof useCreateEntitlementVersion> }) {
  const [modelType, setModelType] = useState("credits_per_cycle");
  const [included, setIncluded] = useState(4);
  const [extraAllowed, setExtraAllowed] = useState(false);
  const [maxExtra, setMaxExtra] = useState(2);
  const [serviceWeeks, setServiceWeeks] = useState(4);

  const includedField = modelType === "credits_per_cycle" ? "included_credits" : modelType === "count_per_cycle" ? "included_count" : "included_minutes";
  const maxExtraField = modelType === "credits_per_cycle" ? "max_extra_credits" : modelType === "count_per_cycle" ? "max_extra_count" : "max_extra_minutes";

  return (
    <div className="space-y-3 p-3 rounded-lg border border-border">
      <div className="space-y-2">
        <Label>Model Type</Label>
        <Select value={modelType} onValueChange={setModelType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(MODEL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Included {MODEL_LABELS[modelType]?.split(" ")[0]}</Label>
        <Input type="number" min={0} value={included} onChange={(e) => setIncluded(parseInt(e.target.value) || 0)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Allow Extras</Label>
        <Switch checked={extraAllowed} onCheckedChange={setExtraAllowed} />
      </div>
      {extraAllowed && (
        <div className="space-y-2">
          <Label>Max Extra</Label>
          <Input type="number" min={0} value={maxExtra} onChange={(e) => setMaxExtra(parseInt(e.target.value) || 0)} />
        </div>
      )}
      <div className="space-y-2">
        <Label>Service Weeks per Billing Cycle</Label>
        <Select value={String(serviceWeeks)} onValueChange={(v) => setServiceWeeks(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 (every 4 weeks)</SelectItem>
            <SelectItem value="2">2 (every other week)</SelectItem>
            <SelectItem value="4">4 (weekly)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" className="w-full" disabled={createVersion.isPending} onClick={async () => {
        try {
          const v = await createVersion.mutateAsync({
            plan_id: planId,
            version: 1,
            status: "published",
            model_type: modelType as any,
            [includedField]: included,
            extra_allowed: extraAllowed,
            ...(extraAllowed ? { [maxExtraField]: maxExtra } : {}),
            included_service_weeks_per_billing_cycle: serviceWeeks,
          });
          await updatePlanVersion(planId, v.id);
          toast.success("Entitlement version created");
        } catch { toast.error("Failed to create version"); }
      }}>
        {createVersion.isPending ? "Creating…" : "Create First Version"}
      </Button>
    </div>
  );
}

function EntitlementEditor({ version, planId, skus, onUpdateVersion, onCreateVersion }: {
  version: PlanEntitlementVersion;
  planId: string;
  skus: Array<{ id: string; name: string }>;
  onUpdateVersion: ReturnType<typeof useUpdateEntitlementVersion>;
  onCreateVersion: ReturnType<typeof useCreateEntitlementVersion>;
}) {
  const [modelType, setModelType] = useState(version.model_type);
  const [includedCredits, setIncludedCredits] = useState(version.included_credits ?? 0);
  const [includedCount, setIncludedCount] = useState(version.included_count ?? 0);
  const [includedMinutes, setIncludedMinutes] = useState(version.included_minutes ?? 0);
  const [extraAllowed, setExtraAllowed] = useState(version.extra_allowed);
  const [maxExtraCredits, setMaxExtraCredits] = useState(version.max_extra_credits ?? 0);
  const [maxExtraCount, setMaxExtraCount] = useState(version.max_extra_count ?? 0);
  const [maxExtraMinutes, setMaxExtraMinutes] = useState(version.max_extra_minutes ?? 0);
  const [serviceWeeks, setServiceWeeks] = useState(version.included_service_weeks_per_billing_cycle ?? 4);
  const [showVersionPrompt, setShowVersionPrompt] = useState(false);
  const [editLiveConfirm, setEditLiveConfirm] = useState("");
  const { data: skuRules } = useSkuRulesForVersion(version.id);
  const manageSkuRule = useManageSkuRules();

  const isPublished = version.status === "published";

  const getUpdates = () => ({
    model_type: modelType as any,
    included_credits: includedCredits,
    included_count: includedCount,
    included_minutes: includedMinutes,
    extra_allowed: extraAllowed,
    max_extra_credits: maxExtraCredits,
    max_extra_count: maxExtraCount,
    max_extra_minutes: maxExtraMinutes,
    included_service_weeks_per_billing_cycle: serviceWeeks,
  });

  const handleSave = () => {
    if (isPublished) {
      setShowVersionPrompt(true);
    } else {
      doUpdateInPlace();
    }
  };

  const doUpdateInPlace = async () => {
    try {
      await onUpdateVersion.mutateAsync({ id: version.id, updates: getUpdates() });
      toast.success("Entitlements updated");
      setShowVersionPrompt(false);
      setEditLiveConfirm("");
    } catch { toast.error("Failed to update"); }
  };

  const doCreateNewVersion = async () => {
    try {
      // Retire old version
      await onUpdateVersion.mutateAsync({ id: version.id, updates: { status: "retired" } });
      // Create new version
      const v = await onCreateVersion.mutateAsync({
        plan_id: planId,
        version: version.version + 1,
        status: "published",
        ...getUpdates(),
      });
      await updatePlanVersion(planId, v.id);
      toast.success("New entitlement version created");
      setShowVersionPrompt(false);
    } catch { toast.error("Failed to create new version"); }
  };

  const includedLabel = modelType === "credits_per_cycle" ? "Credits" : modelType === "count_per_cycle" ? "Count" : "Minutes";
  const includedValue = modelType === "credits_per_cycle" ? includedCredits : modelType === "count_per_cycle" ? includedCount : includedMinutes;
  const setIncludedValue = modelType === "credits_per_cycle" ? setIncludedCredits : modelType === "count_per_cycle" ? setIncludedCount : setIncludedMinutes;
  const maxExtraValue = modelType === "credits_per_cycle" ? maxExtraCredits : modelType === "count_per_cycle" ? maxExtraCount : maxExtraMinutes;
  const setMaxExtraValue = modelType === "credits_per_cycle" ? setMaxExtraCredits : modelType === "count_per_cycle" ? setMaxExtraCount : setMaxExtraMinutes;

  return (
    <div className="space-y-3 p-3 rounded-lg border border-border">
      <p className="text-xs text-muted-foreground">Version {version.version} ({version.status})</p>

      <div className="space-y-2">
        <Label>Model Type</Label>
        <Select value={modelType} onValueChange={setModelType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(MODEL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Included {includedLabel}</Label>
        <Input type="number" min={0} value={includedValue} onChange={(e) => setIncludedValue(parseInt(e.target.value) || 0)} />
      </div>

      <div className="flex items-center justify-between">
        <Label>Allow Extras</Label>
        <Switch checked={extraAllowed} onCheckedChange={setExtraAllowed} />
      </div>

      {extraAllowed && (
        <div className="space-y-2">
          <Label>Max Extra {includedLabel}</Label>
          <Input type="number" min={0} value={maxExtraValue} onChange={(e) => setMaxExtraValue(parseInt(e.target.value) || 0)} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Service Weeks per Billing Cycle</Label>
        <Select value={String(serviceWeeks)} onValueChange={(v) => setServiceWeeks(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 (every 4 weeks)</SelectItem>
            <SelectItem value="2">2 (every other week)</SelectItem>
            <SelectItem value="4">4 (weekly)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SKU Rules */}
      {skus.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">SKU Rules</Label>
          {skus.map((sku) => {
            const rule = skuRules?.find((r) => r.sku_id === sku.id);
            return (
              <div key={sku.id} className="flex items-center justify-between gap-2">
                <span className="text-sm truncate flex-1">{sku.name}</span>
                <Select
                  value={rule?.rule_type ?? "none"}
                  onValueChange={(val) => manageSkuRule.mutate({ entitlementVersionId: version.id, skuId: sku.id, ruleType: val })}
                >
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RULE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={handleSave}
        disabled={onUpdateVersion.isPending || onCreateVersion.isPending}>
        Save Entitlements
      </Button>

      {/* Version prompt for published versions */}
      <AlertDialog open={showVersionPrompt} onOpenChange={setShowVersionPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This version is live</AlertDialogTitle>
            <AlertDialogDescription>
              Existing subscribers are pinned to this version. Create a new version (recommended) or edit the live version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 px-1">
            <Input
              placeholder='Type "EDIT LIVE" to edit in place'
              value={editLiveConfirm}
              onChange={(e) => setEditLiveConfirm(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              size="sm"
              disabled={editLiveConfirm !== "EDIT LIVE"}
              onClick={doUpdateInPlace}
            >
              Edit Live
            </Button>
            <AlertDialogAction onClick={doCreateNewVersion}>
              Create New Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

async function updatePlanVersion(planId: string, versionId: string) {
  const { supabase } = await import("@/integrations/supabase/client");
  await supabase.from("plans").update({ current_entitlement_version_id: versionId } as any).eq("id", planId);
}
