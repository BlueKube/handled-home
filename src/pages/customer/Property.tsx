import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useProperty, formatPetsForDisplay, PropertyFormData } from "@/hooks/useProperty";
import { useZoneLookup } from "@/hooks/useZoneLookup";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MapPin, AlertTriangle, CheckCircle2, X, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface FieldErrors {
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

function validate(form: PropertyFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.street_address.trim()) errors.street_address = "Street address is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  const zip = form.zip_code.replace(/\D/g, "");
  if (!zip) errors.zip_code = "Zip code is required";
  else if (zip.length !== 5) errors.zip_code = "Zip code must be exactly 5 digits";
  return errors;
}

function stripNonDigits(val: string): string {
  return val.replace(/\D/g, "").slice(0, 5);
}

export default function CustomerProperty() {
  const { property, isLoading, save, isSaving } = useProperty();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isGated = searchParams.get("gated") === "1";
  const [showGatedBanner, setShowGatedBanner] = useState(isGated);
  const [showExpansionDialog, setShowExpansionDialog] = useState(false);

  const [form, setForm] = useState<PropertyFormData>({
    street_address: "",
    city: "",
    state: "CA",
    zip_code: "",
    gate_code: "",
    access_instructions: "",
    parking_instructions: "",
    pets_input: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  // Prefill from existing property
  useEffect(() => {
    if (property) {
      setForm({
        street_address: property.street_address || "",
        city: property.city || "",
        state: property.state || "CA",
        zip_code: property.zip_code || "",
        gate_code: property.gate_code || "",
        access_instructions: property.access_instructions || "",
        parking_instructions: property.parking_instructions || "",
        pets_input: formatPetsForDisplay(property.pets),
        notes: property.notes || "",
      });
    }
  }, [property]);

  const { zoneName, isLoading: zoneLoading, isNotCovered, isCovered } = useZoneLookup(form.zip_code);

  const updateField = (field: keyof PropertyFormData, value: string) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    if (touched) {
      const newErrors = validate(newForm);
      setErrors(newErrors);
    }
  };

  const handleSubmit = async () => {
    setTouched(true);
    const normalized = { ...form, zip_code: stripNonDigits(form.zip_code) };
    const fieldErrors = validate(normalized);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    try {
      await save(normalized);
      // Remove gated param after successful save
      if (isGated) {
        searchParams.delete("gated");
        setSearchParams(searchParams, { replace: true });
        setShowGatedBanner(false);
      }
      // Show expansion dialog if zip is not covered
      if (isNotCovered) {
        setShowExpansionDialog(true);
      }
    } catch {
      // Error handled in hook
    }
  };

  const isValid = Object.keys(validate(form)).length === 0;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-h2 text-foreground">Your Home</h1>
        <p className="text-caption mt-1">A few details so we can serve you smoothly.</p>
      </div>

      {/* Gated banner */}
      {showGatedBanner && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3">
          <MapPin className="h-4 w-4 text-accent shrink-0" />
          <span className="text-sm text-foreground flex-1">Add your home details to continue.</span>
          <button
            onClick={() => setShowGatedBanner(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Section A — Address */}
      <div className="px-4 space-y-4">
        <h2 className="text-h3 text-foreground">Address</h2>

        <div className="space-y-1.5">
          <Label htmlFor="street_address">Street Address *</Label>
          <Input
            id="street_address"
            value={form.street_address}
            onChange={(e) => updateField("street_address", e.target.value)}
            placeholder="123 Main St"
            aria-describedby={errors.street_address ? "err-street" : undefined}
          />
          {errors.street_address && (
            <p id="err-street" className="text-xs text-destructive">{errors.street_address}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Los Angeles"
              aria-describedby={errors.city ? "err-city" : undefined}
            />
            {errors.city && (
              <p id="err-city" className="text-xs text-destructive">{errors.city}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
              placeholder="CA"
              aria-describedby={errors.state ? "err-state" : undefined}
            />
            {errors.state && (
              <p id="err-state" className="text-xs text-destructive">{errors.state}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zip_code">Zip Code *</Label>
          <Input
            id="zip_code"
            inputMode="numeric"
            value={form.zip_code}
            onChange={(e) => updateField("zip_code", stripNonDigits(e.target.value))}
            placeholder="90210"
            maxLength={5}
            aria-describedby={errors.zip_code ? "err-zip" : "zip-helper"}
          />
          {errors.zip_code && (
            <p id="err-zip" className="text-xs text-destructive">{errors.zip_code}</p>
          )}
          <div id="zip-helper" className="flex items-center gap-1.5 min-h-[20px]">
            {zoneLoading && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Checking coverage…</span>
              </>
            )}
            {isCovered && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-success font-medium">Zone: {zoneName}</span>
              </>
            )}
            {isNotCovered && (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs text-warning font-medium">Service is not yet available in your area. We'll notify you when we launch here.</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section B — Access & Logistics */}
      <div className="px-4 mt-6 space-y-4">
        <h2 className="text-h3 text-foreground">Access & Logistics</h2>

        <div className="space-y-1.5">
          <Label htmlFor="gate_code">Gate Code</Label>
          <Input
            id="gate_code"
            value={form.gate_code}
            onChange={(e) => updateField("gate_code", e.target.value)}
            placeholder="e.g. #1234"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="access_instructions">Access Instructions</Label>
          <Textarea
            id="access_instructions"
            value={form.access_instructions}
            onChange={(e) => updateField("access_instructions", e.target.value)}
            placeholder="e.g. Enter through the side gate on the left"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parking_instructions">Parking Notes</Label>
          <Textarea
            id="parking_instructions"
            value={form.parking_instructions}
            onChange={(e) => updateField("parking_instructions", e.target.value)}
            placeholder="e.g. Park in the driveway"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pets_input">Pets</Label>
          <Input
            id="pets_input"
            value={form.pets_input}
            onChange={(e) => updateField("pets_input", e.target.value)}
            placeholder="Example: dog, cat"
          />
          <p className="text-xs text-muted-foreground">Separate with commas</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Anything Else</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Anything else we should know?"
            rows={3}
          />
        </div>
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSaving}
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>

      {/* Non-serviced area dialog */}
      <Dialog open={showExpansionDialog} onOpenChange={setShowExpansionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>We're Not in Your Area Yet</DialogTitle>
            <DialogDescription>
              Handled Home is expanding. We'll notify you as soon as we launch in your neighborhood.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => {
                toast.success("We'll let you know!");
                setShowExpansionDialog(false);
                navigate("/customer");
              }}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notify Me
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowExpansionDialog(false);
                navigate("/customer");
              }}
              className="w-full"
            >
              Continue Exploring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
