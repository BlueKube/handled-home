import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Star } from "lucide-react";
import { useSkus } from "@/hooks/useSkus";
import type { ServiceSku } from "@/hooks/useSkus";
import { SkuDetailView } from "@/components/SkuDetailView";
import { ServiceCard } from "@/components/customer/ServiceCard";
import { getCategoryLabel, getCategoryIcon, CATEGORY_ORDER } from "@/lib/serviceCategories";

export default function CustomerServices() {
  const [search, setSearch] = useState("");
  const [selectedSku, setSelectedSku] = useState<ServiceSku | null>(null);

  const { data: skus = [], isLoading } = useSkus({
    search: search || undefined,
  });

  const featured = useMemo(
    () => skus.filter((s) => s.is_featured).sort((a, b) => a.display_order - b.display_order),
    [skus]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, ServiceSku[]> = {};
    skus.forEach((s) => {
      const cat = s.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    // Sort within each group by display_order
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => a.display_order - b.display_order)
    );
    return groups;
  }, [skus]);

  const sortedCategories = useMemo(() => {
    const cats = Object.keys(grouped);
    return cats.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [grouped]);

  const isSearching = search.trim().length > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h1 className="text-h2">Our Services</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      ) : skus.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No services available.</p>
      ) : isSearching ? (
        /* Flat search results */
        <div className="grid grid-cols-2 gap-3">
          {skus.map((sku) => (
            <ServiceCard key={sku.id} sku={sku} onClick={() => setSelectedSku(sku)} />
          ))}
        </div>
      ) : (
        <>
          {/* Featured Services */}
          {featured.length > 0 && (
            <section>
              <h2 className="text-h3 flex items-center gap-2 mb-3">
                <Star className="h-4.5 w-4.5 text-warning fill-warning" />
                Featured
              </h2>
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-3">
                  {featured.map((sku) => (
                    <ServiceCard
                      key={sku.id}
                      sku={sku}
                      variant="featured"
                      onClick={() => setSelectedSku(sku)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          {/* Category Groups */}
          {sortedCategories.map((cat) => {
            const Icon = getCategoryIcon(cat);
            return (
              <section key={cat}>
                <h2 className="text-h3 flex items-center gap-2 mb-3">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                  {getCategoryLabel(cat)}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {grouped[cat].map((sku) => (
                    <ServiceCard
                      key={sku.id}
                      sku={sku}
                      onClick={() => setSelectedSku(sku)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

      <Sheet open={!!selectedSku} onOpenChange={(open) => { if (!open) setSelectedSku(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
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
