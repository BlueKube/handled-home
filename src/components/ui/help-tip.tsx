import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

/**
 * Mobile-friendly help tooltip — taps open on touch, hovers on desktop.
 * Renders a small HelpCircle icon with a tooltip that describes the concept.
 */
export function HelpTip({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] -m-2 p-2 ${className ?? ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          aria-label="More info"
        >
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
