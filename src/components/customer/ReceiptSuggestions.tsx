import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import { useSuggestions, type ServiceSuggestion } from "@/hooks/useSuggestions";
import { useSuggestionActions } from "@/hooks/useSuggestionActions";
import { SuggestionCard } from "./SuggestionCard";
import { toast } from "sonner";

interface ReceiptSuggestionsProps {
  propertyId: string;
  onAddToRoutine: (skuId: string, levelId?: string | null) => void;
}

export function ReceiptSuggestions({ propertyId, onAddToRoutine }: ReceiptSuggestionsProps) {
  const { data: suggestions, isLoading } = useSuggestions(propertyId, "receipt");
  const { recordImpression, hideSuggestion, recordAdd } = useSuggestionActions(propertyId);

  // Take up to 2 top-ranked suggestions (ranking handled by RPC)
  const filtered = suggestions?.slice(0, 2) ?? [];

  const handleAdd = useCallback(
    (s: ServiceSuggestion) => {
      const levelId = s.default_level?.id ?? null;
      onAddToRoutine(s.sku_id, levelId);
      recordAdd.mutate({ skuId: s.sku_id });
      toast.success(`${s.sku_name} added to routine`);
    },
    [onAddToRoutine, recordAdd]
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
      recordImpression.mutate({ skuId, surface: "receipt" });
    },
    [recordImpression]
  );

  if (isLoading || filtered.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          While we're here next time
        </h3>
      </div>
      <div className="space-y-2">
        {filtered.map((s) => (
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
  );
}
