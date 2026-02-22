import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ServiceDayConfirmedProps {
  dayOfWeek: string;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ServiceDayConfirmed({ dayOfWeek }: ServiceDayConfirmedProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 space-y-4 text-center">
      <div className="flex justify-center">
        <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-accent" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold">You're handled.</h2>
        <p className="text-caption mt-1">
          Your recurring Service Day is <span className="font-semibold text-foreground">{capitalize(dayOfWeek)}</span>.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => navigate("/customer/routine")}
        className="w-full gap-2"
      >
        Build your routine
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}
