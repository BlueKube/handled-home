// Static image imports for bundled service images (fallback when no image_url in DB)
import standardMow from "@/assets/services/standard-mow.jpg";
import edgeTrim from "@/assets/services/edge-trim.jpg";
import leafBlowoff from "@/assets/services/leaf-blowoff.jpg";
import hedgeTrimming from "@/assets/services/hedge-trimming.jpg";
import weedControl from "@/assets/services/weed-control.jpg";
import fertilizer from "@/assets/services/fertilizer.jpg";
import mulchRefresh from "@/assets/services/mulch-refresh.jpg";
import springCleanup from "@/assets/services/spring-cleanup.jpg";
import windowCleaning from "@/assets/services/window-cleaning.jpg";
import powerWash from "@/assets/services/power-wash.jpg";
import poolService from "@/assets/services/pool-service.jpg";
import pestControl from "@/assets/services/pest-control.jpg";
import petWaste from "@/assets/services/pet-waste.jpg";

/** Map SKU IDs to bundled images */
const SKU_IMAGES: Record<string, string> = {
  "c1000000-0000-0000-0000-000000000001": standardMow,
  "c1000000-0000-0000-0000-000000000002": edgeTrim,
  "c1000000-0000-0000-0000-000000000003": leafBlowoff,
  "c1000000-0000-0000-0000-000000000004": hedgeTrimming,
  "c1000000-0000-0000-0000-000000000005": weedControl,
  "c1000000-0000-0000-0000-000000000006": fertilizer,
  "c1000000-0000-0000-0000-000000000007": mulchRefresh,
  "c1000000-0000-0000-0000-000000000008": springCleanup,
  "c1000000-0000-0000-0000-000000000009": windowCleaning,
  "c1000000-0000-0000-0000-00000000000a": powerWash,
  "c1000000-0000-0000-0000-00000000000b": poolService,
  "c1000000-0000-0000-0000-00000000000c": pestControl,
  "c1000000-0000-0000-0000-00000000000d": petWaste,
};

/** Name-based fallback for services created after seeding */
const NAME_IMAGES: Record<string, string> = {
  "standard mow": standardMow,
  "edge & trim": edgeTrim,
  "leaf blowoff": leafBlowoff,
  "hedge trimming": hedgeTrimming,
  "weed control": weedControl,
  "fertilizer application": fertilizer,
  "mulch bed refresh": mulchRefresh,
  "spring cleanup": springCleanup,
  "window cleaning": windowCleaning,
  "power wash": powerWash,
  "pool service": poolService,
  "pest control": pestControl,
  "dog poop cleanup": petWaste,
};

/**
 * Returns the best available image for a service SKU.
 * Priority: image_url from DB > bundled image by ID > bundled image by name > null
 */
export function getServiceImage(
  skuId: string,
  skuName: string,
  imageUrl?: string | null
): string | null {
  if (imageUrl) return imageUrl;
  if (SKU_IMAGES[skuId]) return SKU_IMAGES[skuId];
  const nameLower = skuName.toLowerCase();
  if (NAME_IMAGES[nameLower]) return NAME_IMAGES[nameLower];
  return null;
}
