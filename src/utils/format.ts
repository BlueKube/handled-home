/**
 * Format an integer amount in cents to a display currency string.
 * Handles negative values correctly: -500 → "-$5.00" (not "$-5.00").
 */
export function formatCents(cents: number): string {
  if (cents < 0) {
    return `-$${(Math.abs(cents) / 100).toFixed(2)}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}
