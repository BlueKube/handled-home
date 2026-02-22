import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface BiweeklyPatternToggleProps {
  pattern: "A" | "B";
  onChange: (pattern: "A" | "B") => void;
}

export function BiweeklyPatternToggle({ pattern, onChange }: BiweeklyPatternToggleProps) {
  return (
    <div className="flex items-center gap-2 pl-1">
      <span className="text-xs text-muted-foreground">Pattern:</span>
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
        <button
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            pattern === "A" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange("A")}
        >
          Wk 1 & 3
        </button>
        <button
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            pattern === "B" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange("B")}
        >
          Wk 2 & 4
        </button>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange(pattern === "A" ? "B" : "A")}>
        <ArrowLeftRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
