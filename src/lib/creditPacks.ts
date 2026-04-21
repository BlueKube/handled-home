export type CreditPackId = "starter" | "homeowner" | "year_round";

export interface CreditPack {
  id: CreditPackId;
  name: string;
  credits: number;
  priceCents: number;
  priceText: string;
  perCreditText: string;
  recommended?: boolean;
  savingsPct?: number;
}

// Starter pack sets the baseline per-credit rate. Savings on larger packs
// are computed against it.
const STARTER_RATE = 149 / 300; // $0.4967 / credit

function savingsAgainstStarter(priceCents: number, credits: number): number {
  const rate = priceCents / 100 / credits;
  const pct = ((STARTER_RATE - rate) / STARTER_RATE) * 100;
  return Math.round(pct);
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 300,
    priceCents: 14900,
    priceText: "$149",
    perCreditText: "$0.50 / credit",
  },
  {
    id: "homeowner",
    name: "Homeowner",
    credits: 600,
    priceCents: 26900,
    priceText: "$269",
    perCreditText: "$0.45 / credit",
    recommended: true,
    savingsPct: savingsAgainstStarter(26900, 600),
  },
  {
    id: "year_round",
    name: "Year-round",
    credits: 1200,
    priceCents: 47900,
    priceText: "$479",
    perCreditText: "$0.40 / credit",
    savingsPct: savingsAgainstStarter(47900, 1200),
  },
];
