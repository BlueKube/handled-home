const SQFT_RANGE_LABEL: Record<string, string> = {
  lt_1500: "under 1,500 sqft",
  "1500_2500": "~2,000 sqft",
  "2500_3500": "~3,000 sqft",
  "3500_5000": "~4,000 sqft",
  "5000_plus": "5,000+ sqft",
};

const YARD_LABEL: Record<string, string> = {
  NONE: "no yard",
  SMALL: "small yard",
  MEDIUM: "medium yard",
  LARGE: "large yard",
};

export function buildRationale(args: {
  sqftTier: string | null;
  yardTier: string | null;
  familyName: string;
  variantName: string;
}): string {
  const { sqftTier, yardTier, familyName, variantName } = args;

  const sqftLabel = sqftTier ? SQFT_RANGE_LABEL[sqftTier] : undefined;
  if (sqftLabel) {
    return `Based on your ${sqftLabel} home, your ${familyName} plan is ${variantName}.`;
  }

  const yardLabel = yardTier ? YARD_LABEL[yardTier] : undefined;
  if (yardLabel) {
    return `Based on your ${yardLabel}, your ${familyName} plan is ${variantName}.`;
  }

  return `Based on your property profile, your ${familyName} plan is ${variantName}.`;
}
