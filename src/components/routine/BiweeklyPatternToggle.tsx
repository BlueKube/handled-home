import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Star } from "lucide-react";

interface BiweeklyPatternToggleProps {
  pattern: "A" | "B";
  onChange: (pattern: "A" | "B") => void;
  recommended?: "A" | "B";
}

export function BiweeklyPatternToggle({ pattern, onChange, recommended }: BiweeklyPatternToggleProps) {
  return (
    <div className="flex items-center gap-2 pl-1">
      <span className="text-xs text-muted-foreground">Pattern:</span>
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
        <button
          className={`px-2.5 py-2 min-h-[44px] rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
            pattern === "A" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange("A")}
        >
          Wk 1 & 3
          {recommended === "A" && <Star className="h-2.5 w-2.5 fill-current" />}
        </button>
        <button
          className={`px-2.5 py-2 min-h-[44px] rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
            pattern === "B" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange("B")}
        >
          Wk 2 & 4
          {recommended === "B" && <Star className="h-2.5 w-2.5 fill-current" />}
        </button>
      </div>
      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => onChange(pattern === "A" ? "B" : "A")}>
        <ArrowLeftRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
