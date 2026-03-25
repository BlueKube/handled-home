import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderCoverage } from "@/hooks/useProviderCoverage";
import { useProviderCapabilities } from "@/hooks/useProviderCapabilities";
import { useProviderCompliance } from "@/hooks/useProviderCompliance";
import { useProviderMembers } from "@/hooks/useProviderMembers";
import { useProviderApplication } from "@/hooks/useProviderApplication";
import { useProviderAgreement } from "@/hooks/useProviderAgreement";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import OnboardingProgressHeader from "@/components/provider/OnboardingProgressHeader";

export default function OnboardingReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, loading: orgLoading, submitOnboarding } = useProviderOrg();

  // P1: Fall back to useProviderOrg
  const effectiveOrgId = location.state?.orgId || org?.id;
  const allowedZoneIds = location.state?.allowedZoneIds || [];

  const { members } = useProviderMembers(effectiveOrgId);
  const { coverage } = useProviderCoverage(effectiveOrgId);
  const { capabilities } = useProviderCapabilities(effectiveOrgId);
  const { compliance } = useProviderCompliance(effectiveOrgId);
  const { application } = useProviderApplication();
  const { allAccepted, acceptedCount, totalClauses } = useProviderAgreement(application.data?.id);
  const [submitting, setSubmitting] = useState(false);

  const effectiveOrg = org;
  const enabledCaps = capabilities.filter((c: any) => c.is_enabled);
  const hasCompliance = compliance?.terms_accepted_at;
  const isReady = effectiveOrg?.name && coverage.length > 0 && enabledCaps.length > 0 && hasCompliance && allAccepted;

  const handleSubmit = async () => {
    if (!effectiveOrgId) return;
    setSubmitting(true);
    try {
      await submitOnboarding.mutateAsync(effectiveOrgId);
      toast.success("Application submitted!");
      navigate("/provider/onboarding");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orgLoading) {
    return <div className="p-4 flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="animate-fade-in p-4 pb-24">
      <OnboardingProgressHeader currentStep={6} onBack={() => navigate("/provider/onboarding/agreement", { state: { orgId: effectiveOrgId, allowedZoneIds } })} />
      <h1 className="text-h2 mb-1">Review & Submit</h1>
      <p className="text-caption mb-6">Review your application before submitting. All sections must be complete.</p>

      <div className="space-y-4 mb-6">
        <SummaryCard
          title="Organization"
          ok={!!effectiveOrg?.name}
          details={[effectiveOrg?.name, effectiveOrg?.contact_phone, effectiveOrg?.home_base_zip ? `ZIP: ${effectiveOrg.home_base_zip}` : null].filter(Boolean)}
        />
        <SummaryCard
          title="Owner"
          ok={members.length > 0}
          details={members.map((m: any) => m.display_name || "Owner")}
        />
        <SummaryCard
          title="Coverage Zones"
          ok={coverage.length > 0}
          details={coverage.map((c: any) => c.zones?.name || c.zone_id)}
        />
        <SummaryCard
          title="Capabilities"
          ok={enabledCaps.length > 0}
          details={[`${enabledCaps.length} service${enabledCaps.length !== 1 ? "s" : ""} selected`]}
        />
        <SummaryCard
          title="Compliance"
          ok={!!hasCompliance}
          details={[
            hasCompliance ? "Terms accepted ✓" : "Terms not accepted",
            compliance?.insurance_attested ? "Insurance attested ✓" : "Insurance not attested",
            compliance?.insurance_doc_url ? "Insurance doc uploaded ✓" : "⚠ Insurance doc not uploaded",
            compliance?.tax_form_attested ? "Tax form attested ✓" : null,
            compliance?.tax_doc_url ? "Tax doc uploaded ✓" : compliance?.tax_form_attested ? "⚠ Tax doc not uploaded" : null,
          ].filter(Boolean)}
        />
        <SummaryCard
          title="Agreement"
          ok={allAccepted}
          details={[
            allAccepted
              ? `All ${totalClauses} clauses accepted ✓`
              : `${acceptedCount} of ${totalClauses} clauses accepted`,
          ]}
        />
      </div>

      <Card className="mb-6 bg-secondary/50">
        <CardContent className="py-4">
          <p className="text-sm font-medium mb-1">What happens next?</p>
          <p className="text-xs text-muted-foreground">Our team will review your application within 1–2 business days. We'll notify you when you're approved and ready to start receiving jobs.</p>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSubmit} disabled={!isReady || submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
        Submit Application
      </Button>
    </div>
  );
}

function SummaryCard({ title, ok, details }: { title: string; ok: boolean; details: string[] }) {
  return (
    <Card>
      <CardContent className="py-3 flex items-start gap-3">
        {ok ? (
          <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        )}
        <div>
          <p className="font-medium text-sm">{title}</p>
          {details.map((d, i) => (
            <p key={i} className={`text-xs ${d.startsWith("⚠") ? "text-warning" : "text-muted-foreground"}`}>{d}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
