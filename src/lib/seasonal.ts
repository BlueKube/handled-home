/**
 * Seasonal Services utility functions.
 * Handles window date computation and effective window resolution.
 */

export interface SeasonalWindow {
  start_mmdd: string; // "MM-DD"
  end_mmdd: string;   // "MM-DD"
}

export type WindowPreference = "early" | "mid" | "late";

/**
 * Compute planned window start/end dates for a seasonal selection.
 * Divides the full window into thirds based on preference.
 */
export function computeWindowDates(
  windows: SeasonalWindow[],
  preference: WindowPreference,
  year: number
): { start: Date; end: Date } | null {
  if (!windows || windows.length === 0) return null;

  // Use the first applicable window for the year
  const w = windows[0];
  const fullStart = parseMmdd(w.start_mmdd, year);
  const fullEnd = parseMmdd(w.end_mmdd, year);

  if (!fullStart || !fullEnd || fullEnd <= fullStart) return null;

  const totalDays = Math.round((fullEnd.getTime() - fullStart.getTime()) / (1000 * 60 * 60 * 24));
  const thirdDays = Math.floor(totalDays / 3);

  let start: Date;
  let end: Date;

  switch (preference) {
    case "early":
      start = fullStart;
      end = addDays(fullStart, thirdDays);
      break;
    case "mid":
      start = addDays(fullStart, thirdDays);
      end = addDays(fullStart, thirdDays * 2);
      break;
    case "late":
      start = addDays(fullStart, thirdDays * 2);
      end = fullEnd;
      break;
  }

  return { start, end };
}

/**
 * Get effective windows for a seasonal template, using zone override if present.
 */
export function getEffectiveWindows(
  templateWindows: SeasonalWindow[],
  zoneOverride?: SeasonalWindow[] | null
): SeasonalWindow[] {
  if (zoneOverride && zoneOverride.length > 0) return zoneOverride;
  return templateWindows ?? [];
}

/**
 * Format a window for display, e.g. "May–Jun"
 */
export function formatWindowLabel(windows: SeasonalWindow[]): string {
  if (!windows || windows.length === 0) return "";
  return windows.map((w) => {
    const startMonth = MONTH_SHORT[parseInt(w.start_mmdd.split("-")[0], 10) - 1];
    const endMonth = MONTH_SHORT[parseInt(w.end_mmdd.split("-")[0], 10) - 1];
    return startMonth === endMonth ? startMonth : `${startMonth}–${endMonth}`;
  }).join(", ");
}

/**
 * Get month index (0-11) from MM-DD string
 */
export function getMonthFromMmdd(mmdd: string): number {
  return parseInt(mmdd.split("-")[0], 10) - 1;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_LABELS = MONTH_SHORT;

function parseMmdd(mmdd: string, year: number): Date | null {
  const parts = mmdd.split("-");
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  return new Date(year, month, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
