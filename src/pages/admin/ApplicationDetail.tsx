import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminApplications, useApplicationDetail } from "@/hooks/useAdminApplications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ChevronLeft, Loader2, CheckCircle, XCircle, Clock, FileText,
  Shield, Users, AlertTriangle, Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { QueryErrorCard } from "@/components/QueryErrorCard";

const CLAUSE_LABELS: Record<string, string> = {
  platform_role: "Platform Role",
  pricing_authority: "Pricing Authority",
  scheduling_compliance: "Scheduling Compliance",
  quality_standards: "Quality Standards",
  photo_documentation: "Photo Documentation",
  customer_communication: "Customer Communication",
  service_guarantee: "Service Guarantee",
  insurance_requirements: "Insurance Requirements",
  background_check: "Background Check",
  termination_conditions: "Termination Conditions",
  data_privacy: "Data Privacy",
  dispute_resolution: "Dispute Resolution",
};

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reviewApplication } = useAdminApplications();
  const query = useApplicationDetail(id!);
  const [decisionDialog, setDecisionDialog] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (query.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (query.isError) return <div className="p-6"><QueryErrorCard /></div>;

  if (!query.data) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-muted-foreground">Application not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/providers/applications")}>
          Back to Applications
        </Button>
      </div>
    );
  }

  const app = query.data;
  const categories = app.requested_categories || [app.category];
  const byoc = app.byoc_estimate_json as Record<string, unknown> | null;
  const isActionable = ["submitted", "under_review", "approved_conditional"].includes(app.status);
  const clausesAccepted = app.agreement_clauses?.length || 0;
  const complianceDocs = app.compliance_docs || [];

  const handleDecision = async () => {
    if (!decisionDialog) return;
    try {
      await reviewApplication.mutateAsync({
        application_id: id!,
        decision: decisionDialog,
        reason: reason.trim() || undefined,
      });
      toast.success(`Application ${decisionDialog.replace(/_/g, " ")}`);
      setDecisionDialog(null);
      setReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to process decision");
    }
  };

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <Button variant="ghost" size="icon" className="mb-2" onClick={() => navigate("/admin/providers/applications")} aria-label="Back to applications">
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-h2">Application Review</h1>
          <Badge variant={isActionable ? "default" : "secondary"}>{app.status.replace(/_/g, " ")}</Badge>
        </div>
        <p className="text-caption">
          Submitted {app.submitted_at ? format(new Date(app.submitted_at), "MMM d, yyyy 'at' h:mm a") : "—"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" /> Applicant Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="User ID" value={app.user_id.slice(0, 12) + "..."} />
            <Row label="Categories" value={categories.map((c: string) => c.replace(/_/g, " ")).join(", ")} />
            <Row label="ZIP Codes" value={app.zip_codes?.join(", ") || "—"} />
            {app.requested_zone_ids?.length > 0 && (
              <Row label="Requested Zones" value={`${app.requested_zone_ids.length} zone(s)`} />
            )}
            <Row label="Founding Partner" value={app.founding_partner ? "Yes" : "No"} />
            {app.pitch_variant_seen && <Row label="Pitch Variant" value={app.pitch_variant_seen} />}
            {app.provider_orgs?.name && (
              <Row label="Linked Org" value={app.provider_orgs.name} />
            )}
          </CardContent>
        </Card>

        {/* BYOC Estimate */}
        {byoc && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> BYOC Estimate</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Estimated Customers" value={String(byoc.estimated_count ?? "—")} />
              <Row label="Willingness" value={String(byoc.willingness ?? "—")} />
              <Row label="Relationship Type" value={String(byoc.relationship_type ?? "—")} />
              <Row label="Willing to Invite" value={byoc.willing_to_invite ? "Yes" : "No"} />
            </CardContent>
          </Card>
        )}

        {/* Agreement Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" /> Agreement ({clausesAccepted}/12 clauses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CLAUSE_LABELS).map(([key, label]) => {
                const accepted = app.agreement_clauses?.some((c) => c.clause_key === key);
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    {accepted ? (
                      <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={accepted ? "" : "text-muted-foreground"}>{label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Compliance Documents ({complianceDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complianceDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No compliance documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {complianceDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium capitalize">{doc.doc_type.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground ml-2">({doc.status})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decision Reason (if already decided) */}
        {app.decision_reason && (
          <Alert>
            <AlertDescription>
              <span className="font-medium">Decision note:</span> {app.decision_reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Decision Buttons */}
        {isActionable && (
          <Card>
            <CardHeader><CardTitle className="text-base">Decision</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setDecisionDialog("approved")} className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button variant="outline" onClick={() => setDecisionDialog("approved_conditional")}>
                  <AlertTriangle className="h-4 w-4 mr-1" /> Conditional
                </Button>
                <Button variant="secondary" onClick={() => setDecisionDialog("waitlisted")}>
                  <Clock className="h-4 w-4 mr-1" /> Waitlist
                </Button>
                <Button variant="destructive" onClick={() => setDecisionDialog("rejected")}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Decision Dialog */}
      <Dialog open={!!decisionDialog} onOpenChange={(open) => { if (!open) setDecisionDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {decisionDialog?.replace(/_/g, " ")} Application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason / Note (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a note about this decision..."
                rows={3}
              />
            </div>
            {decisionDialog === "approved" && (
              <Alert>
                <AlertDescription className="text-xs">
                  Approving will create a provider organization and add the applicant as owner. They'll receive a notification to begin onboarding.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialog(null)}>Cancel</Button>
            <Button
              onClick={handleDecision}
              disabled={reviewApplication.isPending}
              variant={decisionDialog === "rejected" ? "destructive" : "default"}
            >
              {reviewApplication.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm {decisionDialog?.replace(/_/g, " ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
