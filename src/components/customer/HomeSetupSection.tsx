import { useNavigate } from "react-router-dom";
import { usePropertyCoverage } from "@/hooks/usePropertyCoverage";
import { usePropertySignals } from "@/hooks/usePropertySignals";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, Map, Ruler, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HomeSetupSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const { hasData: hasCoverage } = usePropertyCoverage();
  const { hasData: hasSizing } = usePropertySignals();

  const items = [
    {
      label: "Coverage Map",
      hint: "What's already handled at your home",
      icon: Map,
      done: hasCoverage,
      path: "/customer/coverage-map?return=/customer/property",
    },
    {
      label: "Home Size",
      hint: "Quick estimate for better recommendations",
      icon: Ruler,
      done: hasSizing,
      path: "/customer/property-sizing?return=/customer/property",
    },
  ];

  return (
    <div className="px-4 mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-h3 text-foreground">Home Setup</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px]">
              <p className="text-xs">Helps us tailor recommendations and avoid irrelevant service suggestions.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-secondary/50 active:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                {item.done && (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
