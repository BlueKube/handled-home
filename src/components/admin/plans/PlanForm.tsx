import { useZones } from "@/hooks/useZones";
import { useSkus } from "@/hooks/useSkus";
import { Plan, usePlanZoneAvailability, usePlanEntitlementVersions, useUpdateZoneAvailability, useCreateEntitlementVersion, useUpdateEntitlementVersion } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, Package } from "lucide-react";
import { PlanHandlesEditor } from "./PlanHandlesEditor";
import { EntitlementEditor, CreateFirstVersion } from "./EntitlementEditor";

export function PlanForm({ plan, onChange, onSave, saving, planId }: {
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

      {/* Variant */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Variant</h3>
        <div className="space-y-2">
          <Label>Plan family</Label>
          <Select
            value={plan.plan_family ?? "__none__"}
            onValueChange={(v) => onChange({ ...plan, plan_family: v === "__none__" ? null : v })}
          >
            <SelectTrigger><SelectValue placeholder="— (unassigned)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— (unassigned)</SelectItem>
              {["legacy", "basic", "full", "premier"].map((f) => (
                <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Size tier</Label>
          <Select
            value={plan.size_tier != null ? String(plan.size_tier) : "__none__"}
            onValueChange={(v) => onChange({ ...plan, size_tier: v === "__none__" ? null : parseInt(v, 10) })}
          >
            <SelectTrigger><SelectValue placeholder="— (none)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— (none)</SelectItem>
              {[10, 20, 30, 40].map((t) => (
                <SelectItem key={t} value={String(t)}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Family + tier determine which variant <code>pick_plan_variant</code> returns. Legacy plans keep Essential/Plus/Premium.
        </p>
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

      {/* Handles Configuration */}
      {planId && <PlanHandlesEditor planId={planId} />}

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
