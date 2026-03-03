import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Info, Clock } from "lucide-react";
import { useLevelDefault } from "@/hooks/useLevelDefault";
import { useCategoryEligibility } from "@/hooks/useCategoryEligibility";
import { useZoneCategoryGating } from "@/hooks/useZoneCategoryGating";
import { getStateMessage } from "@/lib/categoryStateMessaging";
import { CategoryWaitlistSheet } from "@/components/customer/CategoryWaitlistSheet";
import type { EntitlementSku } from "@/hooks/useEntitlements";
import { SkuDetailModal } from "./SkuDetailModal";

interface AddServicesSheetProps {
  skus: EntitlementSku[];
  existingSkuIds: Set<string>;
  onAdd: (skuId: string, levelId?: string | null) => void;
}

/** Returns the sizing-aware default level ID for a SKU, or null */
function useDefaultLevelId(skuId: string | null, category: string | null) {
  const { default_level_id } = useLevelDefault(skuId, category);
  return default_level_id;
}

function QuickAddButton({ sku, alreadyAdded, onAdd, onDetail }: {
  sku: EntitlementSku;
  alreadyAdded: boolean;
  onAdd: (skuId: string, levelId?: string | null) => void;
  onDetail: () => void;
}) {
  const defaultLevelId = useDefaultLevelId(sku.sku_id, sku.category);
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
  const [waitlistCategory, setWaitlistCategory] = useState<{ category: string; rawState: string } | null>(null);
  const { isEligible } = useCategoryEligibility();
  const { getCategoryGating, getRawState, hasGatingData } = useZoneCategoryGating();

  const filtered = skus
    .filter((s) => s.status !== "blocked" && s.status !== "provider_only")
    .filter((s) => isEligible(s.category))
    // Hide CLOSED categories
    .filter((s) => !hasGatingData || getCategoryGating(s.category) !== "hidden")
    .filter((s) => s.sku_name.toLowerCase().includes(search.toLowerCase()));

  // Split into purchasable vs waitlisted
  const purchasable = filtered.filter((s) => getCategoryGating(s.category) !== "waitlist");
  const waitlisted = filtered.filter((s) => getCategoryGating(s.category) === "waitlist");

  const grouped = {
    included: purchasable.filter((s) => s.status === "included"),
    extra: purchasable.filter((s) => s.status === "extra_allowed"),
    available: purchasable.filter((s) => s.status === "available"),
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

  // Group waitlisted SKUs by category for display
  const waitlistCategories = new Map<string, EntitlementSku[]>();
  for (const sku of waitlisted) {
    const cat = sku.category ?? "general";
    if (!waitlistCategories.has(cat)) waitlistCategories.set(cat, []);
    waitlistCategories.get(cat)!.push(sku);
  }

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

            {/* Waitlisted categories */}
            {waitlistCategories.size > 0 && (
              <div>
                <p className="text-caption uppercase tracking-wider mb-2">Coming Soon</p>
                <div className="space-y-1">
                  {Array.from(waitlistCategories.entries()).map(([cat, catSkus]) => {
                    const rawState = getRawState(cat);
                    const msg = getStateMessage(rawState, cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setWaitlistCategory({ category: cat, rawState: rawState ?? "WAITLIST_ONLY" })}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border w-full text-left hover:bg-accent/50 transition-colors"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{catSkus.map((s) => s.sku_name).join(", ")}</p>
                          <p className="text-xs text-muted-foreground">{msg.subtext.substring(0, 60)}…</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                          {msg.badge}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

      {/* Waitlist sheet */}
      {waitlistCategory && (
        <CategoryWaitlistSheet
          open={!!waitlistCategory}
          onOpenChange={(v) => { if (!v) setWaitlistCategory(null); }}
          category={waitlistCategory.category}
          rawState={waitlistCategory.rawState}
        />
      )}
    </>
  );
}