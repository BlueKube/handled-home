import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, RefreshCw, ArrowRightLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const POINTS = [
  {
    icon: Sparkles,
    title: "Simple allowance",
    body: "Most homes use 10–13 handles per month. Each service costs a set number of handles — no surprises.",
  },
  {
    icon: ArrowRightLeft,
    title: "Swap anytime",
    body: "Change which services you get whenever you want. Your new choices apply next cycle.",
  },
  {
    icon: RefreshCw,
    title: "Unused handles roll over",
    body: "Didn't use them all? They carry forward (up to 1.5× your monthly allowance). Use them for extras or seasonal services.",
  },
];

export function HandlesExplainer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="pt-5 pb-4 space-y-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <p className="text-sm font-semibold text-foreground">
              How handles work
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>

        {expanded && (
          <div className="space-y-3">
            {POINTS.map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <p.icon className="h-3.5 w-3.5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
