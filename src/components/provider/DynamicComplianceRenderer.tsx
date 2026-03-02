import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Building2,
} from "lucide-react";

interface ComplianceDocument {
  docType: string;
  storagePath: string | null;
}

interface DynamicComplianceRendererProps {
  merged: {
    maxRiskTier: number;
    requiresGlInsurance: boolean;
    requiresCoiUpload: boolean;
    requiresLicense: boolean;
    licenseAuthorities: string[];
    requiresBackgroundCheck: boolean;
    requiresWorkersComp: boolean;
    requiresInHomeAccess: boolean;
    opsReviewRequired: boolean;
    categoriesRequiringLicense: string[];
    categoriesRequiringCoi: string[];
  };
  // State values
  termsAccepted: boolean;
  insuranceAttested: boolean;
  businessType: string;
  taxFormAttested: boolean;
  bgCheck: boolean;
  licenseNumber: string;
  licenseState: string;
  hasEmployees: boolean;
  workersCompAttested: boolean;
  // State setters
  onTermsChange: (v: boolean) => void;
  onInsuranceChange: (v: boolean) => void;
  onBusinessTypeChange: (v: string) => void;
  onTaxFormChange: (v: boolean) => void;
  onBgCheckChange: (v: boolean) => void;
  onLicenseNumberChange: (v: string) => void;
  onLicenseStateChange: (v: string) => void;
  onHasEmployeesChange: (v: boolean) => void;
  onWorkersCompChange: (v: boolean) => void;
  // Document uploads
  documents: ComplianceDocument[];
  uploadingDocType: string | null;
  onUploadDocument: (file: File, docType: string) => void;
}

const RISK_TIER_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Tier 0 — Minimal", color: "text-success" },
  1: { label: "Tier 1 — Standard", color: "text-primary" },
  2: { label: "Tier 2 — Elevated", color: "text-warning" },
  3: { label: "Tier 3 — Licensed", color: "text-destructive" },
};

