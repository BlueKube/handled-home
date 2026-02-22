import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSeasonalTemplates, type SeasonalTemplate } from "@/hooks/useSeasonalTemplates";
import { useSeasonalSelections, useUpsertSeasonalSelection } from "@/hooks/useSeasonalSelections";
import { useUpsertSeasonalOrder, useCancelSeasonalOrder, useSeasonalOrders } from "@/hooks/useSeasonalOrders";
import { getEffectiveWindows, formatWindowLabel } from "@/lib/seasonal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Camera, CheckSquare, Leaf } from "lucide-react";
import { toast } from "sonner";

interface Props {
  propertyId: string | null | undefined;
  zoneId: string | null | undefined;
}

export function SeasonalBoostsSection({ propertyId, zoneId }: Props) {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const { data: templates, isLoading } = useSeasonalTemplates(zoneId);
  const { data: selections } = useSeasonalSelections(propertyId, year);
  const { data: orders } = useSeasonalOrders(propertyId, year);
  const upsertSelection = useUpsertSeasonalSelection();
  const upsertOrder = useUpsertSeasonalOrder();
  const cancelOrder = useCancelSeasonalOrder();

  if (isLoading || !templates || templates.length === 0) return null;

  const selectionMap = new Map(
    (selections ?? []).map((s) => [s.seasonal_template_id, s])
  );
  const orderMap = new Map(
    (orders ?? []).map((o) => [o.seasonal_template_id, o])
  );

  const handleToggle = async (template: SeasonalTemplate, turnOn: boolean) => {
    if (!user || !propertyId || !zoneId) return;

    const priceCents = template.zone_rule?.price_override_cents ?? template.sku_base_price_cents;
    const currentSelection = selectionMap.get(template.id);
    const preference = currentSelection?.window_preference ?? "mid";

    try {
      await upsertSelection.mutateAsync({
        customer_id: user.id,
        property_id: propertyId,
        zone_id: zoneId,
        seasonal_template_id: template.id,
        selection_state: turnOn ? "upsell" : "off",
        window_preference: preference,
        year,
      });

      if (turnOn) {
        const effectiveWindows = getEffectiveWindows(template.default_windows, template.zone_rule?.windows_override);
        await upsertOrder.mutateAsync({
          customer_id: user.id,
          property_id: propertyId,
          zone_id: zoneId,
          seasonal_template_id: template.id,
          year,
          pricing_type: "upsell",
          price_cents: priceCents,
          template_windows: effectiveWindows,
          window_preference: preference,
        });
        toast.success(`${template.name ?? template.sku_name} added to your seasonal plan`);
      } else {
        const order = orderMap.get(template.id);
        if (order && order.status === "planned") {
          await cancelOrder.mutateAsync(order.id);
        }
        toast.success(`${template.name ?? template.sku_name} removed`);
      }
    } catch {
      toast.error("Could not update seasonal selection");
    }
  };

  const handlePreferenceChange = async (template: SeasonalTemplate, pref: "early" | "mid" | "late") => {
    if (!user || !propertyId || !zoneId) return;
    const currentSelection = selectionMap.get(template.id);
    try {
      await upsertSelection.mutateAsync({
        customer_id: user.id,
        property_id: propertyId,
        zone_id: zoneId,
        seasonal_template_id: template.id,
        selection_state: currentSelection?.selection_state ?? "upsell",
        window_preference: pref,
        year,
      });
      // Update order window dates
      const effectiveWindows = getEffectiveWindows(template.default_windows, template.zone_rule?.windows_override);
      const priceCents = template.zone_rule?.price_override_cents ?? template.sku_base_price_cents;
      await upsertOrder.mutateAsync({
        customer_id: user.id,
        property_id: propertyId,
        zone_id: zoneId,
        seasonal_template_id: template.id,
        year,
        pricing_type: currentSelection?.selection_state === "included" ? "included" : "upsell",
        price_cents: currentSelection?.selection_state === "included" ? 0 : priceCents,
        template_windows: effectiveWindows,
        window_preference: pref,
      });
    } catch {
      toast.error("Could not update preference");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-accent" />
        <h3 className="text-caption uppercase tracking-wider">Seasonal Boosts</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        One-time services scheduled in a window that works for you.
      </p>

      {templates.map((template) => {
        const selection = selectionMap.get(template.id);
        const isOn = selection && selection.selection_state !== "off";
        const pref = selection?.window_preference ?? "mid";
        const effectiveWindows = getEffectiveWindows(template.default_windows, template.zone_rule?.windows_override);
        const windowLabel = formatWindowLabel(effectiveWindows);
        const priceCents = template.zone_rule?.price_override_cents ?? template.sku_base_price_cents;
        const photoCount = Array.isArray(template.sku_required_photos) ? template.sku_required_photos.length : 0;
        const checkCount = Array.isArray(template.sku_checklist) ? template.sku_checklist.length : 0;

        return (
          <Card key={template.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{template.name ?? template.sku_name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {template.description ?? template.sku_description}
                </p>
              </div>
              <Switch checked={!!isOn} onCheckedChange={(on) => handleToggle(template, on)} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {windowLabel && <Badge variant="outline" className="text-[10px]">{windowLabel}</Badge>}
              <span>${(priceCents / 100).toFixed(0)}</span>
              {template.sku_duration_minutes > 0 && <span>~{template.sku_duration_minutes} min</span>}
              {photoCount > 0 && (
                <span className="flex items-center gap-0.5"><Camera className="h-3 w-3" /> {photoCount}</span>
              )}
              {checkCount > 0 && (
                <span className="flex items-center gap-0.5"><CheckSquare className="h-3 w-3" /> {checkCount}</span>
              )}
            </div>

            {isOn && (
              <div className="pt-1">
                <p className="text-[10px] text-muted-foreground mb-1">Window preference</p>
                <ToggleGroup
                  type="single"
                  value={pref}
                  onValueChange={(v) => v && handlePreferenceChange(template, v as "early" | "mid" | "late")}
                  className="justify-start"
                >
                  <ToggleGroupItem value="early" className="text-xs h-7 px-3">Early</ToggleGroupItem>
                  <ToggleGroupItem value="mid" className="text-xs h-7 px-3">Mid</ToggleGroupItem>
                  <ToggleGroupItem value="late" className="text-xs h-7 px-3">Late</ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
