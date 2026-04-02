import { useState } from "react";
import { useCreateEntitlementVersion, useUpdateEntitlementVersion, useManageSkuRules, useSkuRulesForVersion, PlanEntitlementVersion } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MODEL_LABELS, RULE_OPTIONS, updatePlanVersion } from "./shared";

export function EntitlementEditor({ version, planId, skus, onUpdateVersion, onCreateVersion }: {
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
      await onUpdateVersion.mutateAsync({ id: version.id, updates: { status: "retired" } });
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

export function CreateFirstVersion({ planId, createVersion }: { planId: string; createVersion: ReturnType<typeof useCreateEntitlementVersion> }) {
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
