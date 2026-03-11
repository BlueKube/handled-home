import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, DollarSign } from "lucide-react";

interface ByocBannerProps {
  activationsCount?: number;
}

export function ByocBanner({ activationsCount = 0 }: ByocBannerProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-4 bg-accent/5 border-accent/20">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Bring your existing customers
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Earn bonus income on top of your guaranteed route pay when your own customers join Handled Home.
            </p>
          </div>

          {activationsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-accent font-medium">
              <DollarSign className="h-3 w-3" />
              <span>{activationsCount} customer{activationsCount !== 1 ? "s" : ""} activated</span>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => navigate("/provider/byoc")}
          >
            Create invite link
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
