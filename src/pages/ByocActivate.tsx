import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel } from "@/lib/serviceCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Clock, MapPin, Shield, Camera, Sparkles } from "lucide-react";
import handledLogo from "@/assets/handled-home-logo.png";

const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  once: "One-time",
};

interface InvitePreview {
  token: string;
  category_key: string;
  default_cadence: string;
  is_active: boolean;
  provider_name: string | null;
  provider_logo_url: string | null;
  service_name: string | null;
  duration_minutes: number | null;
  level_label: string | null;
  zone_name: string | null;
}

/**
 * Public BYOC invite landing page.
 * - Fetches invite preview data (no auth required)
 * - Shows provider info, service details, and "Sign Up to Activate" CTA
 * - If already authenticated → redirects to the BYOC onboarding wizard
 */
export default function ByocActivate() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // If authenticated, skip the landing page and go straight to the wizard
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      navigate(`/customer/onboarding/byoc/${token}`, { replace: true });
    }
  }, [user, authLoading, token, navigate]);

  // Fetch invite preview (works for anon via public RPC)
  const { data: invite, isLoading } = useQuery({
    queryKey: ["byoc-invite-public", token],
    enabled: !!token && !user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_byoc_invite_public" as any, {
        p_token: token,
      });
      if (error) throw error;
      return data as InvitePreview | null;
    },
  });

  const handleActivate = () => {
    navigate(`/auth?redirect=${encodeURIComponent(`/customer/onboarding/byoc/${token}`)}`);
  };

  // Loading states
  if (authLoading || (user && !invite)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Invalid/expired invite
  if (!isLoading && !invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4 animate-fade-in">
          <img src={handledLogo} alt="Handled Home" className="h-10 mx-auto" />
          <h1 className="text-2xl font-bold">This invitation is no longer active</h1>
          <p className="text-sm text-muted-foreground">
            The invite link may have expired or been deactivated.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="w-full">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const providerName = invite?.provider_name || "Provider";
  const providerInitial = providerName.charAt(0).toUpperCase();
  const categoryLabel = getCategoryLabel(invite?.category_key);
  const serviceName = invite?.service_name || categoryLabel;
  const cadenceLabel = CADENCE_LABELS[invite?.default_cadence ?? ""] ?? invite?.default_cadence ?? "Weekly";

  return (
    <div className="min-h-screen flex flex-col items-center bg-background px-5 py-10 animate-fade-in">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={handledLogo} alt="Handled Home" className="h-10" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Your Provider invited you</h1>
          <p className="text-sm text-muted-foreground">
            Continue your service through Handled Home — same great provider, better experience.
          </p>
        </div>

        {/* Provider card */}
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            {invite?.provider_logo_url ? (
              <img
                src={invite.provider_logo_url}
                alt={providerName}
                className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold border-2 border-primary/20">
                {providerInitial}
              </div>
            )}
            <div>
              <p className="font-semibold">{providerName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {invite?.zone_name || "Your area"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <h2 className="font-semibold text-sm">Service Details</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <Badge variant="outline">{categoryLabel}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="text-sm font-medium">{serviceName}</span>
            </div>
            {invite?.duration_minutes && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Duration</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {invite.duration_minutes} min
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <h2 className="font-semibold text-sm">How Often</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CADENCE_LABELS).map(([val, label]) => (
                <div
                  key={val}
                  className={`rounded-full py-2 px-4 text-sm font-medium text-center border transition-all ${
                    (invite?.default_cadence ?? "weekly") === val
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm">Handled Home manages scheduling, billing, and quality</p>
            </div>
            <div className="flex items-start gap-3">
              <Camera className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm">Proof photos after every visit</p>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm">Issue resolution and service guarantee</p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          onClick={handleActivate}
          size="lg"
          className="w-full h-14 text-base font-semibold rounded-xl gap-2"
        >
          <ArrowRight className="h-5 w-5" />
          Sign Up to Activate
        </Button>

        {/* Footer */}
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground text-center">
              You'll create a free Handled Home account first, then your service will be activated automatically.
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Free to join. Pricing set by Handled Home. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
