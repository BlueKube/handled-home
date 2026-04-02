/**
 * Canonical US phone validation — use this everywhere instead of inline regex.
 * Accepts: (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567
 */
const PHONE_REGEX = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

/** Returns true if phone is empty/null (optional) or matches US phone format. */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone || phone.trim().length === 0) return true;
  return PHONE_REGEX.test(phone.trim());
}
