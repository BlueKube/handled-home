import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProviderCompliance } from "@/hooks/useProviderCompliance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingCompliance() {
  const navigate = useNavigate();
  const location = useLocation();
  const orgId = location.state?.orgId;
  const allowedZoneIds = location.state?.allowedZoneIds || [];
  const { compliance, upsertCompliance } = useProviderCompliance(orgId);

  const [termsAccepted, setTermsAccepted] = useState(!!compliance?.terms_accepted_at);
  const [insuranceAttested, setInsuranceAttested] = useState(compliance?.insurance_attested ?? false);
  const [businessType, setBusinessType] = useState(compliance?.business_type || "individual");
  const [taxFormAttested, setTaxFormAttested] = useState(compliance?.tax_form_attested ?? false);
  const [bgCheck, setBgCheck] = useState(compliance?.background_check_consented ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (compliance) {
      setTermsAccepted(!!compliance.terms_accepted_at);
      setInsuranceAttested(compliance.insurance_attested);
      setBusinessType(compliance.business_type || "individual");
      setTaxFormAttested(compliance.tax_form_attested);
      setBgCheck(compliance.background_check_consented);
    }
  }, [compliance]);

  const handleContinue = async () => {
    if (!termsAccepted) { toast.error("You must accept the terms"); return; }
    setSaving(true);
    try {
      await upsertCompliance.mutateAsync({
        orgId,
        termsAccepted,
        insuranceAttested,
        businessType,
        taxFormAttested,
        backgroundCheckConsented: bgCheck,
      });
      toast.success("Compliance details saved");
      navigate("/provider/onboarding/review", { state: { orgId, allowedZoneIds } });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <p className="text-caption mb-1">Step 4 of 5</p>
      <h1 className="text-h2 mb-1">Compliance</h1>
      <p className="text-caption mb-6">A few quick confirmations before you submit.</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Attestations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <Checkbox checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(!!v)} id="terms" />
            <label htmlFor="terms" className="text-sm leading-tight">
              I accept the <span className="text-accent underline">Terms of Service</span> and <span className="text-accent underline">Provider Agreement</span>. *
            </label>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox checked={insuranceAttested} onCheckedChange={(v) => setInsuranceAttested(!!v)} id="insurance" />
            <label htmlFor="insurance" className="text-sm leading-tight">I carry the required insurance coverage for my services.</label>
          </div>

          <div>
            <Label>Business Type</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual / Sole Proprietor</SelectItem>
                <SelectItem value="company">Company / LLC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox checked={taxFormAttested} onCheckedChange={(v) => setTaxFormAttested(!!v)} id="tax" />
            <label htmlFor="tax" className="text-sm leading-tight">I will provide a W-9 or equivalent tax form if requested.</label>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox checked={bgCheck} onCheckedChange={(v) => setBgCheck(!!v)} id="bg" />
            <label htmlFor="bg" className="text-sm leading-tight">I consent to a background check if required. (Optional)</label>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleContinue} disabled={saving || !termsAccepted}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
