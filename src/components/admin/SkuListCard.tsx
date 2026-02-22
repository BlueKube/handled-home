import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Camera, Clock } from "lucide-react";
import type { ServiceSku, PhotoRequirement } from "@/hooks/useSkus";
import { FULFILLMENT_MODE_LABELS } from "@/hooks/useSkus";

interface SkuListCardProps {
  sku: ServiceSku;
  onClick: () => void;
}

export function SkuListCard({ sku, onClick }: SkuListCardProps) {
  const photos = (sku.required_photos ?? []) as unknown as PhotoRequirement[];
  const photoCount = photos.reduce((sum, p) => sum + p.count, 0);

  return (
    <Card className="press-feedback cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{sku.name}</h3>
            {sku.category && (
              <span className="text-caption">{sku.category}</span>
            )}
          </div>
          <StatusBadge status={sku.status} />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="h-3 w-3" /> {sku.duration_minutes}m
          </Badge>
          <Badge variant="outline" className="text-xs truncate max-w-[180px]">
            {FULFILLMENT_MODE_LABELS[sku.fulfillment_mode]?.split(" ").slice(0, 3).join(" ") ?? sku.fulfillment_mode}
          </Badge>
          {photoCount > 0 && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Camera className="h-3 w-3" /> {photoCount}
            </Badge>
          )}
          {sku.price_hint_cents != null && (
            <Badge variant="secondary" className="text-xs">
              ${(sku.price_hint_cents / 100).toFixed(0)} est.
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
