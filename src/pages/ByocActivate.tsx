import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useByocActivation } from "@/hooks/useByocActivation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  Shield,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import handledLogo from "@/assets/handled-home-logo.png";

const CADENCE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  once: "One-time",
};

export default function ByocActivate() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { invite, activate } = useByocActivation(token);
  const [selectedCadence, setSelectedCadence] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  const data = invite.data;
  const cadence = selectedCadence || data?.default_cadence || "weekly";

  // Loading
  if (invite.isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Invalid/expired token
  if (!data || !data.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4 animate-fade-in">
          <img src={handledLogo} alt="Handled Home" className="h-10 mx-auto" />
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Link Not Available</h1>
          <p className="text-sm text-muted-foreground">
            This invite link is invalid or has expired. Please ask your service provider for a new link.
          </p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (activated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">You're All Set!</h1>
          <p className="text-muted-foreground">
            Your service with {data.provider_org?.name || "your provider"} has been activated through Handled Home.
          </p>
          <Button size="lg" className="w-full" onClick={() => navigate(user ? "/customer" : "/auth")}>
            {user ? "Go to Dashboard" : "Sign In to Continue"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const handleActivate = async () => {
    if (!user) {
      // Redirect to auth with return URL
      navigate(`/auth?redirect=/byoc/activate/${token}`);
      return;
    }
    try {
      await activate.mutateAsync({ cadence });
      setActivated(true);
      toast.success("Service activated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to activate. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 bg-background">
      <div className="max-w-md w-full space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <img src={handledLogo} alt="Handled Home" className="h-10 mx-auto" />
          <h1 className="text-xl font-bold">
            {data.provider_org?.name || "Your Provider"} invited you
          </h1>
          <p className="text-sm text-muted-foreground">
            Continue your service through Handled Home — same great provider, better experience.
          </p>
        </div>

        {/* Provider Card */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
                {data.provider_org?.name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{data.provider_org?.name || "Provider"}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{data.zone?.name || "Your area"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <Badge variant="outline" className="capitalize">
                {data.category_key.replace(/_/g, " ")}
              </Badge>
            </div>
            {data.sku && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service</span>
                <span className="text-sm font-medium">{data.sku.name}</span>
              </div>
            )}
            {data.level && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service Level</span>
                <span className="text-sm font-medium">{data.level.label}</span>
              </div>
            )}
            {data.sku?.duration_minutes && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Duration</span>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{data.sku.duration_minutes} min</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cadence Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How Often</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CADENCE_LABELS).map(([val, label]) => (
                <Button
                  key={val}
                  variant={cadence === val ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCadence(val)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardContent className="pt-5 space-y-3">
            {[
              { icon: <Shield className="h-5 w-5 text-primary shrink-0" />, text: "Handled Home manages scheduling, billing, and quality" },
              { icon: <CheckCircle className="h-5 w-5 text-primary shrink-0" />, text: "Proof photos after every visit" },
              { icon: <Sparkles className="h-5 w-5 text-primary shrink-0" />, text: "Issue resolution and service guarantee" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.icon}
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full"
          disabled={activate.isPending}
          onClick={handleActivate}
        >
          {activate.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          {user ? "Activate Service" : "Sign Up to Activate"}
        </Button>

        {!user && (
          <Alert>
            <AlertDescription className="text-xs text-center">
              You'll create a free Handled Home account first, then your service will be activated automatically.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Free to join. Pricing set by Handled Home. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
