import { describe, it, expect } from "vitest";
import {
  shouldShowGrowthCard,
  nextDismissUntil,
  parseStoredDate,
} from "@/lib/growthRateLimit";

const day = (d: number) => new Date(2026, 0, d, 12, 0, 0); // local-tz noon, day-of-month
const ms = (n: number) => n * 24 * 60 * 60 * 1000;

describe("shouldShowGrowthCard", () => {
  it("shows on first ever render (no lastShown, no dismissed)", () => {
    expect(
      shouldShowGrowthCard({ now: day(1), lastShownAt: null, dismissedUntil: null })
    ).toBe(true);
  });

  it("hides within 7 days of lastShownAt", () => {
    expect(
      shouldShowGrowthCard({
        now: day(5),
        lastShownAt: day(1),
        dismissedUntil: null,
      })
    ).toBe(false);
  });

  it("shows again 8+ days after lastShownAt", () => {
    expect(
      shouldShowGrowthCard({
        now: day(10),
        lastShownAt: day(1),
        dismissedUntil: null,
      })
    ).toBe(true);
  });

  it("hides while dismissedUntil is still in the future", () => {
    expect(
      shouldShowGrowthCard({
        now: day(10),
        lastShownAt: null,
        dismissedUntil: day(20),
      })
    ).toBe(false);
  });

  it("shows after dismissedUntil has passed (and lastShown is also stale)", () => {
    expect(
      shouldShowGrowthCard({
        now: day(20),
        lastShownAt: day(1),
        dismissedUntil: day(15),
      })
    ).toBe(true);
  });

  it("dismiss cooldown overrides any lastShown signal", () => {
    expect(
      shouldShowGrowthCard({
        now: day(20),
        lastShownAt: day(15), // less than 7d ago
        dismissedUntil: day(28),
      })
    ).toBe(false);
  });
});

describe("nextDismissUntil", () => {
  it("returns an ISO 14 days after the given time", () => {
    const now = new Date("2026-04-01T00:00:00.000Z");
    const got = new Date(nextDismissUntil(now));
    expect(got.getTime() - now.getTime()).toBe(ms(14));
  });
});

describe("parseStoredDate", () => {
  it("returns null for null input", () => {
    expect(parseStoredDate(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseStoredDate("")).toBeNull();
  });

  it("returns null for garbage strings", () => {
    expect(parseStoredDate("not a date")).toBeNull();
    expect(parseStoredDate("{}")).toBeNull();
  });

  it("parses a valid ISO timestamp", () => {
    const d = parseStoredDate("2026-04-22T15:30:00.000Z");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2026-04-22T15:30:00.000Z");
  });
});
