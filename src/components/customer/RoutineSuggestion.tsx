import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import { useProperty } from "@/hooks/useProperty";
import { useSuggestions, type ServiceSuggestion } from "@/hooks/useSuggestions";
import { useSuggestionActions } from "@/hooks/useSuggestionActions";
import { SuggestionCard } from "./SuggestionCard";
import { toast } from "sonner";

interface RoutineSuggestionProps {
  onAddToRoutine: (skuId: string, levelId?: string | null) => void;
}

export function RoutineSuggestion({ onAddToRoutine }: RoutineSuggestionProps) {
  const { property } = useProperty();
  const { data: suggestions, isLoading } = useSuggestions(property?.id, "home");
  const { recordImpression, hideSuggestion, recordAdd } = useSuggestionActions(property?.id);

  // Pick only the first adjacent/best_next suggestion
  const suggestion = (suggestions ?? []).find(
    (s) => s.suggestion_type === "adjacent" || s.suggestion_type === "best_next"
  );

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
      recordImpression.mutate({ skuId, surface: "home" });
    },
    [recordImpression]
  );

  if (isLoading || !suggestion) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Suggested Addition
        </h3>
      </div>
      <SuggestionCard
        suggestion={suggestion}
        onAdd={handleAdd}
        onHide={handleHide}
        onImpression={handleImpression}
      />
    </div>
  );
}
