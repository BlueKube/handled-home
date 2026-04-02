import { forwardRef } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface PopularServicesPreviewProps {
  skus: Array<{ id: string; name: string; category?: string | null; handle_cost?: number | null }>;
}

export const PopularServicesPreview = forwardRef<HTMLDivElement, PopularServicesPreviewProps>(
  function PopularServicesPreview({ skus }, ref) {
    if (skus.length === 0) return null;

    return (
      <div ref={ref} className="w-full space-y-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Popular services
        </p>
        <div className="space-y-2">
          {skus.slice(0, 3).map((service) => (
            <Card key={service.id} className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.category ?? "Home service"}</p>
              </div>
              {service.handle_cost != null && (
                <p className="text-xs font-semibold text-accent shrink-0">
                  {service.handle_cost} handles
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }
);
