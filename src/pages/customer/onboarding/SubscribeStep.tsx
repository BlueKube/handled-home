import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { type Plan } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QueryErrorCard } from "@/components/QueryErrorCard";

export function SubscribeStep({ planId, onComplete, onSkip }: { planId: string | null; onComplete: () => Promise<void>; onSkip: () => Promise<void> }) {
  const { user } = useAuth();
  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ["plans", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").eq("id", planId!).single();
      if (error) throw error;
      return data as Plan;
    },
  });
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user || !planId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan_id: planId, customer_email: user.email,
          success_url: `${window.location.origin}/customer/onboarding?checkout=success`,
          cancel_url: `${window.location.origin}/customer/onboarding?checkout=cancel`,
        },
      });
      if (error) throw error;
      if (data?.url) { window.location.href = data.url; }
      else { toast.success("Subscription activated!"); await onComplete(); }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;
  if (isError) return <QueryErrorCard message="Could not load plan details." />;
  if (!plan) return <p className="text-center text-muted-foreground py-8">Plan not found.</p>;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Confirm your membership</h1>
        <p className="text-muted-foreground text-sm mt-1">
          One step before your first visit.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">{plan.name}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {plan.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}
          {plan.display_price_text && <p className="text-2xl font-bold">{plan.display_price_text}</p>}
          <p className="text-xs text-muted-foreground">Billed every 4 weeks. Cancel anytime.</p>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center">
        Card collected by Stripe. We never see your card number.
      </p>
      <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={handleCheckout} disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</> : "Subscribe Now"}
      </Button>
      <Button variant="ghost" className="w-full text-sm min-h-[44px]" onClick={onSkip} disabled={loading}>
        Skip for now — subscribe when you're ready
      </Button>
    </div>
  );
}
