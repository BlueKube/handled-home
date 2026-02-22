import { useMemo } from "react";
import type { RoutineItem } from "./useRoutine";
import type { CustomerJob } from "./useCustomerJobs";

export interface PreviewVisit {
  type: "routine" | "seasonal" | "add-on";
  serviceSummary: string;
  status: "planned" | "in_progress" | "completed" | "issue";
  jobId?: string;
  skuIds: string[];
}

export interface PreviewWeek {
  weekNumber: number;
  label: string;
  visits: PreviewVisit[];
}

/**
 * Builds a 4-week preview from active routine items and existing jobs.
 * Client-side computation (no DB table needed for MVP).
 */
export function useFourWeekPreview(
  routineItems: RoutineItem[],
  serviceDayConfirmed: boolean,
  upcomingJobs: CustomerJob[]
): PreviewWeek[] {
  return useMemo(() => {
    const weeks: PreviewWeek[] = [
      { weekNumber: 1, label: "This Week", visits: [] },
      { weekNumber: 2, label: "Next Week", visits: [] },
      { weekNumber: 3, label: "Week 3", visits: [] },
      { weekNumber: 4, label: "Week 4", visits: [] },
    ];

    if (!serviceDayConfirmed || routineItems.length === 0) {
      return weeks;
    }

    // Build weekly routine visits from cadence rules
    for (const item of routineItems) {
      const name = item.sku_name ?? "Service";

      switch (item.cadence_type) {
        case "weekly":
          weeks.forEach((w) => addToWeek(w, name, item.sku_id));
          break;
        case "biweekly": {
          const pattern = (item.cadence_detail as any)?.pattern ?? "A";
          const activeWeeks = pattern === "B" ? [1, 3] : [0, 2]; // 0-indexed
          activeWeeks.forEach((i) => {
            if (weeks[i]) addToWeek(weeks[i], name, item.sku_id);
          });
          break;
        }
        case "four_week":
        case "monthly":
          addToWeek(weeks[0], name, item.sku_id);
          break;
        case "quarterly":
          addToWeek(weeks[0], name, item.sku_id);
          break;
      }
    }

    // Consolidate: merge all routine items per week into a single routine visit
    for (const week of weeks) {
      if (week.visits.length > 0) {
        const allSkus = week.visits.flatMap((v) => v.skuIds);
        const allNames = week.visits.map((v) => v.serviceSummary);
        week.visits = [
          {
            type: "routine",
            serviceSummary: allNames.join(", "),
            status: "planned",
            skuIds: allSkus,
          },
        ];
      }
    }

    // Overlay actual jobs: place in the correct week based on scheduled_date
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);

    for (const job of upcomingJobs) {
      const jobStatus = mapJobStatus(job.status);
      const skuSummary = job.skus.map((s) => s.sku_name_snapshot ?? "Service").join(", ");

      let weekIndex = 0;
      if (job.scheduled_date) {
        const jobDate = new Date(job.scheduled_date + "T00:00:00");
        const diffDays = Math.floor((jobDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
        weekIndex = Math.floor(diffDays / 7);
      }

      // Only overlay if within the 4-week window
      if (weekIndex < 0 || weekIndex > 3) continue;

      const targetWeek = weeks[weekIndex];
      if (targetWeek && targetWeek.visits.length > 0) {
        targetWeek.visits[0].status = jobStatus;
        targetWeek.visits[0].jobId = job.id;
        if (skuSummary) targetWeek.visits[0].serviceSummary = skuSummary;
      }
    }

    return weeks;
  }, [routineItems, serviceDayConfirmed, upcomingJobs]);
}

function addToWeek(week: PreviewWeek, skuName: string, skuId: string) {
  week.visits.push({
    type: "routine",
    serviceSummary: skuName,
    status: "planned",
    skuIds: [skuId],
  });
}

function mapJobStatus(status: string): PreviewVisit["status"] {
  switch (status) {
    case "COMPLETED":
    case "PARTIAL_COMPLETE":
      return "completed";
    case "IN_PROGRESS":
      return "in_progress";
    case "ISSUE_REPORTED":
      return "issue";
    default:
      return "planned";
  }
}
