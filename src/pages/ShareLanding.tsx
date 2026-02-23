import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGrowthEvents } from "@/hooks/useGrowthEvents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ImageIcon, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import handledLogo from "@/assets/handled-home-logo.png";

export default function ShareLanding() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { recordEvent } = useGrowthEvents();
  const hasTracked = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["share-landing", shareCode],
    enabled: !!shareCode,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_share_card_public" as any, {
        p_share_code: shareCode,
      });
      if (error) throw error;
      return data as any;
    },
  });

  // Record landing_viewed event once
  useEffect(() => {
    if (shareCode && data && !data.expired && !hasTracked.current) {
      hasTracked.current = true;
      recordEvent.mutate({
        eventType: "landing_viewed",
        actorRole: "system",
        sourceSurface: "receipt_share_card",
        idempotencyKey: `landing_${shareCode}_${new Date().toISOString().slice(0, 13)}`,
        context: { share_code: shareCode },
      });
    }
  }, [shareCode, data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.expired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <img src={handledLogo} alt="Handled Home" className="h-10 mb-6" />
        <h1 className="text-h2 mb-2">This share has expired</h1>
        <p className="text-sm text-muted-foreground mb-6">The link is no longer active.</p>
        <Button onClick={() => navigate("/auth")} size="lg">
          Get Handled Home <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  const categoryLabel = data.category?.replace(/_/g, " ") ?? "Home Service";
  const completedDate = data.completed_at ? format(new Date(data.completed_at), "MMMM d, yyyy") : null;
  const bullets: string[] = data.checklist_bullets ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero photo area */}
      <div className="relative w-full aspect-[4/3] bg-muted flex items-center justify-center">
        {data.hero_photo_path ? (
          <div className="w-full h-full bg-gradient-to-b from-muted to-muted/80 flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-secondary to-muted flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {/* Brand stamp */}
        <div className="absolute bottom-4 right-4 bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-lg">
          Handled.
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-5 max-w-lg mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <Badge variant="outline" className="capitalize mb-1">{categoryLabel}</Badge>
          {completedDate && (
            <p className="text-xs text-muted-foreground">{completedDate}</p>
          )}
          {data.first_name && (
            <p className="text-sm text-muted-foreground">{data.first_name}'s home</p>
          )}
          {data.neighborhood && (
            <p className="text-xs text-muted-foreground">{data.neighborhood}</p>
          )}
        </div>

        {/* Checklist bullets */}
        {bullets.length > 0 && (
          <div className="space-y-2">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate(`/auth?share=${shareCode}`)}
          >
            Get Handled Home <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/provider/apply")}
          >
            I'm a provider
          </Button>
        </div>

        {/* Footer */}
        <div className="flex justify-center pt-4">
          <img src={handledLogo} alt="Handled Home" className="h-6 opacity-60" />
        </div>
      </div>
    </div>
  );
}
