import { AlertTriangle, XCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProviderStatusBannerProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof AlertTriangle; title: string; body: string; variant: "warning" | "destructive" }> = {
  PROBATION: {
    icon: AlertTriangle,
    title: "Account Under Review",
    body: "Your account is on probation due to performance concerns. Maintain quality standards over the next 30 days to return to good standing.",
    variant: "warning",
  },
  SUSPENDED: {
    icon: XCircle,
    title: "Account Suspended",
    body: "Your account has been suspended and you cannot receive new job assignments. Contact support for next steps.",
    variant: "destructive",
  },
};

const VARIANT_STYLES = {
  warning: "bg-warning/10 border-warning/30 text-warning-foreground",
  destructive: "bg-destructive/10 border-destructive/30 text-destructive",
};

export function ProviderStatusBanner({ status }: ProviderStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = STATUS_CONFIG[status];

  if (!config || dismissed) return null;

  const Icon = config.icon;

  return (
    <div className={`rounded-xl border p-4 ${VARIANT_STYLES[config.variant]}`} role="alert">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{config.title}</p>
          <p className="text-xs mt-1 opacity-90">{config.body}</p>
        </div>
        {config.variant === "warning" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 -mt-1 -mr-1"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
