import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderMembers } from "@/hooks/useProviderMembers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingOrg() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { org, createOrg, updateOrg } = useProviderOrg();
  const { upsertOwnerMember } = useProviderMembers(org?.id);

  const inviteId = location.state?.inviteId || org?.invite_id;
  const allowedZoneIds = location.state?.allowedZoneIds || [];

  const [name, setName] = useState(org?.name || "");
  const [phone, setPhone] = useState(org?.contact_phone || profile?.phone || "");
  const [zip, setZip] = useState(org?.home_base_zip || "");
  const [website, setWebsite] = useState(org?.website || "");
  const [ownerName, setOwnerName] = useState(profile?.full_name || "");
  const [ownerPhone, setOwnerPhone] = useState(profile?.phone || "");
  const [accountable, setAccountable] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) { toast.error("Organization name is required"); return; }
    if (!accountable) { toast.error("You must acknowledge accountability"); return; }
    setSaving(true);
    try {
      let orgId = org?.id;
      if (!orgId) {
        const created = await createOrg.mutateAsync({
          name: name.trim(),
          contact_phone: phone || undefined,
          home_base_zip: zip || undefined,
          website: website || undefined,
          invite_id: inviteId || undefined,
        });
        orgId = created.id;
      } else {
        await updateOrg.mutateAsync({
          id: orgId,
          name: name.trim(),
          contact_phone: phone || undefined,
          home_base_zip: zip || undefined,
          website: website || undefined,
        });
      }

      // Upsert owner member
      if (user) {
        await upsertOwnerMember.mutateAsync({
          orgId: orgId!,
          userId: user.id,
          displayName: ownerName || profile?.full_name || "",
          phone: ownerPhone || undefined,
        });
      }

      toast.success("Organization details saved");
      navigate("/provider/onboarding/coverage", { state: { orgId, allowedZoneIds } });
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <p className="text-caption mb-1">Step 1 of 5</p>
      <h1 className="text-h2 mb-1">Your Organization</h1>
      <p className="text-caption mb-6">Tell us about your business.</p>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Business Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Organization Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John's Lawn Care" />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
          </div>
          <div>
            <Label>Home Base ZIP</Label>
            <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="90210" maxLength={5} />
            <p className="text-xs text-muted-foreground mt-1">Helps us build dense routes so you drive less. We don't need an exact address.</p>
          </div>
          <div>
            <Label>Website (optional)</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Accountable Owner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Your Name</Label>
            <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </div>
          <div>
            <Label>Your Phone</Label>
            <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox checked={accountable} onCheckedChange={(v) => setAccountable(!!v)} id="accountable" />
            <label htmlFor="accountable" className="text-sm leading-tight">
              I acknowledge that I am the accountable owner and responsible for service quality and standards.
            </label>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleContinue} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
