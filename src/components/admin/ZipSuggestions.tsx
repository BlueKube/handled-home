import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface ZipSuggestionsProps {
  currentZips: string[];
  allZoneZips: string[][];
  nonServicedZips?: string[];
  onAdd: (zip: string) => void;
}

export function ZipSuggestions({ currentZips, allZoneZips, nonServicedZips = [], onAdd }: ZipSuggestionsProps) {
  const currentSet = new Set(currentZips);
  const prefixes = new Set(currentZips.map((z) => z.slice(0, 3)));

  if (prefixes.size === 0) return null;

  // Collect candidate zips from other zones + non-serviced that share a 3-digit prefix
  const candidates = new Set<string>();

  allZoneZips.forEach((zips) => {
    zips.forEach((z) => {
      if (!currentSet.has(z) && prefixes.has(z.slice(0, 3))) candidates.add(z);
    });
  });

  nonServicedZips.forEach((z) => {
    if (!currentSet.has(z) && prefixes.has(z.slice(0, 3))) candidates.add(z);
  });

  const suggestions = Array.from(candidates).sort().slice(0, 8);
  if (!suggestions.length) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-caption">Suggestions</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((zip) => (
          <Badge
            key={zip}
            variant="outline"
            className="cursor-pointer hover:bg-accent/10 press-feedback gap-1"
            onClick={() => onAdd(zip)}
          >
            <Plus className="h-3 w-3" /> {zip}
          </Badge>
        ))}
      </div>
    </div>
  );
}
