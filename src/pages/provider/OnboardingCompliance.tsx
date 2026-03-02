import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderCompliance } from "@/hooks/useProviderCompliance";
import { useProviderApplication } from "@/hooks/useProviderApplication";
import { useCategoryRequirements } from "@/hooks/useCategoryRequirements";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DynamicComplianceRenderer from "@/components/provider/DynamicComplianceRenderer";

interface ComplianceDoc {
  docType: string;
  storagePath: string | null;
}

export default function OnboardingCompliance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { org, loading: orgLoading } = useProviderOrg();
  const { application } = useProviderApplication();

  const orgId = location.state?.orgId || org?.id;
  const allowedZoneIds = location.state?.allowedZoneIds || [];

  const { compliance, upsertCompliance } = useProviderCompliance(orgId);

  // Derive requested categories from application
  const requestedCategories: string[] =
    application.data?.requested_categories ?? [];

  const { merged, isLoading: reqLoading } =
    useCategoryRequirements(requestedCategories);

  // Attestation state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [insuranceAttested, setInsuranceAttested] = useState(false);
  const [businessType, setBusinessType] = useState("individual");
  const [taxFormAttested, setTaxFormAttested] = useState(false);
  const [bgCheck, setBgCheck] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [hasEmployees, setHasEmployees] = useState(false);
  const [workersCompAttested, setWorkersCompAttested] = useState(false);

  // Document upload state
  const [documents, setDocuments] = useState<ComplianceDoc[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Hydrate from existing compliance record
  useEffect(() => {
    if (compliance) {
      setTermsAccepted(!!compliance.terms_accepted_at);
      setInsuranceAttested(compliance.insurance_attested);
      setBusinessType(compliance.business_type || "individual");
      setTaxFormAttested(compliance.tax_form_attested);
      setBgCheck(compliance.background_check_consented);
    }
  }, [compliance]);

  // Fetch existing compliance documents
  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("provider_compliance_documents")
      .select("doc_type, storage_path")
      .eq("org_id", orgId)
      .then(({ data }) => {
        if (data) {
          setDocuments(
            data.map((d) => ({ docType: d.doc_type, storagePath: d.storage_path }))
          );
        }
      });
  }, [orgId]);

  const handleFileUpload = async (file: File, docType: string) => {
    if (!orgId) return;
    setUploadingDocType(docType);
    try {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${docType}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("provider-documents")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Upsert into provider_compliance_documents
      const { error: dbError } = await supabase
        .from("provider_compliance_documents")
        .upsert(
          {
            org_id: orgId,
            doc_type: docType,
            storage_path: path,
            status: "pending_review",
          } as any,
          { onConflict: "org_id,doc_type" }
        );
      if (dbError) throw dbError;

      setDocuments((prev) => {
        const without = prev.filter((d) => d.docType !== docType);
        return [...without, { docType, storagePath: path }];
      });
      toast.success(`${docType.replace(/_/g, " ")} uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingDocType(null);
    }
  };

  const canContinue = () => {
    if (!termsAccepted) return false;
    if (!merged) return false;
    if (merged.requiresGlInsurance && !insuranceAttested) return false;
    if (merged.requiresBackgroundCheck && !bgCheck) return false;
    if (merged.requiresWorkersComp && hasEmployees && !workersCompAttested)
      return false;
    // COI upload required
    if (
      merged.requiresCoiUpload &&
      !documents.some((d) => d.docType === "coi" && d.storagePath)
    )
      return false;
    // License required
    if (merged.requiresLicense && !licenseNumber.trim()) return false;
    if (
      merged.requiresLicense &&
      !documents.some((d) => d.docType === "license" && d.storagePath)
    )
      return false;
    return true;
  };

  const handleContinue = async () => {
    if (!canContinue()) {
      toast.error("Please complete all required fields");
      return;
    }
    setSaving(true);
    try {
      // Save compliance attestations
      await upsertCompliance.mutateAsync({
        orgId,
        termsAccepted,
        insuranceAttested,
        businessType,
        taxFormAttested,
        backgroundCheckConsented: bgCheck,
        // Legacy doc URLs from old flow — keep for backward compat
        insuranceDocUrl:
          documents.find((d) => d.docType === "gl_insurance")?.storagePath ??
          documents.find((d) => d.docType === "coi")?.storagePath ??
          undefined,
        taxDocUrl:
          documents.find((d) => d.docType === "tax")?.storagePath ?? undefined,
      });

      // Save license info into application compliance_json if present
      if (merged?.requiresLicense && licenseNumber) {
        await supabase
          .from("provider_applications")
          .update({
            compliance_json: {
              license_number: licenseNumber,
              license_state: licenseState,
              has_employees: hasEmployees,
              workers_comp_attested: workersCompAttested,
            } as any,
          })
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
          .order("created_at", { ascending: false })
          .limit(1);
      }

      toast.success("Compliance details saved");
      navigate("/provider/onboarding/agreement", {
        state: { orgId, allowedZoneIds },
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (orgLoading || reqLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Fallback if no category requirements found (e.g. no application yet)
  const fallbackMerged = merged ?? {
    maxRiskTier: 0,
    requiresGlInsurance: false,
    requiresCoiUpload: false,
    requiresLicense: false,
    licenseAuthorities: [],
    requiresBackgroundCheck: false,
    requiresWorkersComp: false,
    requiresInHomeAccess: false,
    opsReviewRequired: false,
    categoriesRequiringLicense: [],
    categoriesRequiringCoi: [],
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <p className="text-caption mb-1">Step 4 of 6</p>
      <h1 className="text-h2 mb-1">Compliance</h1>
      <p className="text-caption mb-6">
        {requestedCategories.length > 0
          ? `Requirements based on your selected categories (${requestedCategories.length}).`
          : "A few quick confirmations before you submit."}
      </p>

      <DynamicComplianceRenderer
        merged={fallbackMerged}
        termsAccepted={termsAccepted}
        insuranceAttested={insuranceAttested}
        businessType={businessType}
        taxFormAttested={taxFormAttested}
        bgCheck={bgCheck}
        licenseNumber={licenseNumber}
        licenseState={licenseState}
        hasEmployees={hasEmployees}
        workersCompAttested={workersCompAttested}
        onTermsChange={setTermsAccepted}
        onInsuranceChange={setInsuranceAttested}
        onBusinessTypeChange={setBusinessType}
        onTaxFormChange={setTaxFormAttested}
        onBgCheckChange={setBgCheck}
        onLicenseNumberChange={setLicenseNumber}
        onLicenseStateChange={setLicenseState}
        onHasEmployeesChange={setHasEmployees}
        onWorkersCompChange={setWorkersCompAttested}
        documents={documents}
        uploadingDocType={uploadingDocType}
        onUploadDocument={handleFileUpload}
      />

      <Button
        className="w-full mt-6"
        onClick={handleContinue}
        disabled={saving || !canContinue()}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