export default function DynamicComplianceRenderer({
  merged,
  termsAccepted,
  insuranceAttested,
  businessType,
  taxFormAttested,
  bgCheck,
  licenseNumber,
  licenseState,
  hasEmployees,
  workersCompAttested,
  onTermsChange,
  onInsuranceChange,
  onBusinessTypeChange,
  onTaxFormChange,
  onBgCheckChange,
  onLicenseNumberChange,
  onLicenseStateChange,
  onHasEmployeesChange,
  onWorkersCompChange,
  documents,
  uploadingDocType,
  onUploadDocument,
}: DynamicComplianceRendererProps) {
  const tierInfo = RISK_TIER_LABELS[merged.maxRiskTier] ?? RISK_TIER_LABELS[0];

  const getDocPath = (docType: string) =>
    documents.find((d) => d.docType === docType)?.storagePath ?? null;

  return (
    <div className="space-y-4">
      {/* Risk tier badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={tierInfo.color}>
          {tierInfo.label}
        </Badge>
        {merged.opsReviewRequired && (
          <Badge variant="outline" className="text-warning">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Ops review required
          </Badge>
        )}
      </div>

      {/* Core attestations — always shown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Attestations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={(v) => onTermsChange(!!v)}
              id="terms"
            />
            <label htmlFor="terms" className="text-sm leading-tight">
              I accept the{" "}
              <span className="text-accent underline">Terms of Service</span>{" "}
              and{" "}
              <span className="text-accent underline">Provider Agreement</span>.
              *
            </label>
          </div>

          {/* GL Insurance — shown when required */}
          {merged.requiresGlInsurance && (
            <div className="flex items-start gap-2">
              <Checkbox
                checked={insuranceAttested}
                onCheckedChange={(v) => onInsuranceChange(!!v)}
                id="gl-insurance"
              />
              <label htmlFor="gl-insurance" className="text-sm leading-tight">
                I carry General Liability insurance coverage for my services. *
              </label>
            </div>
          )}

          {/* Business type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Business Type</Label>
            <div className="flex gap-3">
              {[
                { value: "individual", label: "Individual / Sole Prop" },
                { value: "company", label: "Company / LLC" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={businessType === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onBusinessTypeChange(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              checked={taxFormAttested}
              onCheckedChange={(v) => onTaxFormChange(!!v)}
              id="tax"
            />
            <label htmlFor="tax" className="text-sm leading-tight">
              I will provide a W-9 or equivalent tax form if requested.
            </label>
          </div>

          {/* Background check — conditional */}
          {merged.requiresBackgroundCheck && (
            <div className="flex items-start gap-2">
              <Checkbox
                checked={bgCheck}
                onCheckedChange={(v) => onBgCheckChange(!!v)}
                id="bg"
              />
              <label htmlFor="bg" className="text-sm leading-tight">
                I consent to a background check. *
                {merged.requiresInHomeAccess && (
                  <span className="text-muted-foreground block text-xs mt-0.5">
                    Required for in-home access categories.
                  </span>
                )}
              </label>
            </div>
          )}

          {/* Workers comp — conditional on employees */}
          {merged.requiresWorkersComp && (
            <>
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={hasEmployees}
                  onCheckedChange={(v) => onHasEmployeesChange(!!v)}
                  id="has-employees"
                />
                <label htmlFor="has-employees" className="text-sm leading-tight">
                  I have employees (not just myself)
                </label>
              </div>
              {hasEmployees && (
                <div className="flex items-start gap-2 ml-6 animate-fade-in">
                  <Checkbox
                    checked={workersCompAttested}
                    onCheckedChange={(v) => onWorkersCompChange(!!v)}
                    id="workers-comp"
                  />
                  <label
                    htmlFor="workers-comp"
                    className="text-sm leading-tight"
                  >
                    I carry Workers' Compensation insurance. *
                  </label>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* License section — Tier 3 categories */}
      {merged.requiresLicense && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> License Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Required for:{" "}
              {merged.categoriesRequiringLicense
                .map((c) => c.replace(/_/g, " "))
                .join(", ")}
              {merged.licenseAuthorities.length > 0 && (
                <span>
                  {" "}
                  — Authority:{" "}
                  {[...new Set(merged.licenseAuthorities)].join(", ")}
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">License #</Label>
                <Input
                  placeholder="e.g. CSLB 1234567"
                  value={licenseNumber}
                  onChange={(e) => onLicenseNumberChange(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">State</Label>
                <Input
                  placeholder="e.g. CA"
                  maxLength={2}
                  value={licenseState}
                  onChange={(e) =>
                    onLicenseStateChange(e.target.value.toUpperCase())
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* COI — required when requiresCoiUpload */}
          {merged.requiresCoiUpload && (
            <DocUploadRow
              label="Certificate of Insurance (COI)"
              required
              currentPath={getDocPath("coi")}
              uploading={uploadingDocType === "coi"}
              onUpload={(f) => onUploadDocument(f, "coi")}
            />
          )}

          {/* GL Insurance doc — shown when GL required */}
          {merged.requiresGlInsurance && (
            <DocUploadRow
              label="GL Insurance Certificate"
              required={false}
              currentPath={getDocPath("gl_insurance")}
              uploading={uploadingDocType === "gl_insurance"}
              onUpload={(f) => onUploadDocument(f, "gl_insurance")}
            />
          )}

          {/* License doc — Tier 3 */}
          {merged.requiresLicense && (
            <DocUploadRow
              label="License Document"
              required
              currentPath={getDocPath("license")}
              uploading={uploadingDocType === "license"}
              onUpload={(f) => onUploadDocument(f, "license")}
            />
          )}

          {/* Workers comp — when employees */}
          {merged.requiresWorkersComp && hasEmployees && (
            <DocUploadRow
              label="Workers' Comp Certificate"
              required
              currentPath={getDocPath("workers_comp")}
              uploading={uploadingDocType === "workers_comp"}
              onUpload={(f) => onUploadDocument(f, "workers_comp")}
            />
          )}

          {/* Tax form — always */}
          <DocUploadRow
            label="Tax Form (W-9)"
            required={false}
            currentPath={getDocPath("tax")}
            uploading={uploadingDocType === "tax"}
            onUpload={(f) => onUploadDocument(f, "tax")}
          />

          <p className="text-xs text-muted-foreground">
            {merged.requiresCoiUpload
              ? "Required documents must be uploaded before continuing."
              : "Uploading documents now speeds up your review."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DocUploadRow({
  label,
  required,
  currentPath,
  uploading,
  onUpload,
}: {
  label: string;
  required: boolean;
  currentPath: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </p>
        {currentPath ? (
          <p className="text-xs text-success flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Uploaded
          </p>
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
        {uploading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Upload className="h-3 w-3 mr-1" />
        )}
        {currentPath ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}
