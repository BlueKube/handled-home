const SHOWN_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Pure rate-limit gate. Returns true when no cooldown is active.
 * `now`, `lastShownAt`, `dismissedUntil` are caller-supplied so this
 * can be unit-tested without time mocking.
 */
export function shouldShowGrowthCard({
  now,
  lastShownAt,
  dismissedUntil,
}: {
  now: Date;
  lastShownAt: Date | null;
  dismissedUntil: Date | null;
}): boolean {
  if (dismissedUntil && now < dismissedUntil) return false;
  if (lastShownAt && now.getTime() - lastShownAt.getTime() < SHOWN_COOLDOWN_MS) {
    return false;
  }
  return true;
}

/** ISO timestamp 14 days from `now`. */
export function nextDismissUntil(now: Date): string {
  return new Date(now.getTime() + DISMISS_COOLDOWN_MS).toISOString();
}

/** Parse an ISO string from storage; null on missing or malformed input. */
export function parseStoredDate(raw: string | null): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
