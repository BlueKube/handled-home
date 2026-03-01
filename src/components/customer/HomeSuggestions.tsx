import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import { useProperty } from "@/hooks/useProperty";
import { useSuggestions, type ServiceSuggestion } from "@/hooks/useSuggestions";
import { useSuggestionActions } from "@/hooks/useSuggestionActions";
import { SuggestionCard } from "./SuggestionCard";
import { toast } from "sonner";

interface HomeSuggestionsProps {
  onAddToRoutine: (skuId: string, levelId?: string | null) => void;
  onUndo?: (skuId: string) => void;
}

export function HomeSuggestions({ onAddToRoutine, onUndo }: HomeSuggestionsProps) {
  const { property } = useProperty();
  const { data: suggestions, isLoading } = useSuggestions(property?.id, "home");
  const { recordImpression, hideSuggestion, recordAdd } = useSuggestionActions(property?.id);

  const handleAdd = useCallback(
    (suggestion: ServiceSuggestion) => {
      const levelId = suggestion.default_level?.id ?? null;
      onAddToRoutine(suggestion.sku_id, levelId);
      recordAdd.mutate({ skuId: suggestion.sku_id });
      toast.success(`${suggestion.sku_name} added to routine`, {
        duration: 10000,
        action: onUndo
          ? { label: "Undo", onClick: () => onUndo(suggestion.sku_id) }
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
      recordImpression.mutate({ skuId, surface: "home" });
    },
    [recordImpression]
  );

  if (isLoading || !suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Suggested for Your Home
        </h2>
      </div>
      <div className="space-y-2">
        {suggestions.map((s) => (
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
