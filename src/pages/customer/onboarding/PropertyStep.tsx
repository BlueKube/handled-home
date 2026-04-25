import { useState, useEffect } from "react";
import { useProperty, formatPetsForDisplay, type PropertyFormData } from "@/hooks/useProperty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Home, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { stripNonDigits, validateProperty, type FieldErrors } from "./shared";

export function PropertyStep({ onComplete }: { onComplete: () => Promise<void> }) {
  const { property, save, isSaving } = useProperty();
  const [form, setForm] = useState<PropertyFormData>({
    street_address: "", city: "", state: "", zip_code: "",
    gate_code: "", access_instructions: "", parking_instructions: "",
    pets_input: "", notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (property) {
      setForm({
        street_address: property.street_address || "", city: property.city || "",
        state: property.state || "", zip_code: property.zip_code || "",
        gate_code: property.gate_code || "", access_instructions: property.access_instructions || "",
        parking_instructions: property.parking_instructions || "",
        pets_input: formatPetsForDisplay(property.pets), notes: property.notes || "",
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
      await save(normalized);
      await onComplete();
    } catch {
      toast.error("Your address couldn't be saved — check your connection and try again.");
    }
  };

  const isValid = Object.keys(validateProperty(form)).length === 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Home className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Tell us about your home</h1>
        <p className="text-muted-foreground text-sm mt-1">We need a few details to match you with the right service team.</p>
      </div>
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Confirms which zone serves your home.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="ob-street">Street Address *</Label>
          <Input id="ob-street" value={form.street_address} onChange={(e) => updateField("street_address", e.target.value)} placeholder="123 Main St" />
          {errors.street_address && <p className="text-xs text-destructive">{errors.street_address}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ob-city">City *</Label>
            <Input id="ob-city" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Los Angeles" />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-state">State *</Label>
            <Input id="ob-state" value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder="TX" maxLength={2} className="uppercase" />
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ob-zip">Zip Code *</Label>
          <Input id="ob-zip" inputMode="numeric" value={form.zip_code} onChange={(e) => updateField("zip_code", e.target.value)} placeholder="90210" maxLength={5} />
          {errors.zip_code && <p className="text-xs text-destructive">{errors.zip_code}</p>}
        </div>
        <details className="group">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">+ Access details, pets, notes (optional)</summary>
          <div className="space-y-4 mt-3">
            <div className="space-y-1.5"><Label htmlFor="ob-gate">Gate Code</Label><Input id="ob-gate" value={form.gate_code} onChange={(e) => updateField("gate_code", e.target.value)} placeholder="#1234" /></div>
            <div className="space-y-1.5"><Label htmlFor="ob-access">Access Instructions</Label><Textarea id="ob-access" value={form.access_instructions} onChange={(e) => updateField("access_instructions", e.target.value)} placeholder="Enter through the side gate" rows={2} /></div>
            <div className="space-y-1.5"><Label htmlFor="ob-parking">Parking Notes</Label><Textarea id="ob-parking" value={form.parking_instructions} onChange={(e) => updateField("parking_instructions", e.target.value)} placeholder="Park in the driveway" rows={2} /></div>
            <div className="space-y-1.5"><Label htmlFor="ob-pets">Pets</Label><Input id="ob-pets" value={form.pets_input} onChange={(e) => updateField("pets_input", e.target.value)} placeholder="dog, cat" /></div>
            <div className="space-y-1.5"><Label htmlFor="ob-notes">Anything Else</Label><Textarea id="ob-notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Anything we should know?" rows={2} /></div>
          </div>
        </details>
      </div>
      <Button onClick={handleSubmit} disabled={!isValid || isSaving} className="w-full h-12 text-base font-semibold rounded-xl">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
