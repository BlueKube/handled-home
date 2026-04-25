import type { VisitChipType } from "@/components/customer/VisitTypeChip";

/**
 * Stub classifier for visit-task type chips.
 *
 * Today this returns "included" for everything — the real backend signals
 * (snap_request_id linkage on job_skus, bundle membership on the SKU,
 * credit-paid detection from the order line) don't exist on the schema yet.
 *
 * The visual chip + 4 variants ship in Batch 5.4 so the design lands with
 * the rest of the three-mode rewrite. Real classification is a backend
 * follow-up tracked in docs/upcoming/TODO.md (open as of Batch 5.4 merge).
 *
 * When the backend lands the source fields, this function gains the real
 * heuristic: prefer Snap > Bundle > Credits > Included.
 */
export function getChipType(
  _jobSku: { sku_id: string }
): VisitChipType {
  return "included";
}
