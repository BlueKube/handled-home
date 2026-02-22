import { useCustomerBilling } from "@/hooks/useCustomerBilling";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Plus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function CustomerBillingMethods() {
  const navigate = useNavigate();
  const { paymentMethods, isLoading } = useCustomerBilling();
  const [adding, setAdding] = useState(false);

  const handleAddMethod = async () => {
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-setup-intent");
      if (error) throw error;
      // In production this would open Stripe Elements with the client_secret
      toast.info("Setup intent created. Stripe Elements integration needed for card collection.");
    } catch (err: any) {
      toast.error("Could not start payment method setup");
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customer/billing")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Payment Methods</h1>
      </div>

      <div className="space-y-2">
        {paymentMethods.map((pm) => (
          <Card key={pm.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{pm.brand} ····{pm.last4}</p>
                <p className="text-xs text-muted-foreground">Expires {pm.exp_month}/{pm.exp_year}</p>
              </div>
              {pm.is_default && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Star className="h-3 w-3" /> Default
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full" variant="outline" onClick={handleAddMethod} disabled={adding}>
        <Plus className="h-4 w-4 mr-2" />
        {adding ? "Setting up…" : "Add payment method"}
      </Button>
    </div>
  );
}
