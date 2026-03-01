import { useMemo } from "react";
import { useSkuLevels } from "@/hooks/useSkuLevels";
import { usePropertyProfileContext } from "@/hooks/usePropertyProfileContext";

interface LevelDefault {
  default_level_id: string | null;
  default_level_reason: string | null;
  confidence: "low" | "med" | "high";
}

/**
 * Deterministic level-default engine using property sizing signals.
 * Rules are per-SKU-category; falls back to lowest active level.
 */
export function useLevelDefault(skuId: string | null, category: string | null): LevelDefault {
  const { data: levels } = useSkuLevels(skuId);
  const { data: context } = usePropertyProfileContext();

  return useMemo(() => {
    const activeLevels = (levels ?? []).filter((l) => l.is_active).sort((a, b) => a.level_number - b.level_number);
    if (activeLevels.length === 0) {
      return { default_level_id: null, default_level_reason: null, confidence: "low" };
    }

    const sizing = context?.sizing;
    if (!sizing || !category) {
      return {
        default_level_id: activeLevels[0].id,
        default_level_reason: null,
        confidence: "low",
      };
    }

    let bump = 0;
    let reason = "";

    // Category-specific rules
    switch (category) {
      case "windows":
        if (sizing.windows_tier === "30_plus") { bump += 2; reason = "30+ windows"; }
        else if (sizing.windows_tier === "15_30") { bump += 1; reason = "15–30 windows"; }
        if (sizing.stories_tier === "2") { bump += 1; reason += (reason ? " + " : "") + "2-story home"; }
        else if (sizing.stories_tier === "3_plus") { bump += 2; reason += (reason ? " + " : "") + "3+ story home"; }
        break;

      case "gutters":
      case "cleanup":
        if (sizing.stories_tier === "2") { bump += 1; reason = "2-story home"; }
        else if (sizing.stories_tier === "3_plus") { bump += 2; reason = "3+ story home"; }
        if (sizing.home_sqft_tier === "5000_plus") { bump += 1; reason += (reason ? " + " : "") + "5,000+ sqft"; }
        break;

      case "mowing":
      case "trimming":
      case "treatment":
        if (sizing.yard_tier === "LARGE") { bump += 1; reason = "large yard"; }
        if (sizing.home_sqft_tier === "5000_plus" && sizing.yard_tier !== "NONE") {
          bump += 1;
          reason += (reason ? " + " : "") + "5,000+ sqft home";
        }
        break;

      case "power_wash":
        if (sizing.home_sqft_tier === "3500_5000" || sizing.home_sqft_tier === "5000_plus") {
          bump += 1;
          reason = "large home exterior";
        }
        if (sizing.stories_tier === "2") { bump += 1; reason += (reason ? " + " : "") + "multi-story"; }
        else if (sizing.stories_tier === "3_plus") { bump += 2; reason += (reason ? " + " : "") + "3+ stories"; }
        break;

      default:
        // No sizing-based bumps for other categories
        break;
    }

    // Clamp to available levels
    const targetIndex = Math.min(bump, activeLevels.length - 1);
    const selected = activeLevels[targetIndex];
    const confidence: "low" | "med" | "high" = bump === 0 ? "low" : targetIndex === bump ? "high" : "med";

    return {
      default_level_id: selected.id,
      default_level_reason: reason
        ? `Homes your size typically use ${selected.label}`
        : null,
      confidence,
    };
  }, [levels, context, category]);
}
