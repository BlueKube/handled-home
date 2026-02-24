


# Add Service Images, Featured Flags, and Category Grouping

## Status: ✅ COMPLETED (2026-02-24)

All items implemented. See Module 04 spec (`docs/modules/04-sku-catalog.md`) for updated documentation.

### Summary of changes
- **Database:** Added `image_url`, `is_featured`, `display_order` to `service_skus`; created `sku-images` public storage bucket with admin-only upload RLS
- **Images:** Generated 13 AI hero images bundled in `src/assets/services/`; smart fallback system in `src/lib/serviceImages.ts`
- **Customer Services page:** Redesigned with Featured horizontal scroll + category-grouped image card grid + search
- **ServiceCard component:** New image-forward card with featured variant
- **Category utilities:** `src/lib/serviceCategories.ts` — labels, icons, gradients, display order
- **Admin:** SkuListCard with thumbnails, SkuFormSheet with Featured toggle + Display Order
- **Provider:** SKUs page with inline image thumbnails
- **SkuDetailView:** Hero image banner added
- **Seeded:** 4 featured services (Standard Mow, Hedge Trimming, Power Wash, Pool Service)
