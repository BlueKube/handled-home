import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Clock, CloudRain, Package, AlertTriangle } from "lucide-react";
import { useSkus, FULFILLMENT_MODE_LABELS } from "@/hooks/useSkus";
import type { ServiceSku } from "@/hooks/useSkus";
import { SkuDetailView } from "@/components/SkuDetailView";
import { getServiceImage } from "@/lib/serviceImages";
import { getCategoryIcon, getCategoryGradient } from "@/lib/serviceCategories";

export default function ProviderSKUs() {
  const [search, setSearch] = useState("");
  const [selectedSku, setSelectedSku] = useState<ServiceSku | null>(null);

  const { data: skus = [], isLoading, isError } = useSkus({ search: search || undefined });

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      <h1 className="text-h2">Service Catalog</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">Failed to load Available Services data. Please try again.</p>
        </div>
      ) : skus.length === 0 ? (
        <EmptyState
          compact
          icon={Package}
          title="No services available"
          body={search ? "No services match your search. Try a different term." : "Services will appear here once configured by your admin."}
        />
      ) : (
        <div className="grid gap-3">
          {skus.map(sku => {
            const image = getServiceImage(sku.id, sku.name, sku.image_url);
            const CatIcon = getCategoryIcon(sku.category);
            const gradient = getCategoryGradient(sku.category);
            return (
              <Card key={sku.id} className="press-feedback cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSku(sku)}>
                <CardContent className="p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {image ? (
                      <img src={image} alt={sku.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <CatIcon className="h-5 w-5 text-white/80" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm">{sku.name}</h3>
                    {sku.description && <p className="text-caption mt-0.5 line-clamp-1">{sku.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Clock className="h-3 w-3" /> {sku.duration_minutes} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {FULFILLMENT_MODE_LABELS[sku.fulfillment_mode]?.split(" ").slice(0, 4).join(" ") ?? sku.fulfillment_mode}
                      </Badge>
                      {sku.weather_sensitive && (
                        <Badge variant="outline" className="gap-1 text-xs text-warning">
                          <CloudRain className="h-3 w-3" /> Weather
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedSku} onOpenChange={open => { if (!open) setSelectedSku(null); }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedSku?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {selectedSku && <SkuDetailView sku={selectedSku} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}