import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Sparkles, ChevronRight } from "lucide-react";
import { useBundles } from "@/hooks/useBundles";
import { computeBundleSavings } from "@/lib/bundleSavings";

export function SeasonalBundleSpotlight() {
  const { data: bundles, isLoading } = useBundles();

  if (isLoading) return null;
  const bundle = bundles?.[0];
  if (!bundle) return null;

  const { saveCredits } = computeBundleSavings({
    totalCredits: bundle.total_credits,
    separateCredits: bundle.separate_credits,
  });

  return (
    <Link
      to={`/customer/bundles/${bundle.slug}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card className="p-4 bg-accent/5 border-accent/20 flex items-start gap-3 hover:bg-accent/10 active:bg-accent/15 transition-colors">
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{bundle.name}</p>
            {saveCredits > 0 && (
              <span className="text-[11px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                Save {saveCredits} credits
              </span>
            )}
          </div>
          {bundle.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {bundle.description}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-1" />
      </Card>
    </Link>
  );
}
