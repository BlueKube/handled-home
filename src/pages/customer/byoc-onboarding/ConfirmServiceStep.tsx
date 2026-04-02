import { useState, useEffect } from "react";
import { useProperty, PropertyFormData, formatPetsForDisplay } from "@/hooks/useProperty";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { CADENCE_LABELS, FieldErrors, stripNonDigits, validateProperty } from "./shared";

export function ConfirmServiceStep({
  providerName,
  providerLogoUrl,
  categoryLabel,
  cadence,
  onNext,
  onSkip,
}: {
  providerName: string;
  providerLogoUrl: string | null;
  categoryLabel: string;
  cadence: string;
  onNext: (propertyId?: string) => void;
  onSkip: () => void;
}) {
  const { property, save, isSaving } = useProperty();
  const [form, setForm] = useState<PropertyFormData>({
    street_address: "", city: "", state: "", zip_code: "",
    gate_code: "", access_instructions: "", parking_instructions: "",
    pets_input: "", notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);
  const initial = providerName.charAt(0).toUpperCase();

  useEffect(() => {
    if (property) {
      setForm({
        street_address: property.street_address || "",
        city: property.city || "",
        state: property.state || "",
        zip_code: property.zip_code || "",
        gate_code: property.gate_code || "",
        access_instructions: property.access_instructions || "",
        parking_instructions: property.parking_instructions || "",
        pets_input: formatPetsForDisplay(property.pets),
        notes: property.notes || "",
      });
    }
  }, [property]);

  const updateField = (field: keyof PropertyFormData, value: string) => {
    let finalValue = value;
    if (field === "state") finalValue = value.toUpperCase().slice(0, 2);
    if (field === "zip_code") finalValue = stripNonDigits(value);
    const newForm = { ...form, [field]: finalValue };
    setForm(newForm);
    if (touched) setErrors(validateProperty(newForm));
  };

  const handleSubmit = async () => {
    setTouched(true);
    const normalized = { ...form, zip_code: stripNonDigits(form.zip_code) };
    const fieldErrors = validateProperty(normalized);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    try {
      const saved = await save(normalized);
      onNext(saved?.id);
    } catch {
      toast.error("Couldn't save your address — check your connection and try again.");
    }
  };

  const isValid = Object.keys(validateProperty(form)).length === 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-h2">Confirm Your Service</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This is already set up from your provider's invitation.
        </p>
      </div>

      {/* Provider Context Card */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="pt-4 flex gap-4 items-center">
          {providerLogoUrl ? (
            <img
              src={providerLogoUrl}
              alt={providerName}
              className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold border-2 border-primary/20">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{providerName}</p>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                <User className="h-3 w-3 mr-0.5" /> Your provider
              </Badge>
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{categoryLabel}</Badge>
              <Badge variant="outline" className="text-xs">{CADENCE_LABELS[cadence] ?? cadence}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Input */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <h3 className="text-base font-semibold">Confirm Your Address</h3>

          <div className="space-y-1.5">
            <Label htmlFor="byoc-street">Street Address *</Label>
            <Input id="byoc-street" value={form.street_address} onChange={(e) => updateField("street_address", e.target.value)} placeholder="123 Main St" />
            {errors.street_address && <p className="text-xs text-destructive">{errors.street_address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="byoc-city">City *</Label>
              <Input id="byoc-city" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Los Angeles" />
              {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="byoc-state">State *</Label>
              <Input id="byoc-state" value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder="TX" maxLength={2} className="uppercase" />
              {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="byoc-zip">Zip Code *</Label>
            <Input id="byoc-zip" inputMode="numeric" value={form.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} placeholder="90210" maxLength={5} />
            {errors.zip_code && <p className="text-xs text-destructive">{errors.zip_code}</p>}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button onClick={handleSubmit} disabled={!isValid || isSaving} className="w-full h-12 text-base font-semibold rounded-xl">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Next
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <Button variant="ghost" className="w-full text-sm min-h-[44px]" onClick={onSkip}>
        Skip for now — finish setup later
      </Button>
    </div>
  );
}
