import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Sparkles } from "lucide-react";
import { useSkus } from "@/hooks/useSkus";
import type { ServiceSku } from "@/hooks/useSkus";
import { SkuDetailView } from "@/components/SkuDetailView";
import { ServiceCard } from "@/components/customer/ServiceCard";
import { getCategoryIcon } from "@/lib/serviceCategories";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useEntitlements, type EntitlementSku } from "@/hooks/useEntitlements";
import { QueryErrorCard } from "@/components/QueryErrorCard";

export default function CustomerServices() {
  const [selectedSku, setSelectedSku] = useState<ServiceSku | null>(null);

  const { data: subscription } = useCustomerSubscription();
  const {
    data: entitlements,
    isLoading: entitlementsLoading,
    isError: entitlementsError,
    refetch: refetchEntitlements,
  } = useEntitlements(
    subscription?.plan_id ?? null,
    subscription?.zone_id ?? null,
    subscription?.entitlement_version_id ?? null,
  );

  const {
    data: skus = [],
    isLoading: skusLoading,
    isError: skusError,
    refetch: refetchSkus,
  } = useSkus({});

  const skuById = useMemo(() => new Map(skus.map((s) => [s.id, s])), [skus]);

  const { included, addons } = useMemo(() => {
    const ents = entitlements?.skus ?? [];
    const out: { included: EntitlementSku[]; addons: EntitlementSku[] } = {
      included: [],
      addons: [],
    };
    for (const ent of ents) {
      if (ent.status === "included") out.included.push(ent);
      else if (ent.status === "extra_allowed") out.addons.push(ent);
      // blocked and provider_only intentionally omitted — customer view.
    }
    return out;
  }, [entitlements]);

  const hasPlan = !!subscription?.plan_id;
  const isLoading = entitlementsLoading || skusLoading;
  const isError = entitlementsError || skusError;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h1 className="text-h2">Services</h1>

      <SeasonalBundleSpotlight />

      {!isLoading && isError ? (
        // Only surface the error card once both queries have settled — avoids
        // a flash of error state when one query errors while the other is
        // still on its first fetch.
        <QueryErrorCard
          message="Failed to load your services. Check your connection and try again."
          onRetry={() => {
            refetchEntitlements();
            refetchSkus();
          }}
        />
      ) : (
        <>
          <IncludedInPlan
            hasPlan={hasPlan}
            isLoading={isLoading}
            items={included}
            skuById={skuById}
            onSelect={setSelectedSku}
          />
          <AvailableAddons
            hasPlan={hasPlan}
            isLoading={isLoading}
            items={addons}
            skuById={skuById}
            onSelect={setSelectedSku}
          />
        </>
      )}

      <Sheet open={!!selectedSku} onOpenChange={(open) => { if (!open) setSelectedSku(null); }}>
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

function SeasonalBundleSpotlight() {
  return (
    <Card className="p-4 bg-accent/5 border-accent/20 flex items-start gap-3">
      <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold">Seasonal bundles coming soon</p>
        <p className="text-xs text-muted-foreground mt-1">
          One-tap stacks like Fall Prep and Spring Refresh will appear here when a bundle is active in your zone.
        </p>
      </div>
    </Card>
  );
}

interface SectionProps {
  hasPlan: boolean;
  isLoading: boolean;
  items: EntitlementSku[];
  skuById: Map<string, ServiceSku>;
  onSelect: (sku: ServiceSku) => void;
}

function IncludedInPlan({ hasPlan, isLoading, items, skuById, onSelect }: SectionProps) {
  return (
    <section>
      <h2 className="text-h3 mb-3">Included in your plan</h2>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      ) : !hasPlan ? (
        <p className="text-sm text-muted-foreground">
          Activate a plan to see what's included.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recurring services included in this plan yet.
        </p>
      ) : (
        <Card className="p-0 divide-y divide-border">
          {items.map((ent) => {
            const sku = skuById.get(ent.sku_id);
            const Icon = getCategoryIcon(ent.category);
            return (
              <button
                key={ent.sku_id}
                type="button"
                onClick={() => { if (sku) onSelect(sku); }}
                aria-disabled={!sku}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-secondary/30 active:bg-secondary/50 transition-colors first:rounded-t-xl last:rounded-b-xl aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
              >
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ent.sku_name}</p>
                  <p className="text-xs text-muted-foreground">{ent.ui_explainer || ent.ui_badge}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </button>
            );
          })}
        </Card>
      )}
    </section>
  );
}

function AvailableAddons({ hasPlan, isLoading, items, skuById, onSelect }: SectionProps) {
  return (
    <section>
      <h2 className="text-h3 mb-3">Available add-ons</h2>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : !hasPlan ? (
        <p className="text-sm text-muted-foreground">
          Activate a plan to unlock add-ons.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No add-ons available for this plan right now.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((ent) => {
            const sku = skuById.get(ent.sku_id);
            if (!sku) return null;
            return (
              <ServiceCard
                key={ent.sku_id}
                sku={sku}
                onClick={() => onSelect(sku)}
                entitlementStatus={ent.status}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
