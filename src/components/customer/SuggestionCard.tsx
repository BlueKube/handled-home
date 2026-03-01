import { useState, useEffect, useRef } from "react";
import { X, Plus, ChevronDown, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ServiceSuggestion } from "@/hooks/useSuggestions";

interface SuggestionCardProps {
  suggestion: ServiceSuggestion;
  onAdd: (suggestion: ServiceSuggestion) => void;
  onHide: (skuId: string, reason: string) => void;
  onImpression?: (skuId: string) => void;
}

const HIDE_REASONS = [
  { value: "already_have_someone", label: "Already have someone" },
  { value: "not_relevant", label: "Not relevant" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_now", label: "Not now" },
] as const;

export function SuggestionCard({ suggestion, onAdd, onHide, onImpression }: SuggestionCardProps) {
  const [hideOpen, setHideOpen] = useState(false);
  const impressionRef = useRef(false);

  // Record impression once per mount
  useEffect(() => {
    if (!impressionRef.current && onImpression) {
      impressionRef.current = true;
      onImpression(suggestion.sku_id);
    }
  }, [suggestion.sku_id, onImpression]);

  const handlesCost = suggestion.default_level?.handles_cost ?? suggestion.handle_cost;
  const levelLabel = suggestion.default_level?.label;

  const isPredicted = suggestion.suggestion_type === "predicted";

  return (
    <Card className={`p-3 flex items-start gap-3 group ${isPredicted ? "border-primary/30 bg-primary/5" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium truncate">{suggestion.sku_name}</span>
          {isPredicted && (
            <span className="text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0 flex items-center gap-0.5">
              <Brain className="h-2.5 w-2.5" />
              AI pick
            </span>
          )}
          {levelLabel && (
            <span className="text-[10px] text-muted-foreground bg-secondary rounded px-1.5 py-0.5 shrink-0">
              {levelLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.reason}</p>
        <p className="text-xs text-primary font-medium mt-1">{handlesCost}h</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => onAdd(suggestion)}
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
        <Popover open={hideOpen} onOpenChange={setHideOpen}>
          <PopoverTrigger asChild>
            <button
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Hide suggestion"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1.5">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Why hide this?</p>
            {HIDE_REASONS.map((r) => (
              <button
                key={r.value}
                className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-secondary transition-colors"
                onClick={() => {
                  onHide(suggestion.sku_id, r.value);
                  setHideOpen(false);
                }}
              >
                {r.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  );
}
