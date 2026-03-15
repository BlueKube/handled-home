import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderMembers } from "@/hooks/useProviderMembers";
import { useProviderCompliance } from "@/hooks/useProviderCompliance";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Phone,
  Globe,
  MapPin,
  User,
  FileText,
  ChevronLeft,
} from "lucide-react";

interface FormErrors {
  name?: string;
  contact_phone?: string;
  home_base_zip?: string;
}

function validateOrgForm(form: { name: string; contact_phone: string; home_base_zip: string }): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Company name is required.";
  if (form.contact_phone && !/^\+?[\d\s\-().]{7,20}$/.test(form.contact_phone)) {
    errors.contact_phone = "Enter a valid phone number.";
  }
  if (form.home_base_zip && !/^\d{5}(-\d{4})?$/.test(form.home_base_zip)) {
    errors.home_base_zip = "Enter a valid 5-digit ZIP code.";
  }
  return errors;
}

function OrgProfileSection() {
  const { org, updateOrg } = useProviderOrg();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: org?.name ?? "",
    contact_phone: org?.contact_phone ?? "",
    home_base_zip: org?.home_base_zip ?? "",
    website: org?.website ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  if (!org) return null;

  const handleSave = async () => {
    const validationErrors = validateOrgForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await updateOrg.mutateAsync({ id: org.id, ...form });
      toast.success("Organization updated");
      setEditing(false);
      setErrors({});
    } catch {
      toast.error("Failed to update organization");
    }
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Organization Profile
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => {
              setForm({
                name: org.name ?? "",
                contact_phone: org.contact_phone ?? "",
                home_base_zip: org.home_base_zip ?? "",
                website: org.website ?? "",
              });
              setErrors({});
              setEditing(true);
            }}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={Building2} label="Company" value={org.name} />
            <InfoRow icon={Phone} label="Phone" value={org.contact_phone || "Not set"} />
            <InfoRow icon={MapPin} label="Home ZIP" value={org.home_base_zip || "Not set"} />
            <InfoRow icon={Globe} label="Website" value={org.website || "Not set"} />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant={org.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
              {org.status}
            </Badge>
            {org.needs_review && (
              <Badge variant="outline" className="text-xs">
                Pending Review
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Edit Organization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Company Name *</Label>
          <Input id="org-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-phone">Contact Phone</Label>
          <Input id="org-phone" value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="(555) 123-4567" />
          {errors.contact_phone && <p className="text-xs text-destructive">{errors.contact_phone}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-zip">Home Base ZIP</Label>
          <Input id="org-zip" value={form.home_base_zip} onChange={(e) => setForm((f) => ({ ...f, home_base_zip: e.target.value }))} placeholder="12345" maxLength={10} />
          {errors.home_base_zip && <p className="text-xs text-destructive">{errors.home_base_zip}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-web">Website</Label>
          <Input id="org-web" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={updateOrg.isPending} className="flex-1">
            {updateOrg.isPending ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={() => { setEditing(false); setErrors({}); }} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSection() {
  const { org } = useProviderOrg();
  const { members, loading } = useProviderMembers(org?.id);

  if (loading) return <Skeleton className="h-32 rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Team Members
          </CardTitle>
          <Badge variant="outline" className="text-xs">{members.length} member{members.length !== 1 ? "s" : ""}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.display_name || "Team Member"}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {m.role_in_org?.toLowerCase().replace(/_/g, " ") ?? "Member"}
                  </p>
                </div>
                {m.phone && (
                  <span className="text-xs text-muted-foreground">{m.phone}</span>
                )}
                <Badge variant={m.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComplianceSection() {
  const { org } = useProviderOrg();
  const { compliance, loading } = useProviderCompliance(org?.id);

  if (loading) return <Skeleton className="h-40 rounded-xl" />;

  const checks = [
    { label: "Terms Accepted", done: !!compliance?.terms_accepted_at, icon: FileText },
    { label: "Insurance Attested", done: !!compliance?.insurance_attested, icon: Shield },
    { label: "Tax Form Attested", done: !!compliance?.tax_form_attested, icon: FileText },
    { label: "Background Check Consent", done: !!compliance?.background_check_consented, icon: Shield },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Compliance & Insurance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!compliance ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Compliance information not yet submitted
          </p>
        ) : (
          <div className="space-y-3">
            {compliance.business_type && (
              <div className="flex items-center gap-2 pb-2">
                <span className="text-sm text-muted-foreground">Business Type:</span>
                <Badge variant="outline" className="capitalize text-xs">
                  {compliance.business_type}
                </Badge>
              </div>
            )}
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                {c.done ? (
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive/60 shrink-0" />
                )}
                <span className="text-sm">{c.label}</span>
              </div>
            ))}
            {compliance.notes && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground">{compliance.notes}</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProviderOrganization() {
  const navigate = useNavigate();
  const { org, loading, isError, refetch } = useProviderOrg();

  if (loading) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4 ">
        <h1 className="text-h2">Organization</h1>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4 ">
        <h1 className="text-h2">Organization</h1>
        <QueryErrorCard message="Failed to load organization data." onRetry={() => refetch()} />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="animate-fade-in p-4 pb-24 ">
        <h1 className="text-h2">Organization</h1>
        <Card className="p-6 mt-4">
          <div className="text-center space-y-2">
            <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No organization found. Complete provider onboarding to set up your organization.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/provider/settings")} aria-label="Back to settings">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-h2">Organization</h1>
      </div>
      <OrgProfileSection />
      <TeamSection />
      <ComplianceSection />
    </div>
  );
}
