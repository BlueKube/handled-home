import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface FixPaymentPanelProps {
  subscriptionId: string;
}

export function FixPaymentPanel({ subscriptionId }: FixPaymentPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleFixPayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { subscription_id: subscriptionId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Could not open payment portal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Payment issue</p>
          <p className="text-xs text-muted-foreground">Your last payment failed. Update your payment method to keep your subscription active.</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleFixPayment} disabled={loading}>
          {loading ? "Opening…" : "Fix Payment"}
        </Button>
      </CardContent>
    </Card>
  );
}
