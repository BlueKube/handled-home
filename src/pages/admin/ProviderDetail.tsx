import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProviderAdmin } from "@/hooks/useProviderAdmin";
import { useProviderRatingSummary } from "@/hooks/useProviderRatingSummary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Shield, MapPin, Loader2, User, FileText, Star } from "lucide-react";
import { toast } from "sonner";
import { DecisionTraceCard } from "@/components/admin/DecisionTraceCard";
import { AdminReadOnlyMap } from "@/components/admin/AdminReadOnlyMap";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING: "bg-warning/20 text-warning-foreground",
  ACTIVE: "bg-success/20 text-success",
  PROBATION: "bg-warning/20 text-warning",
  SUSPENDED: "bg-destructive/20 text-destructive",
};

export default function AdminProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orgDetailQuery, performAction, updateCoverageStatus } = useProviderAdmin();
  const { data: ratingSummary } = useProviderRatingSummary(id);
  const { data: org, isLoading } = orgDetailQuery(id);
  const [actionDialog, setActionDialog] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  // Fetch today's jobs for map
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: providerJobs } = useQuery({
    queryKey: ["provider-jobs-map", id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, status, scheduled_date, route_order, property:properties(lat, lng, street_address)")
        .eq("provider_org_id", id!)
        .eq("scheduled_date", today)
        .not("status", "eq", "CANCELED")
        .order("route_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const mapStops = (providerJobs ?? [])
    .filter((j: any) => j.property?.lat && j.property?.lng)
    .map((j: any) => ({
      id: j.id,
      lat: j.property.lat,
      lng: j.property.lng,
      label: j.property.street_address,
      status: j.status,
    }));

  if (isLoading) {
    return <div className="p-4 flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!org) {
    return <div className="p-4 text-center py-12 text-muted-foreground">Provider not found.</div>;
  }

  const handleAction = async () => {
    if (!actionDialog || !id) return;
    setActing(true);
    try {
      await performAction.mutateAsync({ orgId: id, action: actionDialog, reason: reason || undefined });
      toast.success(`Provider ${actionDialog.toLowerCase()}d`);
      setActionDialog(null);
      setReason("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActing(false);
    }
  };

  const owner = org.provider_members?.find((m: any) => m.role_in_org === "OWNER");
  const riskFlags = org.provider_risk_flags?.filter((f: any) => f.is_active) || [];

  return (
    <div className="p-4 max-w-4xl animate-fade-in">
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate("/admin/providers")}>
        <ArrowLeft className="h-4 w-4 mr-1" />Back
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-h2">{org.name || "Unnamed Org"}</h1>
        <Badge className={STATUS_COLORS[org.status] || ""}>{org.status}</Badge>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {org.status === "PENDING" && (
          <Button size="sm" onClick={() => setActionDialog("APPROVE")}>
            <CheckCircle className="h-4 w-4 mr-1" />Approve
          </Button>
        )}
        {["ACTIVE", "PENDING"].includes(org.status) && (
          <Button size="sm" variant="outline" onClick={() => setActionDialog("PROBATION")}>
            <AlertTriangle className="h-4 w-4 mr-1" />Probation
          </Button>
        )}
        {org.status !== "SUSPENDED" && (
          <Button size="sm" variant="destructive" onClick={() => setActionDialog("SUSPEND")}>
            <XCircle className="h-4 w-4 mr-1" />Suspend
          </Button>
        )}
        {org.status === "SUSPENDED" && (
          <Button size="sm" onClick={() => setActionDialog("REINSTATE")}>
            <CheckCircle className="h-4 w-4 mr-1" />Reinstate
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          {riskFlags.length > 0 && <TabsTrigger value="risks">Risks ({riskFlags.length})</TabsTrigger>}
          <TabsTrigger value="traces">Traces</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Organization</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {org.name}</div>
                <div><span className="text-muted-foreground">Phone:</span> {org.contact_phone || "—"}</div>
                <div><span className="text-muted-foreground">Home Base ZIP:</span> {org.home_base_zip || "—"}</div>
                <div><span className="text-muted-foreground">Website:</span> {org.website || "—"}</div>
              </CardContent>
            </Card>
            {owner && (
              <Card>
                <CardHeader><CardTitle className="text-base">Accountable Owner</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div>{owner.display_name || "—"}</div>
                  <div className="text-muted-foreground">{owner.phone || "—"}</div>
                </CardContent>
              </Card>
            )}
            {mapStops.length > 0 && (
              <AdminReadOnlyMap stops={mapStops} title="Today's Route" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="ratings">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4" />Rating Summary</CardTitle></CardHeader>
            <CardContent>
              {ratingSummary ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold">{ratingSummary.avg_rating}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-5 w-5 ${s <= Math.round(ratingSummary.avg_rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Reviews</p>
                      <p className="font-medium">{ratingSummary.total_reviews}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Positive (4-5★)</p>
                      <p className="font-medium text-success">{ratingSummary.positive_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Negative (1-2★)</p>
                      <p className="font-medium text-destructive">{ratingSummary.negative_count}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No ratings yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage">
          <div className="space-y-3">
            {org.provider_coverage?.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{c.zones?.name || c.zone_id}</span>
                    <Badge variant={c.request_status === "APPROVED" ? "default" : c.request_status === "DENIED" ? "destructive" : "secondary"}>
                      {c.request_status}
                    </Badge>
                  </div>
                  {c.request_status === "REQUESTED" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateCoverageStatus.mutate({ coverageId: c.id, status: "APPROVED" })}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateCoverageStatus.mutate({ coverageId: c.id, status: "DENIED" })}>Deny</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!org.provider_coverage || org.provider_coverage.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No coverage requests.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="capabilities">
          <div className="space-y-2">
            {org.provider_capabilities?.filter((c: any) => c.is_enabled).map((c: any) => (
              <Card key={c.id}>
                <CardContent className="py-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{c.service_skus?.name || c.capability_key}</span>
                  <Badge variant="outline" className="text-xs">{c.service_skus?.category || c.capability_key}</Badge>
                </CardContent>
              </Card>
            ))}
            {(!org.provider_capabilities || org.provider_capabilities.filter((c: any) => c.is_enabled).length === 0) && (
              <p className="text-muted-foreground text-center py-4">No capabilities declared.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          {org.provider_compliance ? (
            <Card>
              <CardContent className="py-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {org.provider_compliance.terms_accepted_at ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  Terms: {org.provider_compliance.terms_accepted_at ? `Accepted ${new Date(org.provider_compliance.terms_accepted_at).toLocaleDateString()}` : "Not accepted"}
                </div>
                <div className="flex items-center gap-2">
                  {org.provider_compliance.insurance_attested ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                  Insurance: {org.provider_compliance.insurance_attested ? "Attested" : "Not attested"}
                  {org.provider_compliance.insurance_doc_url ? " (doc uploaded)" : " (no doc)"}
                </div>
                <div className="flex items-center gap-2">
                  {org.provider_compliance.tax_form_attested ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                  Tax: {org.provider_compliance.tax_form_attested ? "Attested" : "Not attested"}
                </div>
                <div>Business Type: {org.provider_compliance.business_type || "—"}</div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-center py-4">No compliance data.</p>
          )}
        </TabsContent>

        {riskFlags.length > 0 && (
          <TabsContent value="risks">
            <div className="space-y-2">
              {riskFlags.map((f: any) => (
                <Card key={f.id}>
                  <CardContent className="py-3 flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${f.severity === "HIGH" ? "text-destructive" : f.severity === "MED" ? "text-warning" : "text-muted-foreground"}`} />
                    <span className="text-sm">{f.flag_type.replace(/_/g, " ")}</span>
                    <Badge variant="outline">{f.severity}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="traces">
          <DecisionTraceCard entityType="provider_org" entityId={id} />
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-2">
            {org.provider_enforcement_actions?.map((a: any) => (
              <Card key={a.id}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{a.action_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  {a.reason && <p className="text-xs text-muted-foreground">{a.reason}</p>}
                </CardContent>
              </Card>
            ))}
            {(!org.provider_enforcement_actions || org.provider_enforcement_actions.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No enforcement history.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(v) => { if (!v) setActionDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog === "APPROVE" ? "Approve Provider" : actionDialog === "SUSPEND" ? "Suspend Provider" : actionDialog === "PROBATION" ? "Place on Probation" : "Reinstate Provider"}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a reason..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={handleAction} disabled={acting} variant={actionDialog === "SUSPEND" ? "destructive" : "default"}>
              {acting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionDialog}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
