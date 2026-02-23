import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGrowthEvents, useFrequencyCapCheck } from "@/hooks/useGrowthEvents";
import { useIsSurfaceEnabled } from "@/hooks/useGrowthSurfaceConfig";
import { useReferralCodes } from "@/hooks/useReferralCodes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

const DISMISS_KEY = "cross_poll_dismissed_at";

export function CrossPollinationCard({ zoneId, propertyId }: { zoneId?: string; propertyId?: string }) {
  const { user } = useAuth();
  const { recordEvent } = useGrowthEvents();
  const { codes } = useReferralCodes();
  const promptTracked = useRef(false);
  const { enabled: surfaceEnabled } = useIsSurfaceEnabled(zoneId, "lawn_care", "cross_pollination");
  const capCheck = useFrequencyCapCheck("cross_pollination_invite", "reminder_per_week", zoneId, "lawn_care");
  const [dismissed, setDismissed] = useState(() => {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    return Date.now() - parseInt(v, 10) < 14 * 24 * 60 * 60 * 1000; // 2 weeks
  });

  // Fetch categories the customer already subscribes to
  const { data: subscribedCats } = useQuery({
    queryKey: ["subscribed-categories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("subscriptions")
        .select("zone_id, plans(name)")
        .eq("customer_id", user!.id)
        .eq("status", "active");
      return data ?? [];
    },
  });

  // Static list of all possible categories
  const allCategories = ["lawn_care", "cleaning", "landscaping", "pest_control", "pool_care"];
  const unsubscribedCats = allCategories.filter(
    (c) => !subscribedCats?.some((s: any) => s.plans?.name?.toLowerCase().includes(c.replace("_", " ")))
  );

  const inviteLink = codes.data?.[0]?.code
    ? `${window.location.origin}/invite/${codes.data[0].code}`
    : null;

  // Track prompt shown
  useEffect(() => {
    if (!dismissed && unsubscribedCats.length > 0 && !promptTracked.current && user) {
      promptTracked.current = true;
      recordEvent.mutate({
        eventType: "cross_poll_shown",
        actorRole: "customer",
        sourceSurface: "cross_pollination_invite",
        idempotencyKey: `cross_poll_shown_${user.id}_${new Date().toISOString().slice(0, 10)}`,
        zoneId,
      });
    }
  }, [dismissed, unsubscribedCats.length, user]);

  if (dismissed || unsubscribedCats.length === 0 || !surfaceEnabled || capCheck.data?.suppressed) return null;

  const friendlyNames: Record<string, string> = {
    lawn_care: "lawn care pro",
    cleaning: "house cleaner",
    landscaping: "landscaper",
    pest_control: "pest control pro",
    pool_care: "pool cleaner",
  };

  const topCat = unsubscribedCats[0];
  const friendlyName = friendlyNames[topCat] ?? topCat.replace(/_/g, " ");

  const handleInvite = () => {
    const smsBody = `Hey! I've been using Handled Home and love it. You should check it out — ${inviteLink ?? "https://handledho.me"}`;
    
    recordEvent.mutate({
      eventType: "cross_poll_initiated",
      actorRole: "customer",
      sourceSurface: "cross_pollination_invite",
      idempotencyKey: `cross_poll_init_${user?.id}_${topCat}_${Date.now()}`,
      zoneId,
      category: topCat,
    });

    if (inviteLink) {
      navigator.clipboard.writeText(smsBody);
      toast.success("Message copied! Send it to your pro.");
    } else {
      toast.info("Generate a referral code first in your Referrals page.");
    }
  };

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="py-4 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Users className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Have a {friendlyName}?</p>
              <p className="text-xs text-muted-foreground">
                Invite them to Handled Home and get all your services in one place.
              </p>
              <Button size="sm" variant="outline" className="gap-1 mt-1" onClick={handleInvite}>
                <MessageSquare className="h-3.5 w-3.5" /> Invite my pro
              </Button>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, String(Date.now()));
              setDismissed(true);
            }}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
