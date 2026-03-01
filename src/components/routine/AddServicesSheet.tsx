import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Info } from "lucide-react";
import { useSkuLevels } from "@/hooks/useSkuLevels";
import { useCategoryEligibility } from "@/hooks/useCategoryEligibility";
import type { EntitlementSku } from "@/hooks/useEntitlements";
import { SkuDetailModal } from "./SkuDetailModal";

interface AddServicesSheetProps {
  skus: EntitlementSku[];
  existingSkuIds: Set<string>;
  onAdd: (skuId: string, levelId?: string | null) => void;
}

/** Returns the sizing-aware default level ID for a SKU, or null */
function useDefaultLevelId(skuId: string | null) {
  const { data: levels } = useSkuLevels(skuId);
  const activeLevels = (levels ?? []).filter((l) => l.is_active);
  return activeLevels.length > 0 ? activeLevels[0].id : null;
}

function QuickAddButton({ sku, alreadyAdded, onAdd, onDetail }: {
  sku: EntitlementSku;
  alreadyAdded: boolean;
  onAdd: (skuId: string, levelId?: string | null) => void;
  onDetail: () => void;
}) {
  const defaultLevelId = useDefaultLevelId(sku.sku_id);
  const hasLevels = defaultLevelId !== null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{sku.sku_name}</p>
        <Badge variant="secondary" className="text-[10px] mt-0.5">{sku.ui_badge}</Badge>
      </div>
      <button
        onClick={onDetail}
        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
      >
        <Info className="h-4 w-4" />
      </button>
      {hasLevels ? (
        <Button
          variant={alreadyAdded ? "secondary" : "outline"}
          size="sm"
          className="h-8 text-xs"
          disabled={alreadyAdded}
          onClick={onDetail}
        >
          {alreadyAdded ? "Added" : "Choose Level"}
        </Button>
      ) : (
        <Button
          variant={alreadyAdded ? "secondary" : "default"}
          size="sm"
          className="h-8 text-xs"
          disabled={alreadyAdded}
          onClick={() => onAdd(sku.sku_id)}
        >
          {alreadyAdded ? "Added" : "Add"}
        </Button>
      )}
    </div>
  );
}

export function AddServicesSheet({ skus, existingSkuIds, onAdd }: AddServicesSheetProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [detailSku, setDetailSku] = useState<EntitlementSku | null>(null);
  const { isEligible } = useCategoryEligibility();

  const filtered = skus
    .filter((s) => s.status !== "blocked" && s.status !== "provider_only")
    .filter((s) => isEligible((s as any).category)) // Suppress NA categories
    .filter((s) => s.sku_name.toLowerCase().includes(search.toLowerCase()));

  const grouped = {
    included: filtered.filter((s) => s.status === "included"),
    extra: filtered.filter((s) => s.status === "extra_allowed"),
    available: filtered.filter((s) => s.status === "available"),
  };

  const renderSection = (title: string, items: EntitlementSku[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <p className="text-caption uppercase tracking-wider mb-2">{title}</p>
        <div className="space-y-1">
          {items.map((sku) => (
            <QuickAddButton
              key={sku.sku_id}
              sku={sku}
              alreadyAdded={existingSkuIds.has(sku.sku_id)}
              onAdd={onAdd}
              onDetail={() => setDetailSku(sku)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="gap-2 shadow-lg" size="lg">
            <Plus className="h-4 w-4" />
            Add Services
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Choose Services</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(85vh-100px)] pb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {renderSection("Included in Plan", grouped.included)}
            {renderSection("Available as Extras", grouped.extra)}
            {renderSection("Available", grouped.available)}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No services match your search</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SkuDetailModal
        sku={detailSku}
        onClose={() => setDetailSku(null)}
        onAdd={(skuId, levelId) => {
          onAdd(skuId, levelId);
          setDetailSku(null);
        }}
        alreadyAdded={detailSku ? existingSkuIds.has(detailSku.sku_id) : false}
      />
    </>
  );
}