import { describe, it, expect } from "vitest";
import { getVisitMode } from "./visitMode";

const NOW = new Date("2026-04-25T12:00:00Z");
const HOURS_FROM_NOW = (h: number) =>
  new Date(NOW.getTime() + h * 60 * 60 * 1000).toISOString();

describe("getVisitMode", () => {
  it.each([
    {
      label: "COMPLETED → complete (regardless of scheduled_date)",
      job: { status: "COMPLETED", scheduled_date: HOURS_FROM_NOW(-72) },
      expected: "complete",
    },
    {
      label: "IN_PROGRESS → live",
      job: { status: "IN_PROGRESS", scheduled_date: HOURS_FROM_NOW(-1) },
      expected: "live",
    },
    {
      label: "SCHEDULED within +1h → live (boundary: exactly 1h)",
      job: { status: "SCHEDULED", scheduled_date: HOURS_FROM_NOW(1) },
      expected: "live",
    },
    {
      label: "SCHEDULED 30min out → live",
      job: { status: "SCHEDULED", scheduled_date: HOURS_FROM_NOW(0.5) },
      expected: "live",
    },
    {
      label: "SCHEDULED >1h out → preview (boundary: 1h + 1ms)",
      job: {
        status: "SCHEDULED",
        scheduled_date: new Date(
          NOW.getTime() + 60 * 60 * 1000 + 1
        ).toISOString(),
      },
      expected: "preview",
    },
    {
      label: "SCHEDULED 24h out → preview",
      job: { status: "SCHEDULED", scheduled_date: HOURS_FROM_NOW(24) },
      expected: "preview",
    },
    {
      label: "SCHEDULED with null scheduled_date → preview",
      job: { status: "SCHEDULED", scheduled_date: null },
      expected: "preview",
    },
    {
      label: "SCHEDULED with malformed scheduled_date → preview",
      job: { status: "SCHEDULED", scheduled_date: "not-a-date" },
      expected: "preview",
    },
    {
      label: "CANCELLED → complete (closest-existing semantics)",
      job: { status: "CANCELLED", scheduled_date: HOURS_FROM_NOW(-12) },
      expected: "complete",
    },
    {
      label: "NO_SHOW → complete",
      job: { status: "NO_SHOW", scheduled_date: HOURS_FROM_NOW(-2) },
      expected: "complete",
    },
    {
      label: "PENDING (unknown status) → complete fallback",
      job: { status: "PENDING", scheduled_date: HOURS_FROM_NOW(2) },
      expected: "complete",
    },
  ] as const)("$label", ({ job, expected }) => {
    expect(getVisitMode(job, NOW)).toBe(expected);
  });

  it("uses Date.now() default when no `now` argument is supplied", () => {
    // Smoke test only — the function must not throw and must return a valid mode.
    const result = getVisitMode({
      status: "SCHEDULED",
      scheduled_date: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    });
    expect(["preview", "live", "complete"]).toContain(result);
  });
});
