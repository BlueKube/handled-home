import { useSeasonalOrders, type SeasonalOrder } from "@/hooks/useSeasonalOrders";
import { useSeasonalTemplates } from "@/hooks/useSeasonalTemplates";
import { getEffectiveWindows, getMonthFromMmdd, MONTH_LABELS, type SeasonalWindow } from "@/lib/seasonal";

interface Props {
  propertyId: string | null | undefined;
  zoneId: string | null | undefined;
}

export function SeasonalYearStrip({ propertyId, zoneId }: Props) {
  const year = new Date().getFullYear();
  const { data: orders } = useSeasonalOrders(propertyId, year);
  const { data: templates } = useSeasonalTemplates(zoneId);

  const activeOrders = (orders ?? []).filter((o) => o.status !== "canceled");
  if (activeOrders.length === 0) return null;

  // Build a map: month index → list of order labels
  const monthMap = new Map<number, string[]>();
  for (const order of activeOrders) {
    if (!order.planned_window_start || !order.planned_window_end) continue;
    const startMonth = new Date(order.planned_window_start).getMonth();
    const endMonth = new Date(order.planned_window_end).getMonth();
    const template = templates?.find((t) => t.id === order.seasonal_template_id);
    const name = template?.name ?? template?.sku_name ?? "Service";
    // Get preference from dates
    const pref = getPreferenceLabel(order, template);

    for (let m = startMonth; m <= endMonth; m++) {
      const list = monthMap.get(m) ?? [];
      if (m === startMonth) {
        list.push(`${name} (${pref})`);
      }
      monthMap.set(m, list);
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-caption uppercase tracking-wider">Next 12 Months — Seasonal</h3>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {MONTH_LABELS.map((label, i) => {
          const items = monthMap.get(i);
          const hasItem = items && items.length > 0;
          return (
            <div
              key={i}
              className={`flex-shrink-0 w-16 rounded-lg p-1.5 text-center border ${
                hasItem ? "bg-accent/10 border-accent/30" : "bg-muted/30 border-border"
              }`}
            >
              <p className={`text-[10px] font-medium ${hasItem ? "text-accent" : "text-muted-foreground"}`}>
                {label}
              </p>
              {hasItem && (
                <p className="text-[8px] text-accent/80 mt-0.5 line-clamp-2">{items[0]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getPreferenceLabel(
  order: SeasonalOrder,
  template: { default_windows: SeasonalWindow[]; zone_rule?: { windows_override: SeasonalWindow[] | null } | null } | undefined
): string {
  if (!template || !order.planned_window_start) return "Mid";
  const windows = getEffectiveWindows(template.default_windows, template.zone_rule?.windows_override);
  if (!windows.length) return "Mid";
  const w = windows[0];
  const startMonth = getMonthFromMmdd(w.start_mmdd);
  const orderStartMonth = new Date(order.planned_window_start).getMonth();
  const endMonth = getMonthFromMmdd(w.end_mmdd);
  const totalMonths = endMonth - startMonth + 1;
  const offset = orderStartMonth - startMonth;
  if (offset <= totalMonths / 3) return "Early";
  if (offset <= (totalMonths * 2) / 3) return "Mid";
  return "Late";
}
