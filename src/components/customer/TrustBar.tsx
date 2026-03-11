import { Shield, Clock, XCircle } from "lucide-react";

export function TrustBar() {
  return (
    <div className="flex items-center justify-center gap-4 py-2.5 px-3 bg-muted/50 rounded-xl">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5 text-primary" />
        <span>Insured providers</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-accent" />
        <span>Satisfaction guarantee</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Cancel anytime</span>
      </div>
    </div>
  );
}
