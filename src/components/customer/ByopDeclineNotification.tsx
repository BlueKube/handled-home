import { useNavigate } from "react-router-dom";
import { UserX } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ByopDeclineNotificationProps {
  providerName: string;
  recommendationId: string;
}

export function ByopDeclineNotification({ providerName }: ByopDeclineNotificationProps) {
  const navigate = useNavigate();

  return (
    <Alert className="border-warning/30 bg-warning/5">
      <UserX className="h-4 w-4 text-warning" />
      <AlertTitle>Provider Update</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">
          {providerName} is unable to join the Handled network at this time. We'll match you with a
          verified provider from our existing network — no action needed on your end.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px]"
          onClick={() => navigate("/customer/routine")}
        >
          View My Routine
        </Button>
      </AlertDescription>
    </Alert>
  );
}
