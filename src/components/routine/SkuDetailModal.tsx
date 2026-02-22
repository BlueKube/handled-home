import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Camera, ListChecks, Clock } from "lucide-react";
import type { EntitlementSku } from "@/hooks/useEntitlements";

interface SkuDetailModalProps {
  sku: EntitlementSku | null;
  onClose: () => void;
  onAdd: (skuId: string) => void;
  alreadyAdded: boolean;
}

export function SkuDetailModal({ sku, onClose, onAdd, alreadyAdded }: SkuDetailModalProps) {
  if (!sku) return null;

  return (
    <Dialog open={!!sku} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{sku.sku_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Badge variant="secondary">{sku.ui_badge}</Badge>
          <p className="text-sm text-muted-foreground">{sku.ui_explainer}</p>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">What's included</p>
                <p className="text-xs text-muted-foreground">Full service as described in your plan</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">What's not included</p>
                <p className="text-xs text-muted-foreground">Specialty treatments, hazardous materials, structural work</p>
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
