import { useState, useMemo } from "react";
import {
  useZoneCategoryProviders,
  useProvidersList,
  useAssignZoneCategoryProvider,
  useRemoveZoneCategoryProvider,
  useUpdateZoneCategoryProvider,
  type ZoneCategoryProvider,
} from "@/hooks/useZoneProviders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CATEGORY_ORDER, getCategoryLabel, getCategoryIcon } from "@/lib/serviceCategories";
import { AlertTriangle, Crown, Shield, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface ZoneProvidersPanelProps {
  zoneId: string;
}

export function ZoneProvidersPanel({ zoneId }: ZoneProvidersPanelProps) {
  const { data: assignments, isLoading: assignLoading } = useZoneCategoryProviders(zoneId);
  const { data: providers, isLoading: provLoading } = useProvidersList();
  const assign = useAssignZoneCategoryProvider();
  const remove = useRemoveZoneCategoryProvider();
  const updateProvider = useUpdateZoneCategoryProvider();

  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_ORDER[0]);
  const [addingRole, setAddingRole] = useState<"PRIMARY" | "BACKUP" | null>(null);
  const [selectedProviderOrg, setSelectedProviderOrg] = useState<string>("");
  const [removeTarget, setRemoveTarget] = useState<ZoneCategoryProvider | null>(null);

  const isLoading = assignLoading || provLoading;

  // Group assignments by category
  const categoryAssignments = useMemo(() => {
    if (!assignments) return {};
    const grouped: Record<string, ZoneCategoryProvider[]> = {};
    for (const a of assignments) {
      if (!grouped[a.category]) grouped[a.category] = [];
      grouped[a.category].push(a);
    }
    return grouped;
  }, [assignments]);
  const currentAssignments = categoryAssignments[selectedCategory] ?? [];
  const hasPrimary = currentAssignments.some((a) => a.role === "PRIMARY");
  const assignedOrgIds = new Set(currentAssignments.map((a) => a.provider_org_id));

  // Unique provider orgs not already assigned to this category
  const availableOrgs = useMemo(() => {
    if (!providers) return [];
    const orgMap = new Map<string, { orgId: string; orgName: string; userName: string }>();
    for (const p of providers) {
      if (p.provider_org_id && !assignedOrgIds.has(p.provider_org_id) && !orgMap.has(p.provider_org_id)) {
        orgMap.set(p.provider_org_id, {
          orgId: p.provider_org_id,
          orgName: p.org_name ?? p.full_name,
          userName: p.full_name,
        });
      }
    }
    return Array.from(orgMap.values());
  }, [providers, assignedOrgIds]);

  // Categories that have any assignments
  const categoriesWithAssignments = useMemo(() => {
    if (!assignments) return new Set<string>();
    return new Set(assignments.map((a) => a.category));
  }, [assignments]);
  const getProviderName = (orgId: string) => {
    const p = providers?.find((p) => p.provider_org_id === orgId);
    return p?.org_name ?? p?.full_name ?? "Unknown";
  };

  const getProviderAvatar = (orgId: string) => {
    const p = providers?.find((p) => p.provider_org_id === orgId);
    return p?.avatar_url;
  };

  const handleAdd = async () => {
    if (!addingRole || !selectedProviderOrg) return;

    // Guard: only 1 PRIMARY per zone+category
    if (addingRole === "PRIMARY" && hasPrimary) {
      toast.error("This category already has a Primary provider. Remove the existing one first.");
      return;
    }

    try {
      await assign.mutateAsync({
        zoneId,
        category: selectedCategory,
        providerOrgId: selectedProviderOrg,
        role: addingRole,
      });
      toast.success(`${addingRole === "PRIMARY" ? "Primary" : "Backup"} provider assigned`);
      setAddingRole(null);
      setSelectedProviderOrg("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to assign provider");
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await remove.mutateAsync({ id: removeTarget.id, zoneId });
      toast.success("Provider removed from category");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove");
    }
    setRemoveTarget(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!providers?.length) {
    return <p className="text-muted-foreground text-center py-8">No providers found. Add provider roles first.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ORDER.map((cat) => {
            const Icon = getCategoryIcon(cat);
            const isActive = cat === selectedCategory;
            const hasAssignments = categoriesWithAssignments.has(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : hasAssignments
                    ? "bg-accent text-accent-foreground border-border"
                    : "bg-card text-muted-foreground border-border/50"
                }`}
              >
                <Icon className="h-3 w-3" />
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning if no primary */}
      {!hasPrimary && (
        <div className="flex items-center gap-2 text-sm bg-warning/10 text-warning rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>No Primary provider for <strong>{getCategoryLabel(selectedCategory)}</strong>. Assign one for reliable service.</span>
        </div>
      )}

      {/* Current assignments */}
      <div className="space-y-2">
        {currentAssignments.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">No providers assigned to {getCategoryLabel(selectedCategory)}.</p>
        )}

        {currentAssignments
          .sort((a, b) => (a.role === "PRIMARY" ? -1 : 1) - (b.role === "PRIMARY" ? -1 : 1))
          .map((a) => {
            const name = getProviderName(a.provider_org_id);
            const avatar = getProviderAvatar(a.provider_org_id);
            return (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatar || undefined} />
                  <AvatarFallback className="text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <div className="flex items-center gap-1.5">
                    {a.role === "PRIMARY" ? (
                      <Badge variant="default" className="text-[10px] gap-0.5 px-1.5 py-0">
                        <Crown className="h-2.5 w-2.5" /> Primary
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-0.5 px-1.5 py-0">
                        <Shield className="h-2.5 w-2.5" /> Backup #{a.priority_rank}
                      </Badge>
                    )}
                    {a.status === "SUSPENDED" && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Suspended</Badge>
                    )}
                    {a.performance_score != null && (
                      <span className="text-[10px] text-muted-foreground">Score: {(a.performance_score * 100).toFixed(0)}%</span>
                    )}
                  </div>
                </div>
                {a.role === "BACKUP" && (
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground"
                      disabled={a.priority_rank <= 1 || updateProvider.isPending}
                      onClick={() => updateProvider.mutate({ id: a.id, zoneId, priority_rank: a.priority_rank - 1 })}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground"
                      disabled={updateProvider.isPending}
                      onClick={() => updateProvider.mutate({ id: a.id, zoneId, priority_rank: a.priority_rank + 1 })}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoveTarget(a)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
      </div>

      {/* Add provider controls */}
      {addingRole ? (
        <div className="space-y-2 p-3 rounded-xl border border-dashed border-border bg-muted/30">
          <p className="text-xs font-medium">
            Add {addingRole === "PRIMARY" ? "Primary" : "Backup"} for {getCategoryLabel(selectedCategory)}
          </p>
          <Select value={selectedProviderOrg} onValueChange={setSelectedProviderOrg}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select provider org…" />
            </SelectTrigger>
            <SelectContent>
              {availableOrgs.map((o) => (
                <SelectItem key={o.orgId} value={o.orgId}>{o.orgName}</SelectItem>
              ))}
              {availableOrgs.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No available providers</div>
              )}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={handleAdd} disabled={!selectedProviderOrg || assign.isPending}>
              {assign.isPending ? "Assigning…" : "Confirm"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAddingRole(null); setSelectedProviderOrg(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {!hasPrimary && (
            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setAddingRole("PRIMARY")}>
              <Crown className="h-3.5 w-3.5" /> Set Primary
            </Button>
          )}
          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setAddingRole("BACKUP")}>
            <Plus className="h-3.5 w-3.5" /> Add Backup
          </Button>
        </div>
      )}

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove provider?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{removeTarget ? getProviderName(removeTarget.provider_org_id) : ""}</strong> as{" "}
              {removeTarget?.role === "PRIMARY" ? "Primary" : "Backup"} for {getCategoryLabel(selectedCategory)}?
              {removeTarget?.role === "PRIMARY" && " This will leave the category without a Primary provider."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
