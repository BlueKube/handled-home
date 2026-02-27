import { useState } from "react";
import { Zap, Sparkles, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAddonSuggestions, usePurchaseAddon, type AddonSku } from "@/hooks/useAddonSuggestions";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useHandleBalance } from "@/hooks/useHandles";
import { useProperty } from "@/hooks/useProperty";
import { getCategoryLabel, getCategoryIcon, getCategoryGradient } from "@/lib/serviceCategories";
import { getServiceImage } from "@/lib/serviceImages";
import { toast } from "sonner";

export function AddonSuggestionsCard() {
  const { data, isLoading } = useAddonSuggestions();
  const { data: subscription } = useCustomerSubscription();
  const { data: handleBalance } = useHandleBalance();
  const { property } = useProperty();
  const purchase = usePurchaseAddon();
  const [selectedSku, setSelectedSku] = useState<AddonSku | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  if (isLoading || !data || data.gated || data.skus.length === 0) return null;

  const handlePurchase = async (paymentMethod: "handles" | "cash") => {
    if (!subscription || !property || !selectedSku) return;
    setPurchasing(true);
    try {
      const result = await purchase.mutateAsync({
        subscriptionId: subscription.id,
        skuId: selectedSku.id,
        propertyId: property.id,
        zoneId: subscription.zone_id!,
        paymentMethod,
      });
      toast.success(`${result.sku_name} confirmed!`);
      setSelectedSku(null);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to purchase add-on");
    } finally {
      setPurchasing(false);
    }
  };

  const canAffordHandles = (sku: AddonSku) =>
    (handleBalance ?? 0) >= (sku.handle_cost ?? 0);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            Need extra help?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            One-tap add-ons — pay with handles or card.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {data.skus.map((sku) => {
              const Icon = getCategoryIcon(sku.category);
              const img = getServiceImage(sku.id, sku.name, sku.image_url);
              return (
                <button
                  key={sku.id}
                  onClick={() => setSelectedSku(sku)}
                  className="relative rounded-xl overflow-hidden text-left group border border-border hover:border-accent/40 transition-colors"
                >
                  {img ? (
                    <img src={img} alt={sku.name} className="w-full h-20 object-cover" />
                  ) : (
                    <div className={`w-full h-20 bg-gradient-to-br ${getCategoryGradient(sku.category)} flex items-center justify-center`}>
                      <Icon className="h-8 w-8 text-white/70" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{sku.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {sku.handle_cost > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {sku.handle_cost} handles
                        </Badge>
                      )}
                      {sku.base_price_cents > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          ${(sku.base_price_cents / 100).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Sheet */}
      <Sheet open={!!selectedSku} onOpenChange={(open) => !open && setSelectedSku(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
          {selectedSku && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedSku.name}</SheetTitle>
                <SheetDescription>{selectedSku.description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                {/* Details */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{getCategoryLabel(selectedSku.category)}</Badge>
                  <span>~{selectedSku.duration_minutes} min</span>
                </div>

                {/* Inclusions */}
                {selectedSku.inclusions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Includes</p>
                    <ul className="space-y-1">
                      {selectedSku.inclusions.map((inc, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-primary" /> {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Purchase buttons */}
                <div className="space-y-2 pt-2">
                  {selectedSku.handle_cost > 0 && (
                    <Button
                      className="w-full"
                      disabled={purchasing || !canAffordHandles(selectedSku)}
                      onClick={() => handlePurchase("handles")}
                    >
                      {purchasing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Use {selectedSku.handle_cost} Handles
                      {!canAffordHandles(selectedSku) && (
                        <span className="ml-1 text-xs opacity-70">(need {selectedSku.handle_cost - (handleBalance ?? 0)} more)</span>
                      )}
                    </Button>
                  )}
                  {selectedSku.base_price_cents > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={purchasing}
                      onClick={() => handlePurchase("cash")}
                    >
                      {purchasing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Pay ${(selectedSku.base_price_cents / 100).toFixed(2)}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
