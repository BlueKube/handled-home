// Returns 1–2 uppercase letters derived from a user's full name or email, with
// the brand letter "H" as a last-resort fallback. Used by AvatarDrawer.
export function getInitials(fullName: string | null | undefined, email: string | null | undefined): string {
  const name = fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0][0]!.toUpperCase();
    return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
  }
  const addr = email?.trim();
  if (addr) return addr[0]!.toUpperCase();
  return "H";
}
