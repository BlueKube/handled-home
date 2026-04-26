import { describe, it, expect } from "vitest";
import { pickPostVisitGrowthVariant } from "@/hooks/usePostVisitGrowth";

describe("pickPostVisitGrowthVariant", () => {
  it("returns recommend_provider when the customer has no BYOP submissions and no rewards", () => {
    expect(pickPostVisitGrowthVariant({ byopCount: 0, rewardCount: 0 })).toBe(
      "recommend_provider"
    );
  });

  it("returns recommend_provider when the customer has no BYOP submissions, regardless of rewards", () => {
    expect(pickPostVisitGrowthVariant({ byopCount: 0, rewardCount: 5 })).toBe(
      "recommend_provider"
    );
  });

  it("returns share_referral when BYOP is engaged but referrals are not", () => {
    expect(pickPostVisitGrowthVariant({ byopCount: 1, rewardCount: 0 })).toBe(
      "share_referral"
    );
  });

  it("returns null when both levers have been engaged", () => {
    expect(pickPostVisitGrowthVariant({ byopCount: 1, rewardCount: 1 })).toBeNull();
  });

  it("returns null when both counts are large", () => {
    expect(pickPostVisitGrowthVariant({ byopCount: 9, rewardCount: 9 })).toBeNull();
  });
});
