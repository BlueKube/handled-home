import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Brain } from "lucide-react";
import { useProperty } from "@/hooks/useProperty";
import { useSuggestions, type ServiceSuggestion } from "@/hooks/useSuggestions";
import { useSuggestionActions } from "@/hooks/useSuggestionActions";
import { SuggestionCard } from "./SuggestionCard";
import { toast } from "sonner";

interface AddServiceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrowseAll: () => void;
  onAddToRoutine: (skuId: string, levelId?: string | null) => void;
  onUndo?: (skuId: string) => void;
}

export function AddServiceDrawer({
  open,
  onOpenChange,
  onBrowseAll,
  onAddToRoutine,
  onUndo,
}: AddServiceDrawerProps) {
  const { property } = useProperty();
  const { data: suggestions, isLoading } = useSuggestions(property?.id, "drawer");
  const { recordImpression, hideSuggestion, recordAdd } = useSuggestionActions(property?.id);

  const predicted = (suggestions ?? []).filter((s) => s.suggestion_type === "predicted").slice(0, 3);
  const bestNext = (suggestions ?? []).filter((s) => s.suggestion_type === "best_next").slice(0, 4);
  const seasonal = (suggestions ?? []).filter((s) => s.suggestion_type === "seasonal").slice(0, 2);

  const handleAdd = useCallback(
    (suggestion: ServiceSuggestion) => {
      const levelId = suggestion.default_level?.id ?? null;
      onAddToRoutine(suggestion.sku_id, levelId);
      recordAdd.mutate({ skuId: suggestion.sku_id });

      // Toast with undo
      toast.success(`${suggestion.sku_name} added to routine`, {
        duration: 10000,
        action: onUndo
          ? {
              label: "Undo",
              onClick: () => onUndo(suggestion.sku_id),
            }
          : undefined,
      });
    },
    [onAddToRoutine, recordAdd, onUndo]
  );

  const handleHide = useCallback(
    (skuId: string, reason: string) => {
      hideSuggestion.mutate({ skuId, reason });
      toast("Suggestion hidden for 90 days");
    },
    [hideSuggestion]
  );

  const handleImpression = useCallback(
    (skuId: string) => {
      recordImpression.mutate({ skuId, surface: "drawer" });
    },
    [recordImpression]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Add a service</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Recommendations are tailored to your home.
          </p>
        </SheetHeader>
        <div className="mt-4 space-y-5 overflow-y-auto max-h-[calc(85vh-120px)] pb-8">
          {/* AI Predicted */}
          {predicted.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  AI Picks for You
                </p>
              </div>
              <div className="space-y-2">
                {predicted.map((s) => (
                  <SuggestionCard
                    key={s.sku_id}
                    suggestion={s}
                    onAdd={handleAdd}
                    onHide={handleHide}
                    onImpression={handleImpression}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Best Next */}
          {bestNext.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Best Next
                </p>
              </div>
              <div className="space-y-2">
                {bestNext.map((s) => (
                  <SuggestionCard
                    key={s.sku_id}
                    suggestion={s}
                    onAdd={handleAdd}
                    onHide={handleHide}
                    onImpression={handleImpression}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Seasonal */}
          {seasonal.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Seasonal
              </p>
              <div className="space-y-2">
                {seasonal.map((s) => (
                  <SuggestionCard
                    key={s.sku_id}
                    suggestion={s}
                    onAdd={handleAdd}
                    onHide={handleHide}
                    onImpression={handleImpression}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && (suggestions ?? []).length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No new suggestions right now — browse all services below.
              </p>
            </div>
          )}

          {/* Browse All */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              onBrowseAll();
            }}
          >
            Browse All Services
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
