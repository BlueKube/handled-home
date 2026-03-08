import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, X } from "lucide-react";

const DISMISS_KEY = "hh_home_team_expand_dismissed";

export function HomeTeamExpandCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true"
  );

  // Only show for users who came through BYOC (have at least one activation)
  const { data: hasActivation } = useQuery({
    queryKey: ["has_byoc_activation", user?.id],
    enabled: !!user && !dismissed,
    queryFn: async () => {
      const { count } = await supabase
        .from("byoc_activations")
        .select("id", { count: "exact", head: true })
        .eq("customer_user_id", user!.id)
        .eq("status", "active");
      return (count ?? 0) > 0;
    },
  });

  if (dismissed || !hasActivation) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-accent" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-sm font-semibold">
                Want to keep track of your other home services too?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add the services you already use — pest control, pool, cleaning, and more.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => navigate("/customer/routine")}
              >
                I already have a provider
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-xs"
                onClick={handleDismiss}
              >
                Maybe later
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-secondary text-muted-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
