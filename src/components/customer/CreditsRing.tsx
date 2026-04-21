interface CreditsRingProps {
  balance: number;
  perCycle: number;
  annualCap?: number;
  variant?: "compact" | "hero";
  label?: string;
  className?: string;
}

const VARIANT_SIZE: Record<NonNullable<CreditsRingProps["variant"]>, number> = {
  compact: 72,
  hero: 180,
};

const VARIANT_STROKE: Record<NonNullable<CreditsRingProps["variant"]>, number> = {
  compact: 6,
  hero: 10,
};

function colorForBalance(balance: number, cap: number): string {
  if (cap <= 0) return "text-muted-foreground";
  if (balance <= 0) return "text-destructive";
  if (balance / cap < 0.2) return "text-warning";
  return "text-accent";
}

export function CreditsRing({
  balance,
  perCycle,
  annualCap,
  variant = "compact",
  label,
  className = "",
}: CreditsRingProps) {
  const size = VARIANT_SIZE[variant];
  const strokeWidth = VARIANT_STROKE[variant];
  const cap = annualCap && annualCap > 0 ? annualCap : perCycle;
  const fillRatio = cap > 0 ? Math.max(0, Math.min(1, balance / cap)) : 0;

  const center = size / 2;
  const outerRadius = center - strokeWidth;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerDashOffset = outerCircumference * (1 - fillRatio);

  const showInnerRing = variant === "hero" && annualCap != null && annualCap > perCycle && perCycle > 0;
  const innerRadius = outerRadius - strokeWidth - 4;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const innerFillRatio = showInnerRing ? Math.max(0, Math.min(1, balance / perCycle)) : 0;
  const innerDashOffset = innerCircumference * (1 - innerFillRatio);

  const ringColor = colorForBalance(balance, cap);
  const defaultLabel = annualCap && annualCap > 0 ? `of ${annualCap} / yr` : `of ${perCycle} / cycle`;
  const ariaLabel = `${balance} credits remaining ${annualCap && annualCap > 0 ? "of " + annualCap + " per year" : "of " + perCycle + " per cycle"}`;

  const numberSize = variant === "hero" ? "text-4xl" : "text-xl";
  const labelSize = variant === "hero" ? "text-xs" : "text-[10px]";

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          className="text-muted/40 stroke-current"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          className={`${ringColor} stroke-current transition-all`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={outerCircumference}
          strokeDashoffset={outerDashOffset}
        />
        {showInnerRing && (
          <>
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              className="text-muted/30 stroke-current"
              strokeWidth={strokeWidth - 2}
              fill="none"
            />
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              className="text-accent stroke-current transition-all"
              strokeWidth={strokeWidth - 2}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={innerCircumference}
              strokeDashoffset={innerDashOffset}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold tracking-tight text-foreground ${numberSize}`}>{balance}</span>
        <span className={`text-muted-foreground ${labelSize}`}>{label ?? defaultLabel}</span>
      </div>
    </div>
  );
}
