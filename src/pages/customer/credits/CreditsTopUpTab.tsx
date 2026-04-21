import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { CREDIT_PACKS, type CreditPackId } from "@/lib/creditPacks";

export function CreditsTopUpTab() {
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState<CreditPackId | null>(null);

  const handleBuy = async (packId: CreditPackId) => {
    if (!user) return;
    setPurchasing(packId);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-credit-pack", {
        body: {
          pack_id: packId,
          customer_email: user.email,
          customer_id: user.id,
          success_url: `${window.location.origin}/customer/credits?purchase=success`,
          cancel_url: `${window.location.origin}/customer/credits?purchase=cancel`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Credit pack checkout isn't available yet. Please try again later.");
      }
    } catch {
      toast.error("Couldn't start checkout. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Top up when you're running low. Credits never expire while your subscription is active.
      </p>

      {CREDIT_PACKS.map((pack) => {
        const isRecommended = !!pack.recommended;
        const isPurchasing = purchasing === pack.id;
        return (
          <Card
            key={pack.id}
            className={`relative overflow-hidden ${
              isRecommended ? "ring-2 ring-accent shadow-lg" : ""
            }`}
          >
            {isRecommended && (
              <div className="absolute -top-3 left-4 z-10">
                <Badge className="bg-accent text-accent-foreground gap-1 shadow-sm">
                  <Star className="h-3 w-3" /> Best Value
                </Badge>
              </div>
            )}
            <CardHeader className="pt-6 pb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-foreground">{pack.name}</span>
                </div>
                {pack.savingsPct && pack.savingsPct > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    Save {pack.savingsPct}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight">{pack.priceText}</span>
                <span className="text-sm text-muted-foreground">one-time</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-accent/5 border border-accent/20 px-3 py-2.5">
                <Sparkles className="h-4 w-4 text-accent shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{pack.credits} credits</span>
                  <span className="text-muted-foreground"> · {pack.perCreditText}</span>
                </div>
              </div>
              <Button
                className={`w-full ${isRecommended ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                onClick={() => handleBuy(pack.id)}
                disabled={isPurchasing || !!purchasing}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Starting checkout…
                  </>
                ) : (
                  `Buy ${pack.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
