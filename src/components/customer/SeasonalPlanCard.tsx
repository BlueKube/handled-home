import { useSeasonalOrders, useCancelSeasonalOrder, type SeasonalOrder } from "@/hooks/useSeasonalOrders";
import { useSeasonalSelections, useUpsertSeasonalSelection } from "@/hooks/useSeasonalSelections";
import { useSeasonalTemplates } from "@/hooks/useSeasonalTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { getEffectiveWindows, formatWindowLabel } from "@/lib/seasonal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Leaf, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  propertyId: string | null | undefined;
  zoneId: string | null | undefined;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-accent/10 text-accent",
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  canceled: "bg-muted text-muted-foreground",
};

export function SeasonalPlanCard({ propertyId, zoneId }: Props) {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const { data: orders } = useSeasonalOrders(propertyId, year);
  const { data: selections } = useSeasonalSelections(propertyId, year);
  const { data: templates } = useSeasonalTemplates(zoneId);
  const upsertSelection = useUpsertSeasonalSelection();
  const cancelOrder = useCancelSeasonalOrder();

  const activeOrders = (orders ?? []).filter((o) => o.status !== "canceled");
  if (activeOrders.length === 0) return null;

  const templateMap = new Map((templates ?? []).map((t) => [t.id, t]));
  const selectionMap = new Map((selections ?? []).map((s) => [s.seasonal_template_id, s]));

  const handleSkip = async (order: SeasonalOrder) => {
    if (!user || !propertyId || !zoneId) return;
    try {
      await cancelOrder.mutateAsync(order.id);
      await upsertSelection.mutateAsync({
        customer_id: user.id,
        property_id: propertyId,
        zone_id: zoneId,
        seasonal_template_id: order.seasonal_template_id,
        selection_state: "off",
        window_preference: selectionMap.get(order.seasonal_template_id)?.window_preference ?? "mid",
        year,
      });
      toast.success("Skipped for this year");
    } catch {
      toast.error("Could not skip");
    }
  };

  const handlePreferenceChange = async (order: SeasonalOrder, pref: "early" | "mid" | "late") => {
    if (!user || !propertyId || !zoneId) return;
    try {
      await upsertSelection.mutateAsync({
        customer_id: user.id,
        property_id: propertyId,
        zone_id: zoneId,
        seasonal_template_id: order.seasonal_template_id,
        selection_state: selectionMap.get(order.seasonal_template_id)?.selection_state ?? "upsell",
        window_preference: pref,
        year,
      });
    } catch {
      toast.error("Could not update preference");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Leaf className="h-4 w-4 text-accent" />
          Seasonal Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeOrders.map((order) => {
          const template = templateMap.get(order.seasonal_template_id);
          const selection = selectionMap.get(order.seasonal_template_id);
          const name = template?.name ?? template?.sku_name ?? "Seasonal Service";
          const effectiveWindows = template
            ? getEffectiveWindows(template.default_windows, template.zone_rule?.windows_override)
            : [];
          const windowLabel = formatWindowLabel(effectiveWindows);
          const pref = selection?.window_preference ?? "mid";

          return (
            <div key={order.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{name}</p>
                <Badge className={`text-[10px] ${STATUS_COLORS[order.status] ?? ""}`}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {windowLabel && <span>{windowLabel}</span>}
                {order.price_cents > 0 && <span>${(order.price_cents / 100).toFixed(0)}</span>}
                {order.price_cents === 0 && <Badge variant="outline" className="text-[10px]">Included</Badge>}
              </div>
              {order.status === "planned" && (
                <div className="flex items-center gap-2">
                  <ToggleGroup
                    type="single"
                    value={pref}
                    onValueChange={(v) => v && handlePreferenceChange(order, v as "early" | "mid" | "late")}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="early" className="text-[10px] h-6 px-2">Early</ToggleGroupItem>
                    <ToggleGroupItem value="mid" className="text-[10px] h-6 px-2">Mid</ToggleGroupItem>
                    <ToggleGroupItem value="late" className="text-[10px] h-6 px-2">Late</ToggleGroupItem>
                  </ToggleGroup>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 text-muted-foreground"
                    onClick={() => handleSkip(order)}
                  >
                    <X className="h-3 w-3 mr-0.5" /> Skip
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
