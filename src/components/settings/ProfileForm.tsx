import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User, Phone } from "lucide-react";

const phoneRegex = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

export function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    if (!user) return;
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (phone && !phoneRegex.test(phone.trim())) {
      newErrors.phone = "Enter a valid phone number (e.g., (555) 123-4567)";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Saved", description: "Profile updated successfully." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-muted-foreground" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setErrors((prev) => ({ ...prev, fullName: "" })); }}
            placeholder="Your name"
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-sm text-destructive mt-1" role="alert">{errors.fullName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: "" })); }}
              placeholder="(555) 123-4567"
              className="pl-9"
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
          </div>
          {errors.phone && (
            <p id="phone-error" className="text-sm text-destructive mt-1" role="alert">{errors.phone}</p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
