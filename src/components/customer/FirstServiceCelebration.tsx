import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PartyPopper, Share2, ArrowRight, Star, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CELEBRATION_KEY = "first_service_celebrated";

interface FirstServiceCelebrationProps {
  jobId: string;
  providerName?: string;
  serviceDate?: string;
}

export function FirstServiceCelebration({ jobId, providerName, serviceDate }: FirstServiceCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const alreadyCelebrated = localStorage.getItem(CELEBRATION_KEY);
    if (!alreadyCelebrated && jobId) {
      setVisible(true);
    }
  }, [jobId]);

  const dismiss = () => {
    localStorage.setItem(CELEBRATION_KEY, jobId);
    setVisible(false);
  };

  const viewReceipt = () => {
    dismiss();
    navigate(`/customer/visits/${jobId}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My home is handled!",
          text: "Just had my first service with Handled Home — proof-of-work receipt and everything. One subscription, all my home services.",
        });
      } catch {
        // User cancelled share
      }
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-sm space-y-6 text-center"
          >
            {/* Celebration icon */}
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <PartyPopper className="h-16 w-16 text-accent mx-auto" />
            </motion.div>

            {/* Headline */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your home is handled!</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Your first service is complete. Your subscription is already working for you.
              </p>
            </div>

            {/* Service summary */}
            <div className="bg-card rounded-2xl border p-4 space-y-2 text-left">
              {providerName && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Serviced by {providerName}</span>
                </div>
              )}
              {serviceDate && (
                <p className="text-xs text-muted-foreground ml-6">{serviceDate}</p>
              )}
              <p className="text-xs text-muted-foreground ml-6">
                Your proof-of-work receipt is ready to view with photos and checklist details.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full h-12 text-base rounded-xl gap-2" onClick={viewReceipt}>
                View Your Receipt
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share the news
              </Button>

              {/* Referral Card */}
              <Card className="border-accent/20 bg-accent/5 text-left">
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">Know someone who'd love this?</p>
                      <p className="text-xs text-muted-foreground">
                        Earn a $30 credit when a friend subscribes.
                      </p>
                      <Button
                        variant="accent"
                        className="gap-1 mt-1 min-h-[44px]"
                        onClick={() => {
                          dismiss();
                          navigate("/customer/referrals");
                        }}
                      >
                        Get Your Referral Code
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <button
                onClick={dismiss}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
              >
                Continue to dashboard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
