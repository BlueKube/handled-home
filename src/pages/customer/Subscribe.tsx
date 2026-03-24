import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePlanDetail } from "@/hooks/usePlans";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CustomerSubscribe() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: plan, isLoading } = usePlanDetail(planId);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCheckout = async () => {
    if (!user || !planId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan_id: planId,
          customer_email: user.email,
          customer_id: user.id,
          success_url: `${window.location.origin}/customer/subscribe?plan=${planId}&success=1`,
          cancel_url: `${window.location.origin}/customer/subscribe?plan=${planId}`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        // Simulated success for dev (no Stripe products yet)
        setSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check for success return from Stripe
  const isSuccess = searchParams.get("success") === "1" || success;

  if (isSuccess) {
    return (
      <div className="p-4 pb-24 space-y-6 animate-fade-in text-center">
        <CheckCircle className="h-16 w-16 text-accent mx-auto" />
        <h1 className="text-h2">You're All Set!</h1>
        <p className="text-muted-foreground">Access is active now. Welcome to {plan?.name ?? "your plan"}!</p>
        <div className="space-y-3">
          <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-xs mx-auto">
            <li>• Next billing date: every 4 weeks from today</li>
            <li>• Your service weeks follow a predictable weekly rhythm</li>
            <li>• Manage your subscription anytime in Settings</li>
          </ul>
        </div>
        <Button onClick={() => navigate("/customer/routine")} className="w-full">
          Build / Confirm Routine
        </Button>
        <Button variant="outline" onClick={() => navigate("/customer")} className="w-full">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!plan) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Plan not found. Please select a plan first.</p>
        <Button variant="ghost" onClick={() => navigate("/customer/plans")} className="mt-4">Browse Plans</Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-h2">Confirm Your Plan</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {plan.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}
          {plan.display_price_text && (
            <p className="text-2xl font-bold">{plan.display_price_text}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-medium">Billing Summary</p>
          <div className="flex justify-between text-sm">
            <span>{plan.name}</span>
            <span>{plan.display_price_text ?? "—"}</span>
          </div>
          <p className="text-xs text-muted-foreground">Billed every 4 weeks. Cancel anytime.</p>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</>
        ) : (
          "Subscribe Now"
        )}
      </Button>
    </div>
  );
}
