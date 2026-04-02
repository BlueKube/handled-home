export const cents = (c: number | null | undefined) =>
  c != null ? `$${(c / 100).toFixed(2)}` : "—";

export const contractLabel = (t: string) =>
  ({ partner_flat: "Partner Flat", partner_time_guarded: "Time-Guarded", contractor_time_based: "Time-Based" }[t] ?? t);
