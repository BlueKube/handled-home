import { useParams, useNavigate } from "react-router-dom";
import { Shield, Camera, CheckCircle, Gift, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGrowthEvents } from "@/hooks/useGrowthEvents";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import handledLogo from "@/assets/handled-home-logo.png";

export default function InviteLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { recordEvent } = useGrowthEvents();
  const hasTracked = useRef(false);

  // Validate referral code exists and is usable
  const { data: referral, isLoading, isError } = useQuery({
    queryKey: ["referral-code-public", code],
    enabled: !!code,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("code, is_active")
        .eq("code", code!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Record landing_viewed event once (only for valid codes)
  useEffect(() => {
    if (code && referral && !hasTracked.current) {
      hasTracked.current = true;
      recordEvent.mutate({
        eventType: "landing_viewed",
        actorRole: "system",
        sourceSurface: "provider_invite",
        idempotencyKey: `invite_landing_${code}_${new Date().toISOString().slice(0, 13)}`,
        context: { invite_code: code },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, referral]);

  // No code in URL — show neutral fallback
  if (!code) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background animate-fade-in">
        <div className="max-w-md w-full text-center space-y-4">
          <img src={handledLogo} alt="Handled Home" className="h-12 mx-auto" />
          <h1 className="text-2xl font-bold">Invalid referral link</h1>
          <p className="text-sm text-muted-foreground">
            This link appears to be incomplete. Ask your friend to resend the referral link.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="w-full">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Network/RLS error state
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background animate-fade-in">
        <div className="max-w-md w-full text-center space-y-4">
          <img src={handledLogo} alt="Handled Home" className="h-12 mx-auto" />
          <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We couldn't verify this referral link. Please try again later.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="w-full">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  // Invalid or inactive code
  if (!referral || !referral.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background animate-fade-in">
        <div className="max-w-md w-full text-center space-y-4">
          <img src={handledLogo} alt="Handled Home" className="h-12 mx-auto" />
          <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
          <h1 className="text-2xl font-bold">This referral link couldn't be verified</h1>
          <p className="text-sm text-muted-foreground">
            It may have been used already. Ask your friend for a new link.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="w-full">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  const features = [
    { icon: <Shield className="h-6 w-6 text-primary" />, text: "Track and manage every service visit" },
    { icon: <Camera className="h-6 w-6 text-primary" />, text: "Proof photos after each visit" },
    { icon: <CheckCircle className="h-6 w-6 text-primary" />, text: "Manage your home services in one place" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
        <img src={handledLogo} alt="Handled Home" className="h-12 mx-auto" />

        <h1 className="text-2xl font-bold">Your pro is moving updates to Handled Home</h1>

        {/* Feature cards */}
        <div className="space-y-3">
          {features.map((item, i) => (
            <Card key={i}>
              <CardContent className="py-4 flex items-center gap-4">
                {item.icon}
                <p className="text-sm font-medium text-left">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Welcome Offer Card */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="py-4 space-y-1">
            <div className="flex items-center gap-2 justify-center">
              <Gift className="h-5 w-5 text-accent" />
              <p className="font-semibold text-sm">Welcome bonus</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Your friend's referral earns you a credit toward your first service.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Credit applied automatically after your first paid cycle.
            </p>
          </CardContent>
        </Card>

        {/* Primary CTA */}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => navigate(`/auth?ref=${code}`)}
        >
          Get Started <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-muted-foreground">
          Free to join. Cancel anytime. No commitments.
        </p>

        {/* Dismiss */}
        <Button
          variant="ghost"
          className="text-muted-foreground min-h-[44px]"
          onClick={() => navigate("/")}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
