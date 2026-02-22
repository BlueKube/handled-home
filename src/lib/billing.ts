/**
 * Billing utility functions for the dual-clock model:
 * - 28-day billing cycles
 * - Zone-anchored weekly service weeks
 */

export interface BillingCycle {
  start: Date;
  end: Date;
  nextBillingAt: Date;
}

export interface ServiceWeek {
  currentStart: Date;
  currentEnd: Date;
  nextStart: Date;
  nextEnd: Date;
}

/**
 * Compute a billing cycle from a start date.
 * @param startUtc - The billing cycle start (UTC)
 * @param lengthDays - Cycle length in days (default 28)
 */
export function computeBillingCycle(startUtc: Date, lengthDays = 28): BillingCycle {
  const start = new Date(startUtc);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + lengthDays);
  return { start, end, nextBillingAt: new Date(end) };
}

/**
 * Compute the current and next service week from a zone's anchor day.
 * @param anchorDay - Day of week (0=Sun, 1=Mon, ..., 6=Sat)
 * @param _anchorTimeLocal - Anchor time (reserved for future use)
 * @param nowUtc - Current timestamp (UTC)
 */
export function computeServiceWeek(
  anchorDay: number,
  _anchorTimeLocal: string,
  nowUtc: Date,
): ServiceWeek {
  const now = new Date(nowUtc);
  const currentDow = now.getUTCDay(); // 0=Sun
  // Days since last anchor day
  let daysSinceAnchor = (currentDow - anchorDay + 7) % 7;

  const currentStart = new Date(now);
  currentStart.setUTCDate(currentStart.getUTCDate() - daysSinceAnchor);
  currentStart.setUTCHours(0, 0, 0, 0);

  const currentEnd = new Date(currentStart);
  currentEnd.setUTCDate(currentEnd.getUTCDate() + 7);

  const nextStart = new Date(currentEnd);
  const nextEnd = new Date(nextStart);
  nextEnd.setUTCDate(nextEnd.getUTCDate() + 7);

  return { currentStart, currentEnd, nextStart, nextEnd };
}

/**
 * Format a date range as "Mon d – Mon d" for display.
 */
export function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}
