import { useByopRecommendations } from "./useByopRecommendation";
import { useReferralRewards } from "./useReferralRewards";

export type PostVisitGrowthVariant = "recommend_provider" | "share_referral" | null;

/**
 * Pure rotation decision. Highest-leverage CTA first: BYOP if never
 * submitted, else referral if never redeemed, else null (both engaged).
 */
export function pickPostVisitGrowthVariant({
  byopCount,
  rewardCount,
}: {
  byopCount: number;
  rewardCount: number;
}): PostVisitGrowthVariant {
  if (byopCount === 0) return "recommend_provider";
  if (rewardCount === 0) return "share_referral";
  return null;
}

export function usePostVisitGrowth(): { variant: PostVisitGrowthVariant; isLoading: boolean } {
  const { recommendations } = useByopRecommendations();
  const referralRewards = useReferralRewards();

  const isLoading = recommendations.isLoading || referralRewards.isLoading;
  if (isLoading) return { variant: null, isLoading: true };

  const variant = pickPostVisitGrowthVariant({
    byopCount: recommendations.data?.length ?? 0,
    rewardCount: referralRewards.data?.length ?? 0,
  });

  return { variant, isLoading: false };
}
