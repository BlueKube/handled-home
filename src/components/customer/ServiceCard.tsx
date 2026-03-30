import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { ServiceSku } from "@/hooks/useSkus";
import { getServiceImage } from "@/lib/serviceImages";
import { getCategoryIcon, getCategoryGradient } from "@/lib/serviceCategories";
import { EntitlementBadge, type EntitlementStatus } from "@/components/plans/EntitlementBadge";

interface ServiceCardProps {
  sku: ServiceSku;
  onClick: () => void;
  variant?: "default" | "featured";
  entitlementStatus?: EntitlementStatus;
}

export function ServiceCard({ sku, onClick, variant = "default", entitlementStatus }: ServiceCardProps) {
  const image = getServiceImage(sku.id, sku.name, sku.image_url);
  const CategoryIcon = getCategoryIcon(sku.category);
  const gradient = getCategoryGradient(sku.category);

  if (variant === "featured") {
    return (
      <button
        onClick={onClick}
        className="group flex-shrink-0 w-[260px] rounded-xl overflow-hidden press-feedback focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <AspectRatio ratio={16 / 10}>
          {image ? (
            <img
              src={image}
              alt={sku.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <CategoryIcon className="h-10 w-10 text-white/80" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {entitlementStatus && (
            <div className="absolute top-2 right-2">
              <EntitlementBadge status={entitlementStatus} />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm leading-tight">{sku.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="gap-1 text-[11px] bg-white/20 text-white border-0 backdrop-blur-sm">
                <Clock className="h-2.5 w-2.5" /> {sku.duration_minutes}m
              </Badge>
              {sku.price_hint_cents != null && (
                <span className="text-[11px] text-white/80 font-medium">
                  ${(sku.price_hint_cents / 100).toFixed(0)} est.
                </span>
              )}
            </div>
          </div>
        </AspectRatio>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group rounded-xl overflow-hidden bg-card border border-border/50 hover:shadow-md transition-shadow press-feedback focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left w-full"
    >
      <AspectRatio ratio={16 / 9}>
        {image ? (
          <img
            src={image}
            alt={sku.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <CategoryIcon className="h-8 w-8 text-white/80" />
          </div>
        )}
      </AspectRatio>
      <div className="p-3">
        <h3 className="font-semibold text-sm">{sku.name}</h3>
        {sku.description && (
          <p className="text-caption mt-0.5 line-clamp-1">{sku.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {entitlementStatus && <EntitlementBadge status={entitlementStatus} />}
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="h-3 w-3" /> {sku.duration_minutes}m
          </Badge>
          {sku.price_hint_cents != null && (
            <Badge variant="outline" className="text-xs">
              ${(sku.price_hint_cents / 100).toFixed(0)} est.
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
