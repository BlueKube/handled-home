export type VisitMode = "preview" | "live" | "complete";

export interface VisitModeJob {
  status: string;
  scheduled_date: string | null;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * ONE_HOUR_MS;

/**
 * Pure helper that classifies a job into one of the three VisitDetail modes.
 *
 * Status values match the `jobs.status` CHECK constraint in
 * `supabase/migrations/20260222090152_…sql`:
 *   ('NOT_STARTED','IN_PROGRESS','ISSUE_REPORTED','PARTIAL_COMPLETE','COMPLETED','CANCELED')
 *
 * Rules (evaluated in order):
 *   1. status ∈ {COMPLETED, CANCELED} → "complete" (terminal — show receipt /
 *      whatever the existing receipt page renders for cancelled jobs).
 *   2. status ∈ {IN_PROGRESS, ISSUE_REPORTED, PARTIAL_COMPLETE} → "live"
 *      (provider has started; visit is mid-flight or paused).
 *   3. status === "NOT_STARTED" AND scheduled_date is within `[-2h, +1h]` of
 *      `now` → "live" (the visit window is open or only just-overdue; treat as
 *      currently happening rather than stuck-in-the-past preview).
 *   4. status === "NOT_STARTED" otherwise → "preview".
 *   5. Any unexpected status → "complete" (defensive fallback: preserves the
 *      legacy "receipt page with status-badge override" behavior the original
 *      VisitDetail used for unknown states).
 */
export function getVisitMode(job: VisitModeJob, now: Date = new Date()): VisitMode {
  if (job.status === "COMPLETED" || job.status === "CANCELED") return "complete";
  if (
    job.status === "IN_PROGRESS" ||
    job.status === "ISSUE_REPORTED" ||
    job.status === "PARTIAL_COMPLETE"
  ) {
    return "live";
  }
  if (job.status === "NOT_STARTED") {
    if (!job.scheduled_date) return "preview";
    const scheduledAt = new Date(job.scheduled_date).getTime();
    if (Number.isNaN(scheduledAt)) return "preview";
    const diffMs = scheduledAt - now.getTime();
    // Live window: scheduled within the next hour OR up to 2 hours overdue.
    // Anything beyond -2h is considered abandoned/stuck — fall back to preview
    // so the customer at least sees what was supposed to happen rather than a
    // perpetual "in progress" view.
    if (diffMs <= ONE_HOUR_MS && diffMs >= -TWO_HOURS_MS) return "live";
    return "preview";
  }
  return "complete";
}
