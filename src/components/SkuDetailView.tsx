import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Camera, ClipboardList, CloudRain } from "lucide-react";
import type { ServiceSku, PhotoRequirement, ChecklistItem } from "@/hooks/useSkus";
import { FULFILLMENT_MODE_LABELS } from "@/hooks/useSkus";
import { getServiceImage } from "@/lib/serviceImages";
import { getCategoryIcon, getCategoryGradient } from "@/lib/serviceCategories";

interface SkuDetailViewProps {
  sku: ServiceSku;
}

export function SkuDetailView({ sku }: SkuDetailViewProps) {
  const photos = (sku.required_photos ?? []) as unknown as PhotoRequirement[];
  const checklist = (sku.checklist ?? []) as unknown as ChecklistItem[];
  const image = getServiceImage(sku.id, sku.name, sku.image_url);
  const CatIcon = getCategoryIcon(sku.category);
  const gradient = getCategoryGradient(sku.category);

  return (
    <div className="space-y-6">
      {/* Hero image */}
      <div className="rounded-xl overflow-hidden -mx-2">
        {image ? (
          <img src={image} alt={sku.name} className="w-full h-40 object-cover" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
        ) : (
          <div className={`w-full h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <CatIcon className="h-10 w-10 text-white/80" />
          </div>
        )}
      </div>
      {/* Description */}
      {sku.description && (
        <p className="text-body text-muted-foreground">{sku.description}</p>
      )}

      {/* Timing */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1.5">
          {sku.duration_minutes} min
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          {FULFILLMENT_MODE_LABELS[sku.fulfillment_mode] ?? sku.fulfillment_mode}
        </Badge>
        {sku.weather_sensitive && (
          <Badge variant="outline" className="gap-1.5 text-warning">
            <CloudRain className="h-3 w-3" /> Weather Sensitive
          </Badge>
        )}
      </div>

      {/* Inclusions */}
      {sku.inclusions && sku.inclusions.length > 0 && (
        <div>
          <h4 className="text-caption uppercase mb-2">What's Included</h4>
          <ul className="space-y-1">
            {sku.inclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exclusions */}
      {sku.exclusions && sku.exclusions.length > 0 && (
        <div>
          <h4 className="text-caption uppercase mb-2">What's Not Included</h4>
          <ul className="space-y-1">
            {sku.exclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div>
          <h4 className="text-caption uppercase mb-2">
            <Camera className="h-3.5 w-3.5 inline mr-1" />
            Required Photos
          </h4>
          <ul className="space-y-1.5">
            {photos.map((p, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="font-medium">{p.label}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {p.when} × {p.count}
                </Badge>
                {p.notes && <span className="text-muted-foreground">— {p.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Checklist */}
      {checklist.length > 0 && (
        <div>
          <h4 className="text-caption uppercase mb-2">
            <ClipboardList className="h-3.5 w-3.5 inline mr-1" />
            Checklist
          </h4>
          <ul className="space-y-1">
            {checklist.map((c, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <span>{c.label}</span>
                {c.required && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Required</Badge>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edge case notes */}
      {sku.edge_case_notes && (
        <div>
          <h4 className="text-caption uppercase mb-2">Edge Cases</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sku.edge_case_notes}</p>
        </div>
      )}

      {/* Price hint */}
      {sku.price_hint_cents != null && (
        <div>
          <h4 className="text-caption uppercase mb-1">Estimated Price</h4>
          <span className="text-lg font-semibold">${(sku.price_hint_cents / 100).toFixed(2)}</span>
          <span className="text-caption ml-1">est.</span>
        </div>
      )}
    </div>
  );
}
