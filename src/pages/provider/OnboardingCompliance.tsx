import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderCompliance } from "@/hooks/useProviderCompliance";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, ShieldCheck, Upload, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingCompliance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, loading: orgLoading } = useProviderOrg();

  // P1: Fall back to useProviderOrg
  const orgId = location.state?.orgId || org?.id;
  const allowedZoneIds = location.state?.allowedZoneIds || [];

  const { compliance, upsertCompliance } = useProviderCompliance(orgId);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [insuranceAttested, setInsuranceAttested] = useState(false);
  const [businessType, setBusinessType] = useState("individual");
  const [taxFormAttested, setTaxFormAttested] = useState(false);
  const [bgCheck, setBgCheck] = useState(false);
  const [saving, setSaving] = useState(false);

  // P6: Document upload state
  const [insuranceDocUrl, setInsuranceDocUrl] = useState<string | null>(null);
  const [taxDocUrl, setTaxDocUrl] = useState<string | null>(null);
  const [otherDocUrl, setOtherDocUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (compliance) {
      setTermsAccepted(!!compliance.terms_accepted_at);
      setInsuranceAttested(compliance.insurance_attested);
      setBusinessType(compliance.business_type || "individual");
      setTaxFormAttested(compliance.tax_form_attested);
      setBgCheck(compliance.background_check_consented);
      setInsuranceDocUrl(compliance.insurance_doc_url);
      setTaxDocUrl(compliance.tax_doc_url);
      setOtherDocUrl(compliance.other_doc_url);
    }
  }, [compliance]);

  // P6: File upload handler
  const handleFileUpload = async (file: File, docType: "insurance" | "tax" | "other") => {
    if (!orgId) return;
    setUploading(docType);
    try {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${docType}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("provider-documents")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("provider-documents")
        .getPublicUrl(path);

      // Store the path (not public URL) since bucket is private — use signed URLs at read time
      const storedUrl = path;
      if (docType === "insurance") setInsuranceDocUrl(storedUrl);
      else if (docType === "tax") setTaxDocUrl(storedUrl);
      else setOtherDocUrl(storedUrl);
      toast.success(`${docType} document uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

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
        insuranceDocUrl,
        taxDocUrl,
        otherDocUrl,
      });
      toast.success("Compliance details saved");
      navigate("/provider/onboarding/agreement", { state: { orgId, allowedZoneIds } });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (orgLoading) {
    return <div className="p-4 flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <p className="text-caption mb-1">Step 4 of 6</p>
      <h1 className="text-h2 mb-1">Compliance</h1>
      <p className="text-caption mb-6">A few quick confirmations before you submit.</p>

      <Card className="mb-4">
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

      {/* P6: Document uploads */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DocUpload
            label="Insurance Certificate"
            currentUrl={insuranceDocUrl}
            uploading={uploading === "insurance"}
            onUpload={(f) => handleFileUpload(f, "insurance")}
          />
          <DocUpload
            label="Tax Form (W-9)"
            currentUrl={taxDocUrl}
            uploading={uploading === "tax"}
            onUpload={(f) => handleFileUpload(f, "tax")}
          />
          <DocUpload
            label="Other Document"
            currentUrl={otherDocUrl}
            uploading={uploading === "other"}
            onUpload={(f) => handleFileUpload(f, "other")}
          />
          <p className="text-xs text-muted-foreground">Uploading documents now speeds up your review. You can also provide them later.</p>
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

function DocUpload({ label, currentUrl, uploading, onUpload }: {
  label: string;
  currentUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {currentUrl ? (
          <p className="text-xs text-success flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Uploaded</p>
        ) : (
          <p className="text-xs text-muted-foreground">Not uploaded</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
        {currentUrl ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}
