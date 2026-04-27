import { useCallback, useState } from "react";
import { useByopRecommendations } from "./useByopRecommendation";
import { useReferralRewards } from "./useReferralRewards";
import {
  pickPostVisitGrowthVariant,
  type PostVisitGrowthVariant,
} from "./usePostVisitGrowth";
import {
  shouldShowGrowthCard,
  nextDismissUntil,
  parseStoredDate,
} from "@/lib/growthRateLimit";

const LAST_SHOWN_KEY = "growth-card:dashboard:last-shown";
const DISMISSED_UNTIL_KEY = "growth-card:dashboard:dismissed-until";

function readStoredDate(key: string): Date | null {
  try {
    return parseStoredDate(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeStoredDate(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable (private browsing); fall through silently
  }
}

interface DashboardGrowthState {
  variant: PostVisitGrowthVariant;
  isLoading: boolean;
  recordShown: () => void;
  dismiss: () => void;
}

export function useDashboardGrowth(): DashboardGrowthState {
  const { recommendations } = useByopRecommendations();
  const referralRewards = useReferralRewards();
  // Bump this to force a re-read of localStorage after a write.
  const [, bump] = useState(0);

  const isLoading = recommendations.isLoading || referralRewards.isLoading;

  const recordShown = useCallback(() => {
    writeStoredDate(LAST_SHOWN_KEY, new Date().toISOString());
    bump((n) => n + 1);
  }, []);

  const dismiss = useCallback(() => {
    writeStoredDate(DISMISSED_UNTIL_KEY, nextDismissUntil(new Date()));
    bump((n) => n + 1);
  }, []);

  if (isLoading) return { variant: null, isLoading: true, recordShown, dismiss };

  const allowed = shouldShowGrowthCard({
    now: new Date(),
    lastShownAt: readStoredDate(LAST_SHOWN_KEY),
    dismissedUntil: readStoredDate(DISMISSED_UNTIL_KEY),
  });
  if (!allowed) return { variant: null, isLoading: false, recordShown, dismiss };

  const variant = pickPostVisitGrowthVariant({
    byopCount: recommendations.data?.length ?? 0,
    rewardCount: referralRewards.data?.length ?? 0,
  });

  return { variant, isLoading: false, recordShown, dismiss };
}
