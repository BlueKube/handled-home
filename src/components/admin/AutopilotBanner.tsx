import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { AutopilotStatus, AutopilotReason } from "@/hooks/useAutopilotHealth";

const STATUS_CONFIG: Record<
  AutopilotStatus,
  { label: string; icon: React.ElementType; bg: string; border: string; text: string; badge: string }
> = {
  green: {
    label: "Autopilot Healthy",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  },
  yellow: {
    label: "Attention Needed",
    icon: AlertTriangle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  },
  red: {
    label: "Action Required",
    icon: XCircle,
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
    badge: "bg-destructive/20 text-destructive",
  },
};

interface AutopilotBannerProps {
  status: AutopilotStatus;
  reasons: AutopilotReason[];
}

export function AutopilotBanner({ status, reasons }: AutopilotBannerProps) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn("overflow-hidden border", cfg.border, cfg.bg)}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 text-left">
            <div className="flex items-center gap-3">
              <Icon className={cn("h-5 w-5", cfg.text)} />
              <span className={cn("text-sm font-semibold", cfg.text)}>
                {cfg.label}
              </span>
              {reasons.length > 0 && (
                <Badge className={cn("text-[10px] px-1.5 py-0 border-0", cfg.badge)}>
                  {reasons.length} issue{reasons.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {reasons.length > 0 && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform text-muted-foreground",
                  open && "rotate-180"
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>

        {reasons.length > 0 && (
          <CollapsibleContent>
            <div className="px-4 pb-3 space-y-1.5">
              {reasons
                .sort((a, b) => (a.severity === "red" ? -1 : 1) - (b.severity === "red" ? -1 : 1))
                .map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span
                      className={cn(
                        "mt-0.5 h-1.5 w-1.5 rounded-full shrink-0",
                        r.severity === "red" ? "bg-destructive" : "bg-amber-500"
                      )}
                    />
                    <div>
                      <span className="font-medium">{r.label}</span>
                      <span className="text-muted-foreground ml-1">— {r.detail}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CollapsibleContent>
        )}
      </Card>
    </Collapsible>
  );
}
