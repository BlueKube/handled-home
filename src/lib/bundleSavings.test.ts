import { describe, it, expect } from "vitest";
import { computeBundleSavings } from "./bundleSavings";

describe("computeBundleSavings", () => {
  it("returns 120 saved / 18% on the Fall Prep example numbers", () => {
    expect(computeBundleSavings({ totalCredits: 540, separateCredits: 660 })).toEqual({
      saveCredits: 120,
      savePercent: 18,
    });
  });

  it("returns zero savings when total equals separate", () => {
    expect(computeBundleSavings({ totalCredits: 540, separateCredits: 540 })).toEqual({
      saveCredits: 0,
      savePercent: 0,
    });
  });

  it("rounds savePercent to the nearest integer", () => {
    // 100 / 333 = 30.03% → 30%
    expect(computeBundleSavings({ totalCredits: 233, separateCredits: 333 })).toEqual({
      saveCredits: 100,
      savePercent: 30,
    });
  });

  it("throws when separate < total (defensive — DB constraint blocks it)", () => {
    expect(() =>
      computeBundleSavings({ totalCredits: 540, separateCredits: 400 }),
    ).toThrow(/Invalid bundle pricing/);
  });

  it("handles zero-zero gracefully", () => {
    expect(computeBundleSavings({ totalCredits: 0, separateCredits: 0 })).toEqual({
      saveCredits: 0,
      savePercent: 0,
    });
  });
});
