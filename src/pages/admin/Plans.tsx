import { useState } from "react";
import { usePlans, useCreatePlan, useUpdatePlan, useDuplicatePlan, usePlanZoneAvailability, usePlanEntitlementVersions, useUpdateZoneAvailability, useCreateEntitlementVersion, useManageSkuRules, Plan } from "@/hooks/usePlans";
import { useZones } from "@/hooks/useZones";
import { useSkus } from "@/hooks/useSkus";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      {/* Plan Form Sheet */}
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

      {/* Zone Availability (only for saved plans) */}
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

      {/* Entitlements (only for saved plans) */}
      {planId && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Package className="h-4 w-4" /> Entitlements
          </h3>
          {currentVersion ? (
            <div className="space-y-2 text-sm">
              <p>Version {currentVersion.version} ({currentVersion.status})</p>
              <p>Model: {currentVersion.model_type}</p>
              <p>Credits: {currentVersion.included_credits} | Count: {currentVersion.included_count} | Minutes: {currentVersion.included_minutes}</p>
              <p>Extras: {currentVersion.extra_allowed ? "Yes" : "No"}</p>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const v = await createVersion.mutateAsync({
                  plan_id: planId,
                  version: 1,
                  status: "published",
                  model_type: "credits_per_cycle" as any,
                  included_credits: 4,
                });
                await updatePlanVersion(planId, v.id);
                toast.success("Entitlement version created");
              } catch { toast.error("Failed"); }
            }}>
              Create First Version
            </Button>
          )}
        </div>
      )}

      <Button className="w-full" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : isEditing ? "Update Plan" : "Create Plan"}
      </Button>
    </div>
  );
}

async function updatePlanVersion(planId: string, versionId: string) {
  const { supabase } = await import("@/integrations/supabase/client");
  await supabase.from("plans").update({ current_entitlement_version_id: versionId } as any).eq("id", planId);
}
