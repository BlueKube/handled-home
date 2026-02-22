import { useMemo } from "react";
import type { RoutineItem } from "./useRoutine";

export interface WeekPreview {
  weekNumber: number;
  label: string;
  items: { skuId: string; skuName: string; cadence: string }[];
}

/**
 * Computes a 4-week preview from routine items + cadences.
 * Biweekly pattern A = weeks 1,3. Pattern B = weeks 2,4.
 */
export function useRoutinePreview(items: RoutineItem[]): WeekPreview[] {
  return useMemo(() => {
    const weeks: WeekPreview[] = [
      { weekNumber: 1, label: "Week 1", items: [] },
      { weekNumber: 2, label: "Week 2", items: [] },
      { weekNumber: 3, label: "Week 3", items: [] },
      { weekNumber: 4, label: "Week 4", items: [] },
    ];

    for (const item of items) {
      const name = item.sku_name ?? "Service";
      const cadenceLabel = CADENCE_LABELS[item.cadence_type] ?? item.cadence_type;

      switch (item.cadence_type) {
        case "weekly":
          weeks.forEach((w) => w.items.push({ skuId: item.sku_id, skuName: name, cadence: cadenceLabel }));
          break;
        case "biweekly": {
          const pattern = (item.cadence_detail as any)?.pattern ?? "A";
          const activeWeeks = pattern === "B" ? [1, 3] : [0, 2]; // 0-indexed
          activeWeeks.forEach((i) => weeks[i]?.items.push({ skuId: item.sku_id, skuName: name, cadence: cadenceLabel }));
          break;
        }
        case "four_week":
          weeks[0]?.items.push({ skuId: item.sku_id, skuName: name, cadence: cadenceLabel });
          break;
        case "monthly":
          weeks[0]?.items.push({ skuId: item.sku_id, skuName: name, cadence: cadenceLabel });
          break;
        case "quarterly":
          // Only appears in week 1 of the first cycle
          weeks[0]?.items.push({ skuId: item.sku_id, skuName: name, cadence: cadenceLabel });
          break;
      }
    }

    return weeks;
  }, [items]);
}

export const CADENCE_LABELS: Record<string, string> = {
  weekly: "Every week",
  biweekly: "Every other week",
  four_week: "Every 4 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export function cadenceToWeeklyEquivalent(cadence: string): number {
  switch (cadence) {
    case "weekly": return 1;
    case "biweekly": return 0.5;
    case "four_week": return 0.25;
    case "monthly": return 0.25;
    case "quarterly": return 0.083;
    default: return 1;
  }
}

export function computeTotalDemand(items: RoutineItem[]): number {
  return items.reduce((sum, item) => sum + cadenceToWeeklyEquivalent(item.cadence_type), 0);
}

export function computeCycleDemand(items: RoutineItem[]): number {
  return computeTotalDemand(items) * 4;
}
