import { getCategoryLabel } from "@/lib/serviceCategories";

export interface StateMessage {
  headline: string;
  subtext: string;
  badge: string;
  ctaLabel: string;
}

/**
 * Returns customer-facing copy per zone-category state (PRD §4D).
 */
export function getStateMessage(
  rawState: string | null,
  category: string | null | undefined
): StateMessage {
  const label = getCategoryLabel(category);

  switch (rawState) {
    case "WAITLIST_ONLY":
      return {
        headline: "Coming soon",
        subtext: `${label} isn't live in your area yet. Join early access and we'll invite you first.`,
        badge: "Coming Soon",
        ctaLabel: "Join Early Access",
      };
    case "PROVIDER_RECRUITING":
      return {
        headline: "We're recruiting pros",
        subtext: `We're building our ${label.toLowerCase()} team in your area. Join early access to be first in line.`,
        badge: "Recruiting",
        ctaLabel: "Join Early Access",
      };
    case "SOFT_LAUNCH":
      return {
        headline: "Limited availability",
        subtext: `${label} has limited early access slots in your area.`,
        badge: "Early Access",
        ctaLabel: "Get Started",
      };
    case "PROTECT_QUALITY":
      return {
        headline: "Temporarily limited",
        subtext: `${label} is temporarily limited to protect service reliability. Join the waitlist for priority access.`,
        badge: "Limited",
        ctaLabel: "Join Waitlist",
      };
    case "CLOSED":
      return {
        headline: "Not available",
        subtext: `${label} is not available in your area.`,
        badge: "Unavailable",
        ctaLabel: "",
      };
    default:
      return {
        headline: label,
        subtext: "",
        badge: "",
        ctaLabel: "Get Started",
      };
  }
}
