export type PlanFamilyKey = "basic" | "full" | "premier" | "legacy";

export const TIER_ACCENT: Record<PlanFamilyKey, string> = {
  basic: "bg-muted text-foreground",
  full: "bg-accent/10 text-accent border border-accent/30",
  premier: "bg-primary/10 text-primary border border-primary/30",
  legacy: "bg-muted text-foreground",
};

export const FAMILY_HIGHLIGHTS: Record<Exclude<PlanFamilyKey, "legacy">, string[]> = {
  basic: [
    "Weekly mow + edge trim",
    "Swap services each cycle",
    "Roll over unused credits",
  ],
  full: [
    "Everything in Basic",
    "Seasonal services included",
    "Priority scheduling",
  ],
  premier: [
    "Everything in Full",
    "Home Assistant access",
    "Dedicated provider team",
    "Same-day add-on booking",
  ],
};
