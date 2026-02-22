import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface RoutineSuccessScreenProps {
  effectiveAt: string | null;
}

export function RoutineSuccessScreen({ effectiveAt }: RoutineSuccessScreenProps) {
  const navigate = useNavigate();
  const dateLabel = effectiveAt
    ? new Date(effectiveAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "your next billing cycle";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6 animate-fade-in">
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-accent animate-pulse" />
      </div>
      <div className="space-y-2">
        <h1 className="text-h1">You're handled.</h1>
        <p className="text-muted-foreground max-w-xs">
          Your routine is locked in and takes effect {dateLabel}.
        </p>
      </div>
      <div className="space-y-2 w-full max-w-xs">
        <Button className="w-full" onClick={() => navigate("/customer")}>
          Back to Dashboard
        </Button>
        <Button variant="outline" className="w-full" onClick={() => navigate("/customer/history")}>
          View History
        </Button>
      </div>
    </div>
  );
}
