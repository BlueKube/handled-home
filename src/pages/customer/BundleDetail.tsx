import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useBundle } from "@/hooks/useBundle";
import { useBookBundle, BookBundleError } from "@/hooks/useBookBundle";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useHandleBalance } from "@/hooks/useHandles";
import { computeBundleSavings } from "@/lib/bundleSavings";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { BundleVisitDayPicker } from "@/components/customer/BundleVisitDayPicker";

export default function BundleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, isError } = useBundle(slug);
  const { data: subscription } = useCustomerSubscription();
  const { data: balance } = useHandleBalance();
  const bookBundle = useBookBundle();

  const [pickerOpen, setPickerOpen] = useState(false);

  const totalEstMinutes = useMemo(
    () => (data?.items ?? []).reduce((acc, i) => acc + i.est_minutes, 0),
    [data?.items],
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 animate-fade-in">
        <QueryErrorCard message="Couldn't load this bundle. Try again later." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 animate-fade-in space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          This bundle isn't available right now.
        </p>
        <Button variant="ghost" onClick={() => navigate("/customer/services")}>
          Back to services
        </Button>
      </div>
    );
  }

  const { bundle, items } = data;
  const { saveCredits, savePercent } = computeBundleSavings({
    totalCredits: bundle.total_credits,
    separateCredits: bundle.separate_credits,
  });

  const handlePick = async (jobId: string) => {
    if (!subscription?.id || !user?.id) {
      toast.error("Subscription required to book a bundle.");
      return;
    }
    try {
      await bookBundle.mutateAsync({
        bundleId: bundle.id,
        totalCredits: bundle.total_credits,
        items,
        targetJobId: jobId,
        subscriptionId: subscription.id,
        customerId: user.id,
      });
      setPickerOpen(false);
      toast.success(`${bundle.name} added to your visit.`);
      navigate(`/customer/visits/${jobId}`);
    } catch (err) {
      if (err instanceof BookBundleError) {
        if (err.code === "insufficient_handles") {
          toast.error(
            `Not enough credits. You have ${err.balance ?? 0}, this bundle holds ${err.required ?? bundle.total_credits}.`,
          );
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Something went wrong. Try again.");
      }
    }
  };

  const balanceShort =
    typeof balance === "number" && balance < bundle.total_credits;

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border border-accent/20 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-accent uppercase tracking-wide">
            {bundle.season}
          </span>
        </div>
        <h1 className="text-h2">{bundle.name}</h1>
        <p className="text-xs text-muted-foreground">
          {bundle.window_start_date} — {bundle.window_end_date}
        </p>
        {bundle.description && (
          <p className="text-sm text-muted-foreground mt-2">{bundle.description}</p>
        )}
      </div>

      {/* Items */}
      <section className="space-y-2">
        <h2 className="text-h3">What's included</h2>
        <Card className="p-0 divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  About {item.est_minutes} min
                </p>
              </div>
              <span className="text-sm font-semibold text-foreground shrink-0">
                {item.credits} cr
              </span>
            </div>
          ))}
        </Card>
        <p className="text-xs text-muted-foreground text-center">
          Total time on the day: about {totalEstMinutes} minutes added to your visit.
        </p>
      </section>

      {/* Savings */}
      <section className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground line-through">
            {bundle.separate_credits} cr separate
          </span>
          <span className="text-2xl font-bold text-accent">
            {bundle.total_credits} cr
          </span>
        </div>
        {saveCredits > 0 && (
          <p className="text-sm font-medium text-accent">
            Save {saveCredits} credits ({savePercent}% off)
          </p>
        )}
      </section>

      {/* CTA */}
      <div className="space-y-2">
        {balanceShort && (
          <p className="text-xs text-destructive text-center">
            You have {balance} credits — this bundle needs {bundle.total_credits}. Top
            up first or pick a smaller add-on.
          </p>
        )}
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl"
          onClick={() => setPickerOpen(true)}
          disabled={bookBundle.isPending || balanceShort}
        >
          Add to a visit
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Credits are held when you confirm. Refunded if a fix needs fewer.
        </p>
      </div>

      <BundleVisitDayPicker
        open={pickerOpen}
        onOpenChange={(o) => {
          if (!bookBundle.isPending) setPickerOpen(o);
        }}
        estimatedExtraMinutes={totalEstMinutes}
        onPick={handlePick}
        isBooking={bookBundle.isPending}
      />
    </div>
  );
}
