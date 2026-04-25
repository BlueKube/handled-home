export type VisitMode = "preview" | "live" | "complete";

export interface VisitModeJob {
  status: string;
  scheduled_date: string | null;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Pure helper that classifies a job into one of the three VisitDetail modes.
 *
 * Rules (evaluated in order):
 *   1. status === "COMPLETED" → "complete"
 *   2. status === "IN_PROGRESS" → "live"
 *   3. status === "SCHEDULED" AND scheduled_date is within +1h of `now` → "live"
 *   4. status === "SCHEDULED" otherwise → "preview"
 *   5. Any other status (CANCELLED, NO_SHOW, etc.) → "complete"
 *      Closest-existing semantics: those terminal states historically rendered
 *      the receipt page with a status-badge override. Keeping that surface
 *      avoids a fourth dead-end mode.
 */
export function getVisitMode(job: VisitModeJob, now: Date = new Date()): VisitMode {
  if (job.status === "COMPLETED") return "complete";
  if (job.status === "IN_PROGRESS") return "live";
  if (job.status === "SCHEDULED") {
    if (!job.scheduled_date) return "preview";
    const scheduledAt = new Date(job.scheduled_date).getTime();
    if (Number.isNaN(scheduledAt)) return "preview";
    if (scheduledAt - now.getTime() <= ONE_HOUR_MS) return "live";
    return "preview";
  }
  return "complete";
}
