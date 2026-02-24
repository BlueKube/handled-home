

# Add Service Images, Featured Flags, and Category Grouping

## Overview

Transform the flat, text-only service catalog into a visually rich, organized browsing experience. Services will have hero images, be flaggable as "featured" or "suggested," and display grouped by category with friendly labels.

---

## Database Changes

Add three new columns to `service_skus`:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `image_url` | text, nullable | null | URL to a hero image stored in file storage |
| `is_featured` | boolean | false | Marks a service for the "Featured" section |
| `display_order` | integer | 0 | Controls sort order within a category |

Create a **storage bucket** called `sku-images` (public) so admins can upload service photos directly.

---

## Image Generation

Use AI image generation (Gemini flash-image) to create a set of 13 polished hero images -- one per existing service -- depicting each service in action (e.g., a freshly mowed lawn, a sparkling pool, a clean driveway). Images will be uploaded to the `sku-images` bucket and linked via `image_url`.

This will be done through a one-time backend function call or manual seeding script so the catalog has visuals immediately.

---

## Admin SKU Form Updates

Update `SkuFormSheet.tsx` to include:
- **Image upload** field with drag-and-drop or click-to-upload, saving to `sku-images` bucket
- **"Featured" toggle** (switch)
- **Display order** (number input)

Update `SkuListCard.tsx` to show a thumbnail of the image alongside the service name.

---

## Customer Services Page Redesign

Rework `customer/Services.tsx` with three visual sections:

1. **Featured Services** -- horizontal scrollable row of image cards for services where `is_featured = true`. Each card shows the hero image, service name, and estimated price.

2. **Category Groups** -- services grouped by `category` with friendly headers (e.g., "Lawn Care" instead of "mowing"). Each group shows its services as image cards in a grid.

3. **Search** -- retains the existing search bar; when active, shows flat filtered results instead of sections.

Category label mapping (hardcoded utility):
```text
mowing      -> Lawn Care
trimming    -> Trimming & Hedges
cleanup     -> Cleanup & Debris
treatment   -> Lawn Treatment
pool        -> Pool Care
power_wash  -> Power Washing
windows     -> Window Cleaning
pest        -> Pest Control
pet_waste   -> Pet Waste
```

---

## Service Card Component

Create `src/components/customer/ServiceCard.tsx`:
- Displays the hero image in a 16:9 aspect ratio container with rounded corners
- Service name overlaid or below the image
- Duration badge and estimated price
- Falls back to a colored gradient with an icon if no image is set
- On click: opens the existing detail sheet

---

## Provider SKUs Page

Update `provider/SKUs.tsx` to also show the image thumbnail on each card (smaller, inline) for visual consistency.

---

## File Summary

| File | Action |
|------|--------|
| Migration SQL | Add `image_url`, `is_featured`, `display_order` columns; create `sku-images` bucket + RLS |
| `src/components/customer/ServiceCard.tsx` | New -- image-forward service card |
| `src/pages/customer/Services.tsx` | Redesign -- featured row + category groups |
| `src/components/admin/SkuFormSheet.tsx` | Add image upload, featured toggle, display_order |
| `src/components/admin/SkuListCard.tsx` | Add image thumbnail |
| `src/pages/provider/SKUs.tsx` | Add image thumbnail |
| `src/hooks/useSkus.ts` | No changes needed (already selects `*`) |
| `src/lib/serviceCategories.ts` | New -- category label map + icon map |
| Edge function or seed script | Generate + upload 13 AI images, update `image_url` |

