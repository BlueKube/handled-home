import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SeasonalWindow } from "@/lib/seasonal";

export interface SeasonalTemplate {
  id: string;
  sku_id: string;
  name: string | null;
  description: string | null;
  default_windows: SeasonalWindow[];
  is_active: boolean;
  // From SKU join
  sku_name: string;
  sku_description: string;
  sku_duration_minutes: number;
  sku_base_price_cents: number;
  sku_required_photos: any[];
  sku_checklist: any[];
  // Zone rule (if present)
  zone_rule?: {
    is_enabled: boolean;
    price_override_cents: number | null;
    windows_override: SeasonalWindow[] | null;
    capacity_reserve_rule: any | null;
  } | null;
}

export function useSeasonalTemplates(zoneId: string | null | undefined) {
  return useQuery({
    queryKey: ["seasonal-templates", zoneId],
    enabled: !!zoneId,
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

      // Batch fetch SKUs and zone rules
      const [skuRes, rulesRes] = await Promise.all([
        supabase.from("service_skus").select("id, name, description, duration_minutes, base_price_cents, required_photos, checklist").in("id", skuIds),
        zoneId
          ? supabase.from("zone_seasonal_service_rules").select("*").eq("zone_id", zoneId).in("seasonal_template_id", templateIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const skuMap = new Map<string, any>();
      for (const s of skuRes.data ?? []) skuMap.set(s.id, s);

      const ruleMap = new Map<string, any>();
      for (const r of (rulesRes as any).data ?? []) ruleMap.set(r.seasonal_template_id, r);

      return templates
        .map((t): SeasonalTemplate | null => {
          const sku = skuMap.get(t.sku_id);
          if (!sku) return null;
          const rule = ruleMap.get(t.id);
          // If zone has a rule and it's disabled, exclude
          if (rule && !rule.is_enabled) return null;

          return {
            id: t.id,
            sku_id: t.sku_id,
            name: t.name,
            description: t.description,
            default_windows: (t.default_windows as unknown as SeasonalWindow[]) ?? [],
            is_active: t.is_active,
            sku_name: sku.name,
            sku_description: sku.description,
            sku_duration_minutes: sku.duration_minutes,
            sku_base_price_cents: sku.base_price_cents,
            sku_required_photos: sku.required_photos ?? [],
            sku_checklist: sku.checklist ?? [],
            zone_rule: rule
              ? {
                  is_enabled: rule.is_enabled,
                  price_override_cents: rule.price_override_cents,
                  windows_override: rule.windows_override as SeasonalWindow[] | null,
                  capacity_reserve_rule: rule.capacity_reserve_rule,
                }
              : null,
          };
        })
        .filter(Boolean) as SeasonalTemplate[];
    },
  });
}
