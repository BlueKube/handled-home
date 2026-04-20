import { useMemo, useState } from "react";
import {
  PlanVariantRule,
  usePlanVariantRules,
  useCreateVariantRule,
  useUpdateVariantRule,
  useDeleteVariantRule,
} from "@/hooks/usePlanVariantRules";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FAMILY_FILTERS = ["all", "basic", "full", "premier"] as const;
const SIZE_TIERS = [10, 20, 30, 40] as const;

const SQFT_OPTIONS = ["lt_1500", "1500_2500", "2500_3500", "3500_5000", "5000_plus"];
const YARD_OPTIONS = ["NONE", "SMALL", "MEDIUM", "LARGE"];
const WINDOWS_OPTIONS = ["lt_15", "15_30", "30_plus"];
const STORIES_OPTIONS = ["1", "2", "3_plus"];

type DraftRule = Partial<PlanVariantRule>;

function emptyDraft(): DraftRule {
  return {
    plan_family: "basic",
    target_size_tier: 10,
    sqft_tiers: [],
    yard_tiers: [],
    windows_tiers: [],
    stories_tiers: [],
    priority: 10,
    notes: "",
  };
}

function TierMultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={
                "text-xs px-2.5 py-1 rounded-full border transition-colors " +
                (on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-input hover:bg-muted")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length === 0 ? "Empty = wildcard (matches any value)" : `${value.length} selected`}
      </p>
    </div>
  );
}

export default function AdminPlanVariantRules() {
  const navigate = useNavigate();
  const [familyFilter, setFamilyFilter] = useState<(typeof FAMILY_FILTERS)[number]>("all");
  const { data: rules, isLoading, isError } = usePlanVariantRules(
    familyFilter === "all" ? undefined : familyFilter
  );
  const createRule = useCreateVariantRule();
  const updateRule = useUpdateVariantRule();
  const deleteRule = useDeleteVariantRule();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRule>(emptyDraft());

  const sorted = useMemo(() => {
    if (!rules) return [];
    return [...rules].sort((a, b) => {
      if (a.plan_family !== b.plan_family) return a.plan_family.localeCompare(b.plan_family);
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.target_size_tier - b.target_size_tier;
    });
  }, [rules]);

  if (isError) {
    return (
      <div className="p-6 space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h1 className="text-2xl font-bold">Variant Rules</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load data. Check your connection and try again.
        </p>
      </div>
    );
  }

  const openCreate = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (rule: PlanVariantRule) => {
    setDraft({
      plan_family: rule.plan_family,
      target_size_tier: rule.target_size_tier,
      sqft_tiers: rule.sqft_tiers,
      yard_tiers: rule.yard_tiers,
      windows_tiers: rule.windows_tiers,
      stories_tiers: rule.stories_tiers,
      priority: rule.priority,
      notes: rule.notes ?? "",
    });
    setEditingId(rule.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!draft.plan_family || !draft.target_size_tier) {
      toast.error("Family and target size tier are required");
      return;
    }
    try {
      if (editingId) {
        await updateRule.mutateAsync({ id: editingId, updates: draft });
        toast.success("Rule updated");
      } else {
        await createRule.mutateAsync(draft);
        toast.success("Rule created");
      }
      setFormOpen(false);
    } catch {
      toast.error("Could not save rule");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast.success("Rule deleted");
    } catch {
      toast.error("Could not delete rule");
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin/plans")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-h2">Variant Rules</h1>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Rule
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Rules feed <code>pick_plan_variant</code>. Higher priority wins; empty tier arrays are wildcards.
      </p>

      <Tabs value={familyFilter} onValueChange={(v) => setFamilyFilter(v as typeof familyFilter)}>
        <TabsList>
          {FAMILY_FILTERS.map((f) => (
            <TabsTrigger key={f} value={f} className="capitalize">
              {f}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No rules in this family.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((rule) => (
            <Card key={rule.id} className="press-feedback cursor-pointer" onClick={() => openEdit(rule)}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium capitalize">{rule.plan_family}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      tier {rule.target_size_tier}
                    </span>
                    <span className="text-xs text-muted-foreground">priority {rule.priority}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rule.sqft_tiers.length > 0 &&
                      rule.sqft_tiers.map((t) => (
                        <span key={`sq-${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                          sqft: {t}
                        </span>
                      ))}
                    {rule.yard_tiers.length > 0 &&
                      rule.yard_tiers.map((t) => (
                        <span key={`yd-${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          yard: {t}
                        </span>
                      ))}
                    {rule.windows_tiers.length > 0 &&
                      rule.windows_tiers.map((t) => (
                        <span key={`wn-${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          win: {t}
                        </span>
                      ))}
                    {rule.stories_tiers.length > 0 &&
                      rule.stories_tiers.map((t) => (
                        <span key={`st-${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          stories: {t}
                        </span>
                      ))}
                    {rule.sqft_tiers.length +
                      rule.yard_tiers.length +
                      rule.windows_tiers.length +
                      rule.stories_tiers.length ===
                      0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warn/10 text-warn">
                        catch-all (all wildcards)
                      </span>
                    )}
                  </div>
                  {rule.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-1">{rule.notes}</p>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this rule?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <code>pick_plan_variant</code> will fall back to other rules or tier 10 for affected
                        properties.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(rule.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Rule" : "New Rule"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Plan family *</Label>
                <Select
                  value={draft.plan_family ?? "basic"}
                  onValueChange={(v) => setDraft({ ...draft, plan_family: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["basic", "full", "premier"].map((f) => (
                      <SelectItem key={f} value={f} className="capitalize">
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target size tier *</Label>
                <Select
                  value={String(draft.target_size_tier ?? 10)}
                  onValueChange={(v) => setDraft({ ...draft, target_size_tier: parseInt(v, 10) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_TIERS.map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TierMultiSelect
              label="Sqft tiers"
              options={SQFT_OPTIONS}
              value={draft.sqft_tiers ?? []}
              onChange={(v) => setDraft({ ...draft, sqft_tiers: v })}
            />
            <TierMultiSelect
              label="Yard tiers"
              options={YARD_OPTIONS}
              value={draft.yard_tiers ?? []}
              onChange={(v) => setDraft({ ...draft, yard_tiers: v })}
            />
            <TierMultiSelect
              label="Windows tiers"
              options={WINDOWS_OPTIONS}
              value={draft.windows_tiers ?? []}
              onChange={(v) => setDraft({ ...draft, windows_tiers: v })}
            />
            <TierMultiSelect
              label="Stories tiers"
              options={STORIES_OPTIONS}
              value={draft.stories_tiers ?? []}
              onChange={(v) => setDraft({ ...draft, stories_tiers: v })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={draft.priority ?? 10}
                  onChange={(e) => setDraft({ ...draft, priority: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={createRule.isPending || updateRule.isPending}
            >
              {createRule.isPending || updateRule.isPending
                ? "Saving…"
                : editingId
                ? "Update Rule"
                : "Create Rule"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
