import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface ThisCycleSummaryProps {
  serviceCount: number;
  serviceNames: string[];
  handlesUsed?: number;
  handlesTotal?: number;
}

export function ThisCycleSummary({
  serviceCount,
  serviceNames,
  handlesUsed,
  handlesTotal,
}: ThisCycleSummaryProps) {
  const navigate = useNavigate();

  if (serviceCount === 0) return null;

  const top3 = serviceNames.slice(0, 3);
  const remaining = serviceCount - top3.length;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          This Cycle
        </h2>
        <Button
          variant="link"
          size="sm"
          className="text-xs text-primary h-auto p-0 gap-1"
          onClick={() => navigate("/customer/routine")}
        >
          Edit routine
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {top3.map((name) => (
          <Badge key={name} variant="secondary" className="text-xs">
            {name}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            +{remaining} more
          </Badge>
        )}
      </div>
      {handlesTotal != null && handlesTotal > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{handlesUsed ?? 0}/{handlesTotal} handles used this cycle</span>
        </div>
      )}
    </Card>
  );
}
