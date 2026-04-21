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

function formatPerCreditText(priceCents: number, credits: number): string {
  const rate = priceCents / 100 / credits;
  return `$${rate.toFixed(2)} / credit`;
}

// Price + credits is the source of truth. priceText, perCreditText, and
// savings percentages are all derived so a future price change flows
// through without copy drift.
function buildPack(
  base: Omit<CreditPack, "priceText" | "perCreditText" | "savingsPct"> & { savingsVsCents?: number },
): CreditPack {
  const { savingsVsCents, ...rest } = base;
  const starterRate = 14900 / 100 / 300; // $0.4967 / credit — the baseline pack
  const thisRate = base.priceCents / 100 / base.credits;
  const savingsPct = savingsVsCents != null
    ? Math.round(((starterRate - thisRate) / starterRate) * 100)
    : undefined;
  return {
    ...rest,
    priceText: `$${Math.round(base.priceCents / 100)}`,
    perCreditText: formatPerCreditText(base.priceCents, base.credits),
    savingsPct,
  };
}

export const CREDIT_PACKS: CreditPack[] = [
  buildPack({ id: "starter",    name: "Starter",    credits: 300,  priceCents: 14900 }),
  buildPack({ id: "homeowner",  name: "Homeowner",  credits: 600,  priceCents: 26900, recommended: true, savingsVsCents: 14900 }),
  buildPack({ id: "year_round", name: "Year-round", credits: 1200, priceCents: 47900, savingsVsCents: 14900 }),
];
