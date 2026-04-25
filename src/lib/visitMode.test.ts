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
      label: "CANCELED → complete (terminal state, single L per DB enum)",
      job: { status: "CANCELED", scheduled_date: HOURS_FROM_NOW(-12) },
      expected: "complete",
    },
    {
      label: "IN_PROGRESS → live (regardless of scheduled_date)",
      job: { status: "IN_PROGRESS", scheduled_date: HOURS_FROM_NOW(-1) },
      expected: "live",
    },
    {
      label: "ISSUE_REPORTED → live (mid-flight paused state)",
      job: { status: "ISSUE_REPORTED", scheduled_date: HOURS_FROM_NOW(0) },
      expected: "live",
    },
    {
      label: "PARTIAL_COMPLETE → live (provider stopped early; not finished)",
      job: { status: "PARTIAL_COMPLETE", scheduled_date: HOURS_FROM_NOW(-2) },
      expected: "live",
    },
    {
      label: "NOT_STARTED + scheduled within +1h → live (boundary: exactly +1h)",
      job: { status: "NOT_STARTED", scheduled_date: HOURS_FROM_NOW(1) },
      expected: "live",
    },
    {
      label: "NOT_STARTED + 30min out → live",
      job: { status: "NOT_STARTED", scheduled_date: HOURS_FROM_NOW(0.5) },
      expected: "live",
    },
    {
      label: "NOT_STARTED + 1h overdue → live (within -2h window)",
      job: { status: "NOT_STARTED", scheduled_date: HOURS_FROM_NOW(-1) },
      expected: "live",
    },
    {
      label: "NOT_STARTED + exactly 2h overdue → live (boundary: -2h)",
      job: { status: "NOT_STARTED", scheduled_date: HOURS_FROM_NOW(-2) },
      expected: "live",
    },
    {
      label: "NOT_STARTED + 2h+1ms overdue → preview (stuck/abandoned, not live)",
      job: {
        status: "NOT_STARTED",
        scheduled_date: new Date(
          NOW.getTime() - 2 * 60 * 60 * 1000 - 1
        ).toISOString(),
      },
      expected: "preview",
    },
    {
      label: "NOT_STARTED + 1h+1ms out → preview (just past the live window)",
      job: {
        status: "NOT_STARTED",
        scheduled_date: new Date(
          NOW.getTime() + 60 * 60 * 1000 + 1
        ).toISOString(),
      },
      expected: "preview",
    },
    {
      label: "NOT_STARTED + 24h out → preview",
      job: { status: "NOT_STARTED", scheduled_date: HOURS_FROM_NOW(24) },
      expected: "preview",
    },
    {
      label: "NOT_STARTED with null scheduled_date → preview",
      job: { status: "NOT_STARTED", scheduled_date: null },
      expected: "preview",
    },
    {
      label: "NOT_STARTED with malformed scheduled_date → preview",
      job: { status: "NOT_STARTED", scheduled_date: "not-a-date" },
      expected: "preview",
    },
    {
      label: "Unknown status → complete (defensive fallback)",
      job: { status: "PENDING", scheduled_date: HOURS_FROM_NOW(2) },
      expected: "complete",
    },
  ] as const)("$label", ({ job, expected }) => {
    expect(getVisitMode(job, NOW)).toBe(expected);
  });

  it("uses Date.now() default when no `now` argument is supplied", () => {
    const result = getVisitMode({
      status: "NOT_STARTED",
      scheduled_date: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    });
    expect(["preview", "live", "complete"]).toContain(result);
  });
});
