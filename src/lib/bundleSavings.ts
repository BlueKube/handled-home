export interface BundleSavingsInput {
  totalCredits: number;
  separateCredits: number;
}

export interface BundleSavings {
  saveCredits: number;
  savePercent: number;
}

export function computeBundleSavings({
  totalCredits,
  separateCredits,
}: BundleSavingsInput): BundleSavings {
  if (separateCredits < totalCredits) {
    throw new Error(
      `Invalid bundle pricing: separate (${separateCredits}) < total (${totalCredits})`,
    );
  }
  const saveCredits = separateCredits - totalCredits;
  const savePercent =
    separateCredits === 0 ? 0 : Math.round((saveCredits / separateCredits) * 100);
  return { saveCredits, savePercent };
}
