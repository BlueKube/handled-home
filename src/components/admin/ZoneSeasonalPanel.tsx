import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  zoneId: string;
}

interface TemplateWithRule {
  template_id: string;
  sku_id: string;
  template_name: string | null;
  sku_name: string;
  default_windows: any;
  is_active: boolean;
  rule_id: string | null;
  is_enabled: boolean;
  price_override_cents: number | null;
  windows_override: any | null;
}

export function ZoneSeasonalPanel({ zoneId }: Props) {
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["zone-seasonal-panel", zoneId],
    queryFn: async () => {
      // Fetch all active templates
      const { data: templates, error: tErr } = await supabase
        .from("seasonal_service_templates")
        .select("*")
        .eq("is_active", true);
      if (tErr) throw tErr;
      if (!templates || templates.length === 0) return [];

      const skuIds = [...new Set(templates.map((t) => t.sku_id))];
      const templateIds = templates.map((t) => t.id);

      const [skuRes, rulesRes] = await Promise.all([
        supabase.from("service_skus").select("id, name").in("id", skuIds),
        supabase.from("zone_seasonal_service_rules").select("*").eq("zone_id", zoneId).in("seasonal_template_id", templateIds),
      ]);

      const skuMap = new Map<string, string>();
      for (const s of skuRes.data ?? []) skuMap.set(s.id, s.name);

      const ruleMap = new Map<string, any>();
      for (const r of rulesRes.data ?? []) ruleMap.set(r.seasonal_template_id, r);

      return templates.map((t): TemplateWithRule => {
        const rule = ruleMap.get(t.id);
        return {
          template_id: t.id,
          sku_id: t.sku_id,
          template_name: t.name,
          sku_name: skuMap.get(t.sku_id) ?? "Unknown SKU",
          default_windows: t.default_windows,
          is_active: t.is_active,
          rule_id: rule?.id ?? null,
          is_enabled: rule?.is_enabled ?? false,
          price_override_cents: rule?.price_override_cents ?? null,
          windows_override: rule?.windows_override ?? null,
        };
      });
    },
  });

  const upsertRule = useMutation({
    mutationFn: async (params: {
      zone_id: string;
      seasonal_template_id: string;
      is_enabled: boolean;
      price_override_cents: number | null;
    }) => {
      const { error } = await supabase
        .from("zone_seasonal_service_rules")
        .upsert(
          {
            zone_id: params.zone_id,
            seasonal_template_id: params.seasonal_template_id,
            is_enabled: params.is_enabled,
            price_override_cents: params.price_override_cents,
          },
          { onConflict: "zone_id,seasonal_template_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zone-seasonal-panel", zoneId] });
      toast.success("Seasonal rule updated");
    },
    onError: () => toast.error("Could not update rule"),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 space-y-2">
        <Leaf className="h-6 w-6 mx-auto text-muted-foreground" />
        <p className="text-xs text-muted-foreground">No seasonal templates created yet.</p>
        <p className="text-[10px] text-muted-foreground">Create templates in the SKU catalog first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Enable or disable seasonal services for this zone. Override pricing as needed.
      </p>
      {items.map((item) => (
        <ZoneSeasonalRuleCard
          key={item.template_id}
          item={item}
          zoneId={zoneId}
          onToggle={(enabled) =>
            upsertRule.mutate({
              zone_id: zoneId,
              seasonal_template_id: item.template_id,
              is_enabled: enabled,
              price_override_cents: item.price_override_cents,
            })
          }
          onPriceChange={(cents) =>
            upsertRule.mutate({
              zone_id: zoneId,
              seasonal_template_id: item.template_id,
              is_enabled: item.is_enabled,
              price_override_cents: cents,
            })
          }
        />
      ))}
    </div>
  );
}

function ZoneSeasonalRuleCard({
  item,
  zoneId,
  onToggle,
  onPriceChange,
}: {
  item: TemplateWithRule;
  zoneId: string;
  onToggle: (enabled: boolean) => void;
  onPriceChange: (cents: number | null) => void;
}) {
  const [priceInput, setPriceInput] = useState(
    item.price_override_cents != null ? String(item.price_override_cents / 100) : ""
  );

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{item.template_name ?? item.sku_name}</p>
          <p className="text-[10px] text-muted-foreground">SKU: {item.sku_name}</p>
        </div>
        <Switch checked={item.is_enabled} onCheckedChange={onToggle} />
      </div>
      {item.is_enabled && (
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">Price override $</Label>
          <Input
            type="number"
            className="h-7 text-xs w-20"
            placeholder="—"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={() => {
              const val = parseFloat(priceInput);
              onPriceChange(isNaN(val) ? null : Math.round(val * 100));
            }}
          />
        </div>
      )}
    </Card>
  );
}
