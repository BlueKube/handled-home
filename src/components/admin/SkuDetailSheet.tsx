import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { SkuDetailView } from "@/components/SkuDetailView";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Pencil, Archive } from "lucide-react";
import type { ServiceSku } from "@/hooks/useSkus";
import { useUpdateSku, useDuplicateSku } from "@/hooks/useSkus";
import { toast } from "sonner";

interface SkuDetailSheetProps {
  sku: ServiceSku | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (sku: ServiceSku) => void;
}

export function SkuDetailSheet({ sku, open, onOpenChange, onEdit }: SkuDetailSheetProps) {
  const updateSku = useUpdateSku();
  const duplicateSku = useDuplicateSku();

  if (!sku) return null;

  const handleArchive = () => {
    updateSku.mutate(
      { id: sku.id, updates: { status: "archived" } },
      {
        onSuccess: () => { toast.success("SKU archived"); onOpenChange(false); },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleDuplicate = () => {
    duplicateSku.mutate(sku.id, {
      onSuccess: () => { toast.success("SKU duplicated as draft"); onOpenChange(false); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1">{sku.name}</SheetTitle>
            <StatusBadge status={sku.status} />
          </div>
        </SheetHeader>

        <div className="mt-6">
          <SkuDetailView sku={sku} />
        </div>

        {/* Pricing notes (admin only) */}
        {sku.pricing_notes && (
          <div className="mt-4 p-3 bg-secondary rounded-lg">
            <h4 className="text-caption uppercase mb-1">Pricing Notes (Internal)</h4>
            <p className="text-sm">{sku.pricing_notes}</p>
          </div>
        )}

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => onEdit(sku)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
          {sku.status !== "archived" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive ml-auto">
                  <Archive className="h-3.5 w-3.5" /> Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive "{sku.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This SKU will be hidden from customers and providers. You can restore it later by editing the status.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
