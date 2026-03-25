import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  ctaDisabled?: boolean;
  ctaVariant?: "default" | "outline";
  secondaryLabel?: string;
  secondaryAction?: () => void;
  /** When true, renders without a Card wrapper (for use inside an existing Card) */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaAction,
  ctaDisabled,
  ctaVariant = "default",
  secondaryLabel,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  const content = (
    <>
      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <p className="text-h3 text-foreground">{title}</p>
      <p className="text-body text-muted-foreground text-center max-w-[280px]">
        {body}
      </p>
      {ctaLabel && ctaAction && (
        <Button
          variant={ctaVariant}
          className="w-full max-w-[240px] mt-1"
          onClick={ctaAction}
          disabled={ctaDisabled}
        >
          {ctaLabel}
        </Button>
      )}
      {secondaryLabel && secondaryAction && (
        <Button variant="ghost" className="min-h-[44px]" onClick={secondaryAction}>
          {secondaryLabel}
        </Button>
      )}
    </>
  );

  if (compact) {
    return (
      <div
        role="status"
        className={cn("py-8 flex flex-col items-center gap-3 animate-fade-in", className)}
      >
        {content}
      </div>
    );
  }

  return (
    <Card
      role="status"
      className={cn("rounded-2xl p-8 flex flex-col items-center gap-3 animate-fade-in", className)}
    >
      {content}
    </Card>
  );
}
