import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderInvite } from "@/hooks/useProviderInvite";
import { useProviderCoverage } from "@/hooks/useProviderCoverage";
import { useProviderCapabilities } from "@/hooks/useProviderCapabilities";
import { useProviderCompliance } from "@/hooks/useProviderCompliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, Shield, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const { org, loading: orgLoading } = useProviderOrg();
  const { validateCode, validation, loading: inviteLoading } = useProviderInvite();
  const [code, setCode] = useState("");

  if (orgLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Status-based routing
  if (org) {
    if (org.status === "ACTIVE") {
      navigate("/provider", { replace: true });
      return null;
    }
    if (org.status === "PROBATION") {
      navigate("/provider", { replace: true });
      return null;
    }
    if (org.status === "SUSPENDED") {
      return <SuspendedScreen />;
    }
    if (org.status === "PENDING") {
      return <PendingReviewScreen org={org} />;
    }
    if (org.status === "DRAFT") {
      return <DraftResumeScreen org={org} />;
    }
  }

  // No org — show invite code entry
  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="text-center mb-8 mt-8">
        <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
        <h1 className="text-h2 mb-2">Join the Handled Home Network</h1>
        <p className="text-caption">You're applying to join a curated network of trusted service providers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enter Your Invite Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="e.g. HANDLED-2026"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-center text-lg tracking-widest"
          />
          {validation && !validation.valid && (
            <p className="text-sm text-destructive">{validation.reason}</p>
          )}
          <Button
            className="w-full"
            disabled={!code.trim() || inviteLoading}
            onClick={async () => {
              const result = await validateCode(code.trim());
              if (result.valid) {
                toast.success("Invite code verified!");
                navigate("/provider/onboarding/org", {
                  state: { inviteId: result.invite_id, allowedZoneIds: result.allowed_zone_ids },
                });
              }
            }}
          >
            {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify Code
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SuspendedScreen() {
  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in text-center mt-12">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h1 className="text-h2 mb-2">Account Suspended</h1>
      <p className="text-caption mb-6">Your provider account has been suspended. Please contact support for more information.</p>
      <Button variant="outline">Contact Support</Button>
    </div>
  );
}

function PendingReviewScreen({ org }: { org: any }) {
  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="text-center mt-8 mb-8">
        <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
        <h1 className="text-h2 mb-2">Under Review</h1>
        <p className="text-caption">Submitted {new Date(org.updated_at).toLocaleDateString()}</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm">Organization details submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm">Coverage zones requested</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm">Capabilities selected</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm">Compliance completed</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-caption mt-6">We'll notify you when your application has been reviewed.</p>
    </div>
  );
}

function DraftResumeScreen({ org }: { org: any }) {
  const navigate = useNavigate();
  const { coverage } = useProviderCoverage(org.id);
  const { capabilities } = useProviderCapabilities(org.id);
  const { compliance } = useProviderCompliance(org.id);

  // Determine next incomplete step
  const hasOrg = org.name && org.name.length > 0;
  const hasCoverage = coverage.length > 0;
  const hasCapabilities = capabilities.filter(c => c.is_enabled).length > 0;
  const hasCompliance = compliance?.terms_accepted_at;

  let nextStep = "/provider/onboarding/org";
  if (hasOrg && !hasCoverage) nextStep = "/provider/onboarding/coverage";
  else if (hasOrg && hasCoverage && !hasCapabilities) nextStep = "/provider/onboarding/capabilities";
  else if (hasOrg && hasCoverage && hasCapabilities && !hasCompliance) nextStep = "/provider/onboarding/compliance";
  else if (hasOrg && hasCoverage && hasCapabilities && hasCompliance) nextStep = "/provider/onboarding/review";

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="text-center mt-8 mb-8">
        <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
        <h1 className="text-h2 mb-2">Continue Your Application</h1>
        <p className="text-caption">You have an application in progress.</p>
      </div>

      <Button className="w-full" onClick={() => navigate(nextStep, { state: { orgId: org.id, allowedZoneIds: org.invite_id ? [] : [] } })}>
        Continue Application
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
