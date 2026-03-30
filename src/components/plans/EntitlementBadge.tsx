import { Badge } from "@/components/ui/badge";
import { Check, Plus, X, Shield } from "lucide-react";

export type EntitlementStatus = "included" | "extra_allowed" | "blocked" | "provider_only" | "available";

const config: Record<EntitlementStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  included: { label: "Included", icon: Check, variant: "default" },
  extra_allowed: { label: "Extra", icon: Plus, variant: "secondary" },
  blocked: { label: "Not Available", icon: X, variant: "destructive" },
  provider_only: { label: "Provider Only", icon: Shield, variant: "outline" },
  available: { label: "Available", icon: Plus, variant: "secondary" },
};

export function EntitlementBadge({ status }: { status: EntitlementStatus }) {
  const { label, icon: Icon, variant } = config[status] ?? config.available;
  return (
    <Badge variant={variant} className="gap-1 text-xs">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
