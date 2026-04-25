import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Copy } from "lucide-react";
import { useReferralCodes } from "@/hooks/useReferralCodes";

export function VisitDetailReferralCard() {
  const navigate = useNavigate();
  const { codes: referralCodes } = useReferralCodes();
  const firstCode = referralCodes.data?.[0]?.code ?? null;

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="py-4 px-4">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-sm font-medium">Your neighbors would love this</p>
            <p className="text-xs text-muted-foreground">
              Share your referral code and earn credits when friends subscribe.
            </p>
            {firstCode && (
              <div className="flex items-center gap-2 mt-2">
                <code className="text-xs font-mono bg-card px-2 py-1 rounded border border-border">
                  {firstCode}
                </code>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(firstCode);
                      toast.success("Code copied!");
                    } catch {
                      toast.error("Couldn't copy — try selecting the code manually.");
                    }
                  }}
                  className="p-1.5 rounded hover:bg-secondary text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Copy referral code"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <Button
              variant="accent"
              className="gap-1 mt-1 min-h-[44px]"
              onClick={() => navigate("/customer/referrals")}
            >
              Share Code
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
