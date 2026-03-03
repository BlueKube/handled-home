import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProperty } from "@/hooks/useProperty";
import { useJoinWaitlist } from "@/hooks/useWaitlist";
import { getStateMessage } from "@/lib/categoryStateMessaging";
import { getCategoryLabel, getCategoryIcon, getCategoryGradient } from "@/lib/serviceCategories";
import { emitStateAnalyticsEvent } from "@/lib/analyticsEvents";

interface CategoryWaitlistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  rawState: string;
}

const PRIORITY_CHIPS = [
  "Reliability",
  "Familiar provider",
  "Lowest price",
  "Earliest launch",
];

export function CategoryWaitlistSheet({
  open,
  onOpenChange,
  category,
  rawState,
}: CategoryWaitlistSheetProps) {
  const { user } = useAuth();
  const { property } = useProperty();
  const joinWaitlist = useJoinWaitlist();

  const msg = getStateMessage(rawState, category);
  const Icon = getCategoryIcon(category);
  const gradient = getCategoryGradient(category);
  const label = getCategoryLabel(category);

  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    try {
      await joinWaitlist.mutateAsync({
        email,
        full_name: fullName || undefined,
        zip_code: property?.zip_code ?? "00000",
        source: `category_waitlist_${category}`,
        referral_code: undefined,
        metadata: { category, preferences: selectedChips },
      });
      setSubmitted(true);
      if (user) emitStateAnalyticsEvent({ eventType: "waitlist_joined", actorId: user.id, actorRole: "customer", category, sourceSurface: "category_waitlist_sheet" });
    } catch (err: any) {
      if (err?.message?.includes("already on the waitlist")) {
        setSubmitted(true);
      } else {
        toast.error(err?.message ?? "Couldn't join waitlist. Try again.");
      }
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
        {submitted ? (
          <div className="py-12 text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="h-14 w-14 mx-auto text-primary" />
            <h2 className="text-h2">You're in!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              We'll notify you when {label} launches in your area.
            </p>
            <Button variant="secondary" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-left">{msg.headline}</SheetTitle>
                  <Badge variant="secondary" className="text-[10px] mt-0.5">
                    {msg.badge}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 space-y-5 pb-6">
              {/* Reassurance copy */}
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  We only launch when we can guarantee reliability.
                </p>
                <p className="text-sm text-muted-foreground">
                  Join the list and we'll invite you first.
                </p>
              </div>

              {/* Address confirmation */}
              {property?.street_address && (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5">Your address</p>
                  <p className="text-sm font-medium">
                    {property.street_address}, {property.city}, {property.state} {property.zip_code}
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="waitlist-email">Email</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
              </div>

              {/* Name (optional) */}
              <div className="space-y-2">
                <Label htmlFor="waitlist-name">
                  Name <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="waitlist-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="First Last"
                />
              </div>

              {/* Priority chips */}
              <div className="space-y-2">
                <Label>What's most important to you?</Label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedChips.includes(chip)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={joinWaitlist.isPending || !email}
              >
                {joinWaitlist.isPending ? "Joining..." : msg.ctaLabel}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
