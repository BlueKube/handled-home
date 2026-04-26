// Convert a human-readable name into a kebab-case slug suitable for the
// public-facing /customer/bundles/:slug URL. Strips diacritics, lowercases,
// hyphenates whitespace, drops anything outside [a-z0-9-].
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    // \p{M} matches any Unicode "Mark" code point — the combining
    // diacritical block plus enclosing/spacing marks. Using the property
    // escape avoids editor-level mangling of literal combining characters.
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // drop punctuation (keep alphanum + _ + -)
    .replace(/[_\s]+/g, "-") // collapse whitespace + underscores → hyphen
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
