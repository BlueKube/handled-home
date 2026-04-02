import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProperty } from "@/hooks/useProperty";
import { useZoneLookup } from "@/hooks/useZoneLookup";
import { TrustBar } from "@/components/customer/TrustBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, CheckCircle, AlertTriangle, Loader2, Bell, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useJoinWaitlist } from "@/hooks/useWaitlist";

export function ZoneCheckStep({ onComplete, onWaitlist }: { onComplete: () => Promise<void>; onWaitlist: () => void }) {
  const { property } = useProperty();
  const zipCode = property?.zip_code ?? "";
  const { zoneName, isLoading, isCovered, isNotCovered } = useZoneLookup(zipCode);
  const { user } = useAuth();
  const joinWaitlist = useJoinWaitlist();

  useEffect(() => {
    if (isCovered) {
      const timer = setTimeout(() => onComplete(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isCovered, onComplete]);

  const handleJoinWaitlist = async () => {
    try {
      await joinWaitlist.mutateAsync({
        email: user?.email ?? "",
        full_name: user?.user_metadata?.full_name ?? "",
        zip_code: zipCode,
        source: "onboarding",
      });
      toast.success("You're on the list! We'll notify you when we launch in your area.");
      onWaitlist();
    } catch {
      toast.error("Couldn't join waitlist. Try again.");
    }
  };

  return (
    <div className="space-y-6 text-center">
      <MapPin className="h-10 w-10 text-accent mx-auto" />
      <h1 className="text-h2">Checking your area</h1>
      <p className="text-muted-foreground text-sm">Zip code: <span className="font-mono font-semibold">{zipCode}</span></p>
      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-muted-foreground">Looking up coverage…</span>
        </div>
      )}
      {isCovered && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6 text-center space-y-3">
            <CheckCircle className="h-10 w-10 text-accent mx-auto" />
            <p className="font-semibold text-foreground">You're covered!</p>
            <p className="text-sm text-muted-foreground">Zone: {zoneName}</p>
            <p className="text-xs text-muted-foreground animate-pulse">Continuing…</p>
          </CardContent>
        </Card>
      )}
      <TrustBar />
      {isNotCovered && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6 space-y-4">
            <AlertTriangle className="h-10 w-10 text-warning mx-auto" />
            <p className="font-semibold text-foreground">We're not in your area yet</p>
            <p className="text-sm text-muted-foreground">Handled Home is expanding quickly. Join the waitlist and we'll let you know the moment we launch near you.</p>
            <Button onClick={handleJoinWaitlist} disabled={joinWaitlist.isPending} className="w-full">
              {joinWaitlist.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              Join Waitlist
            </Button>
            <Button variant="ghost" onClick={onWaitlist} className="w-full text-sm">Continue exploring</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function RoutineStep({ onComplete }: { onComplete: () => Promise<void> }) {
  const [completing, setCompleting] = useState(false);
  const handleComplete = async () => {
    setCompleting(true);
    try { await onComplete(); } finally { setCompleting(false); }
  };
  return (
    <div className="space-y-6 text-center">
      <Sparkles className="h-10 w-10 text-accent mx-auto" />
      <h1 className="text-h2">Build your routine</h1>
      <p className="text-muted-foreground text-sm">Choose which services you'd like on your regular visits. You can always swap, add, or remove services later from your dashboard.</p>
      <Button className="w-full" onClick={handleComplete} disabled={completing}>
        {completing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue to Complete Setup
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={handleComplete} disabled={completing}>Skip for now</Button>
    </div>
  );
}

export function CompleteStep() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 text-center animate-fade-in">
      <CheckCircle className="h-16 w-16 text-accent mx-auto" />
      <h1 className="text-h2">You're all set!</h1>
      <p className="text-muted-foreground">Welcome to Handled Home. Your first service day is coming up — we'll send you a reminder.</p>
      <div className="space-y-3 pt-4">
        <Button className="w-full" onClick={() => navigate("/customer")}>Go to Dashboard</Button>
        <Button variant="outline" className="w-full" onClick={() => navigate("/customer/routine")}>Review My Routine</Button>
      </div>
    </div>
  );
}
