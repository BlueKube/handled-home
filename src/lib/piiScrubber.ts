/**
 * PII Scrubber — prevents disintermediation on free-text surfaces.
 *
 * Replaces phone numbers, email addresses, and URLs with masked placeholders.
 * Used on any customer/provider-facing text input (issue notes, provider summaries, etc.)
 *
 * Design: lightweight regex, runs client-side for preview and server-side for enforcement.
 */

const PHONE_REGEX =
  /(?<!\d)(\+?1[\s\-.]?)?(\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4})(?!\d)/g;

const EMAIL_REGEX =
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const URL_REGEX =
  /https?:\/\/[^\s"'<>]+/gi;

// NOTE: Obfuscated URL regex ("mysite dot com") removed — too many false positives
// (Costco, Cisco, Monaco). Revisit only if real obfuscation patterns are observed.

export interface ScrubResult {
  /** The cleaned text with PII replaced */
  cleaned: string;
  /** Whether any PII was found and replaced */
  hadPii: boolean;
  /** Count of items scrubbed by type */
  counts: {
    phones: number;
    emails: number;
    urls: number;
  };
}

const PHONE_PLACEHOLDER = "[phone removed]";
const EMAIL_PLACEHOLDER = "[email removed]";
const URL_PLACEHOLDER = "[link removed]";

/**
 * Scrubs PII from free-text input.
 *
 * @example
 * ```ts
 * const result = scrubPii("Call me at 555-123-4567 or email me@test.com");
 * // result.cleaned === "Call me at [phone removed] or [email removed]"
 * // result.hadPii === true
 * ```
 */
export function scrubPii(text: string): ScrubResult {
  if (!text) return { cleaned: text, hadPii: false, counts: { phones: 0, emails: 0, urls: 0 } };

  let cleaned = text;
  let phones = 0;
  let emails = 0;
  let urls = 0;

  // Order matters: URLs first (they can contain emails), then emails, then phones
  cleaned = cleaned.replace(URL_REGEX, () => {
    urls++;
    return URL_PLACEHOLDER;
  });

  cleaned = cleaned.replace(EMAIL_REGEX, () => {
    emails++;
    return EMAIL_PLACEHOLDER;
  });

  cleaned = cleaned.replace(PHONE_REGEX, (match) => {
    // Skip matches that are too short (avoid false positives on dates, zip codes, etc.)
    const digitsOnly = match.replace(/\D/g, "");
    if (digitsOnly.length < 7) return match;
    phones++;
    return PHONE_PLACEHOLDER;
  });

  const hadPii = phones + emails + urls > 0;
  return { cleaned, hadPii, counts: { phones, emails, urls } };
}

/**
 * Returns true if the text contains likely PII (phone, email, or URL).
 * Cheaper than full scrub when you only need a boolean check.
 */
export function containsPii(text: string): boolean {
  if (!text) return false;
  URL_REGEX.lastIndex = 0;
  EMAIL_REGEX.lastIndex = 0;
  return (
    URL_REGEX.test(text) ||
    EMAIL_REGEX.test(text) ||
    hasPhone(text)
  );
}

function hasPhone(text: string): boolean {
  PHONE_REGEX.lastIndex = 0;
  let match;
  while ((match = PHONE_REGEX.exec(text)) !== null) {
    const digitsOnly = match[0].replace(/\D/g, "");
    if (digitsOnly.length >= 7) return true;
  }
  return false;
}
