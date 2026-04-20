import { useState } from "react";
import { usePlans, useCreatePlan, useUpdatePlan, useDuplicatePlan, Plan } from "@/hooks/usePlans";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Copy, Archive, Search, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PlanForm } from "@/components/admin/plans/PlanForm";

const FAMILY_ORDER = ["legacy", "basic", "full", "premier", "__unassigned__"] as const;
const FAMILY_LABELS: Record<string, string> = {
  legacy: "Legacy",
  basic: "Basic",
  full: "Full",
  premier: "Premier",
  __unassigned__: "Unassigned",
};

const STATUSES = ["all", "active", "draft", "hidden", "retired"];

export default function AdminPlans() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: plans, isLoading, isError } = usePlans(statusFilter);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const duplicatePlan = useDuplicatePlan();

  const filteredPlans = plans?.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isError) {
    return (
      <div className="p-6 space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h1 className="text-2xl font-bold">Plans</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load data. Check your connection and try again.
        </p>
      </div>
    );
  }

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
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-h2">Subscription Plans</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/admin/plan-variant-rules")}>
            <SlidersHorizontal className="h-4 w-4 mr-1" /> Variant Rules
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Plan</Button>
        </div>
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
        <div className="space-y-6">
          {FAMILY_ORDER.map((family) => {
            const plansInFamily = (filteredPlans ?? []).filter((p) =>
              family === "__unassigned__" ? !p.plan_family : p.plan_family === family
            );
            if (plansInFamily.length === 0) return null;
            // Sort within family: size_tier ascending, then recommended_rank ascending.
            const sorted = [...plansInFamily].sort((a, b) => {
              const tierA = a.size_tier ?? 999;
              const tierB = b.size_tier ?? 999;
              if (tierA !== tierB) return tierA - tierB;
              return (a.recommended_rank ?? 0) - (b.recommended_rank ?? 0);
            });
            return (
              <div key={family} className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {FAMILY_LABELS[family]}
                  </h3>
                  <span className="text-xs text-muted-foreground">{sorted.length}</span>
                </div>
                {sorted.map((plan) => (
                  <Card key={plan.id} className="press-feedback cursor-pointer" onClick={() => openEdit(plan)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{plan.name}</p>
                          <StatusBadge status={plan.status} />
                          {plan.size_tier != null && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              tier {plan.size_tier}
                            </span>
                          )}
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
              </div>
            );
          })}
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
