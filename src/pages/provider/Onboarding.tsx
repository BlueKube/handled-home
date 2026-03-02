import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderInvite } from "@/hooks/useProviderInvite";
import { useProviderCoverage } from "@/hooks/useProviderCoverage";
import { useProviderCapabilities } from "@/hooks/useProviderCapabilities";
import { useProviderCompliance } from "@/hooks/useProviderCompliance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, AlertTriangle, Shield, ArrowRight, Loader2, AlertCircle } from "lucide-react";
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

  if (org) {
    if (org.status === "ACTIVE" || org.status === "PROBATION") {
      navigate("/provider", { replace: true });
      return null;
    }
    if (org.status === "SUSPENDED") return <SuspendedScreen />;
    if (org.status === "PENDING") return <PendingReviewScreen org={org} />;
    if (org.status === "DRAFT") return <DraftResumeScreen org={org} />;
  }

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

// P4: Show compliance warnings for missing uploads
function PendingReviewScreen({ org }: { org: any }) {
  const { compliance } = useProviderCompliance(org.id);

  const missingInsuranceDoc = compliance?.insurance_attested && !compliance?.insurance_doc_url;
  const missingTaxDoc = compliance?.tax_form_attested && !compliance?.tax_doc_url;

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="text-center mt-8 mb-8">
        <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
        <h1 className="text-h2 mb-2">Under Review</h1>
        <p className="text-caption">Submitted {new Date(org.updated_at).toLocaleDateString()}</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <StatusRow ok={true} text="Organization details submitted" />
          <StatusRow ok={true} text="Coverage zones requested" />
          <StatusRow ok={true} text="Capabilities selected" />
          <StatusRow ok={true} text="Compliance completed" />
          {missingInsuranceDoc && (
            <StatusRow ok={false} text="⚠ Insurance document not uploaded — uploading may speed up review" />
          )}
          {missingTaxDoc && (
            <StatusRow ok={false} text="⚠ Tax document not uploaded — uploading may speed up review" />
          )}
        </CardContent>
      </Card>

      <p className="text-center text-caption mt-6">We'll notify you when your application has been reviewed.</p>
    </div>
  );
}

function StatusRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle className="h-4 w-4 text-success shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-warning shrink-0" />
      )}
      <span className="text-sm">{text}</span>
    </div>
  );
}

// P3: Fix allowedZoneIds by querying invite
function DraftResumeScreen({ org }: { org: any }) {
  const navigate = useNavigate();
  const { coverage } = useProviderCoverage(org.id);
  const { capabilities } = useProviderCapabilities(org.id);
  const { compliance } = useProviderCompliance(org.id);

  // P3: Query invite's allowed_zone_ids
  const { data: allowedZoneIds } = useQuery({
    queryKey: ["invite_zone_ids_draft", org.invite_id],
    queryFn: async () => {
      if (!org.invite_id) return [];
      const { data, error } = await supabase
        .from("provider_invites")
        .select("allowed_zone_ids")
        .eq("id", org.invite_id)
        .single();
      if (error) return [];
      return data?.allowed_zone_ids ?? [];
    },
    enabled: !!org.invite_id,
    initialData: [],
  });

  const hasOrg = org.name && org.name.length > 0;
  const hasCoverage = coverage.length > 0;
  const hasCapabilities = capabilities.filter((c: any) => c.is_enabled).length > 0;
  const hasCompliance = compliance?.terms_accepted_at;

  let nextStep = "/provider/onboarding/org";
  if (hasOrg && !hasCoverage) nextStep = "/provider/onboarding/coverage";
  else if (hasOrg && hasCoverage && !hasCapabilities) nextStep = "/provider/onboarding/capabilities";
  else if (hasOrg && hasCoverage && hasCapabilities && !hasCompliance) nextStep = "/provider/onboarding/compliance";
  else if (hasOrg && hasCoverage && hasCapabilities && hasCompliance) nextStep = "/provider/onboarding/agreement";

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="text-center mt-8 mb-8">
        <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
        <h1 className="text-h2 mb-2">Continue Your Application</h1>
        <p className="text-caption">You have an application in progress.</p>
      </div>

      <Button className="w-full" onClick={() => navigate(nextStep, { state: { orgId: org.id, allowedZoneIds } })}>
        Continue Application
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
