import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Camera, ListChecks, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { EntitlementSku } from "@/hooks/useEntitlements";

interface SkuDetailModalProps {
  sku: EntitlementSku | null;
  onClose: () => void;
  onAdd: (skuId: string) => void;
  alreadyAdded: boolean;
}

export function SkuDetailModal({ sku, onClose, onAdd, alreadyAdded }: SkuDetailModalProps) {
  // L10: Fetch real SKU data
  const { data: skuDetail } = useQuery({
    queryKey: ["sku-detail", sku?.sku_id],
    enabled: !!sku?.sku_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("inclusions, exclusions, duration_minutes, description")
        .eq("id", sku!.sku_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!sku) return null;

  const inclusions = skuDetail?.inclusions ?? [];
  const exclusions = skuDetail?.exclusions ?? [];

  return (
    <Dialog open={!!sku} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{sku.sku_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Badge variant="secondary">{sku.ui_badge}</Badge>
          <p className="text-sm text-muted-foreground">{skuDetail?.description || sku.ui_explainer}</p>

          {skuDetail?.duration_minutes && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>~{skuDetail.duration_minutes} minutes</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">What's included</p>
                {inclusions.length > 0 ? (
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {inclusions.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Full service as described in your plan</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">What's not included</p>
                {exclusions.length > 0 ? (
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {exclusions.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Specialty treatments, hazardous materials, structural work</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Camera className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Proof of completion</p>
                <p className="text-xs text-muted-foreground">Before & after photos submitted by your provider</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={alreadyAdded}
            onClick={() => onAdd(sku.sku_id)}
          >
            {alreadyAdded ? "Already in Routine" : "Add to Routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
