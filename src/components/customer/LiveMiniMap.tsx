import { Card } from "@/components/ui/card";
import { Home, Truck } from "lucide-react";

/**
 * Static placeholder for the in-flight provider mini-map. The real GPS feed
 * is a backend dependency tracked for Phase 7 — until then this component
 * shows a deliberate stylised illustration with a "coming soon" caption so
 * customers don't expect real-time tracking.
 */
export function LiveMiniMap() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          On the way
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Live
        </span>
      </div>
      <div
        className="relative w-full h-32 rounded-md border border-border bg-muted/30 overflow-hidden"
        role="img"
        aria-label="Stylised map showing the provider en route to your home"
      >
        <svg
          viewBox="0 0 320 128"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <path
            d="M 36 96 Q 100 96 140 70 T 280 32"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray="6 4"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
        <div className="absolute left-3 bottom-3 flex flex-col items-center gap-1">
          <div className="rounded-full bg-primary text-primary-foreground p-2 shadow-sm">
            <Truck className="h-4 w-4" />
          </div>
          <span className="text-[10px] text-muted-foreground">Provider</span>
        </div>
        <div className="absolute right-3 top-3 flex flex-col items-center gap-1">
          <div className="rounded-full bg-success text-success-foreground p-2 shadow-sm">
            <Home className="h-4 w-4" />
          </div>
          <span className="text-[10px] text-muted-foreground">Your home</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic">
        Real-time tracking coming soon — for now, this shows the route shape only.
      </p>
    </Card>
  );
}
