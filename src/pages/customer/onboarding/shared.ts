export interface FieldErrors {
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface PropertyFormData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  gate_code: string;
  access_instructions: string;
  parking_instructions: string;
  pets_input: string;
  notes: string;
}

export function stripNonDigits(val: string): string {
  return val.replace(/\D/g, "").slice(0, 5);
}

export function capitalize(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function validateProperty(form: PropertyFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.street_address.trim()) errors.street_address = "Street address is required";
  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  const zip = form.zip_code.replace(/\D/g, "");
  if (!zip) errors.zip_code = "Zip code is required";
  else if (zip.length !== 5) errors.zip_code = "Zip code must be exactly 5 digits";
  return errors;
}
