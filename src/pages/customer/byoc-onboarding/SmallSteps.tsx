import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import handledLogo from "@/assets/handled-home-logo.png";
import { CADENCE_LABELS } from "./shared";

export function ActivatingScreen({
  error,
  onRetry,
  onSkip,
}: {
  error: string | null;
  onRetry: () => void;
  onSkip: () => void;
}) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (error) return;
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(timer);
  }, [error]);

  const displayError = error || (timedOut ? "Connection timed out. Please try again." : null);

  if (displayError) {
    return (
      <div className="space-y-6 text-center py-16 animate-fade-in">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-h2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{displayError}</p>
        <div className="space-y-2 pt-2">
          <Button onClick={onRetry} className="w-full h-12 text-base font-semibold rounded-xl">
            Try Again
          </Button>
          <Button variant="ghost" className="w-full text-sm min-h-[44px]" onClick={onSkip}>
            Skip and continue setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-16 animate-fade-in">
      <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
      <h1 className="text-h2">Connecting your provider…</h1>
      <p className="text-sm text-muted-foreground">This usually takes just a moment.</p>
    </div>
  );
}

export function SuccessScreen({
  providerName,
  categoryLabel,
  cadence,
  onDashboard,
  onExplorePlan,
}: {
  providerName: string;
  categoryLabel: string;
  cadence: string;
  onDashboard: () => void;
  onExplorePlan: () => void;
}) {
  return (
    <div className="space-y-6 text-center animate-fade-in">
      <CheckCircle className="h-16 w-16 text-accent mx-auto" />
      <h1 className="text-h2">You're all set!</h1>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-4 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Provider</span>
            <span className="text-sm font-medium">{providerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="text-sm font-medium">{categoryLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Frequency</span>
            <span className="text-sm font-medium">{CADENCE_LABELS[cadence] ?? cadence}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Your first service will be scheduled automatically.
      </p>

      <div className="space-y-3">
        <Button onClick={onDashboard} className="w-full h-12 text-base font-semibold rounded-xl">
          Go to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="outline" onClick={onExplorePlan} className="w-full h-12">
          Explore Your Plan
        </Button>
      </div>
    </div>
  );
}

export function InviteFallbackScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full text-center space-y-4 animate-fade-in">
        <img src={handledLogo} alt="Handled Home" className="h-10 mx-auto" />
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-h2">This invitation is no longer active</h1>
        <p className="text-sm text-muted-foreground">
          The invite link may have expired or been deactivated.
        </p>
        <div className="space-y-2">
          <Button className="w-full h-12" onClick={() => navigate("/customer")}>
            Continue to Dashboard
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={() => navigate("/customer/onboarding")}>
            Set up your home
          </Button>
        </div>
      </div>
    </div>
  );
}
