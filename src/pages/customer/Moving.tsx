import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, CheckCircle, Truck, Users, ArrowRight, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TOTAL_STEPS = 4;

export default function CustomerMoving() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1
  const [moveDate, setMoveDate] = useState("");
  const [keepServices, setKeepServices] = useState(true);

  // Step 2
  const [newAddress, setNewAddress] = useState("");
  const [newZip, setNewZip] = useState("");
  const [zipCovered, setZipCovered] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // Step 4 - new homeowner
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const checkZipCoverage = async () => {
    if (newZip.length < 5) return;
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from("zones")
        .select("id")
        .eq("status", "active")
        .contains("zip_codes", [newZip])
        .limit(1);
      if (error) throw error;
      setZipCovered((data ?? []).length > 0);
    } catch {
      setZipCovered(false);
    } finally {
      setChecking(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Get user's property
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      const propertyId = props?.[0]?.id;
      if (!propertyId) {
        toast.error("No property found. Please add your home first.");
        setSubmitting(false);
        return;
      }

      // Save property transition
      await (supabase.from("property_transitions") as any).insert({
        property_id: propertyId,
        old_owner_user_id: user.id,
        move_date: moveDate,
        new_address: newAddress || null,
        new_zip: newZip || null,
        new_zip_covered: zipCovered,
        new_owner_name: newOwnerName || null,
        new_owner_email: newOwnerEmail || null,
        new_owner_phone: newOwnerPhone || null,
        keep_services_until_move: keepServices,
        notify_on_launch: zipCovered === false,
      });

      // If new ZIP is not covered, save as customer lead
      if (zipCovered === false && newZip) {
        await (supabase.from("customer_leads") as any).upsert(
          {
            email: user.email,
            phone: null,
            zip_code: newZip,
            source: "moving",
            notify_on_launch: true,
          },
          { onConflict: "email" }
        );
      }

      queryClient.invalidateQueries({ queryKey: ["property"] });
      setCompleted(true);
      toast.success("Your move has been recorded");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-5">
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="h-10 w-10 text-success mx-auto" />
            <h2 className="text-lg font-semibold">You're all set</h2>
            {zipCovered ? (
              <p className="text-sm text-muted-foreground">
                We'll transfer your plan to your new address after your move.
                {keepServices && " Your current services continue until your move date."}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                We'll notify you when Handled Home launches in your new area.
                {keepServices && " Your current services continue until your move date."}
              </p>
            )}
            <Button onClick={() => navigate("/customer")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-h2">I'm Moving</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Move Date */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">When are you moving?</h2>
            <p className="text-sm text-muted-foreground">We'll make sure everything is handled.</p>
          </div>
          <div className="space-y-2">
            <Label>Move date</Label>
            <Input
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Keep services until move date</p>
              <p className="text-xs text-muted-foreground">Your home stays handled until you leave</p>
            </div>
            <Switch checked={keepServices} onCheckedChange={setKeepServices} />
          </div>
          <Button className="w-full" disabled={!moveDate} onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: New Address */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Where are you moving?</h2>
            <p className="text-sm text-muted-foreground">We'll check if we can serve your new home.</p>
          </div>
          <div className="space-y-2">
            <Label>New address (optional)</Label>
            <Input
              placeholder="123 New Street"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>New ZIP code</Label>
            <Input
              placeholder="ZIP code"
              value={newZip}
              onChange={(e) => setNewZip(e.target.value)}
              maxLength={5}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button
              className="flex-1"
              disabled={newZip.length < 5 || checking}
              onClick={async () => {
                await checkZipCoverage();
                setStep(3);
              }}
            >
              {checking ? "Checking..." : "Check Coverage"}
            </Button>
          </div>
          <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => { setZipCovered(null); setStep(3); }}>
            I don't know my new ZIP yet
          </Button>
        </div>
      )}

      {/* Step 3: Coverage Result */}
      {step === 3 && (
        <div className="space-y-4">
          {zipCovered === true ? (
            <Card className="border-success/40 bg-success/5">
              <CardContent className="py-5 space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <h3 className="font-semibold">Great news — we serve your new area!</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll transfer your plan to your new address after your move. Same service, new home.
                </p>
              </CardContent>
            </Card>
          ) : zipCovered === false ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="py-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold">We're not in your new area yet</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We're growing fast. We'll save your info and notify you as soon as we launch in {newZip}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-5 space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                  <h3 className="font-semibold">No problem</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  When you know your new address, come back and we'll check coverage.
                </p>
              </CardContent>
            </Card>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1" onClick={() => setStep(4)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: New Homeowner Referral */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Know who's buying your home?</h2>
            <p className="text-sm text-muted-foreground">
              They might want to keep the services going. We'll reach out with a warm intro.
            </p>
          </div>
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Their name</Label>
                <Input
                  placeholder="New homeowner's name"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input
                  placeholder="Email address"
                  type="email"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone</Label>
                <Input
                  placeholder="Phone number"
                  type="tel"
                  value={newOwnerPhone}
                  onChange={(e) => setNewOwnerPhone(e.target.value)}
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button className="flex-1" onClick={handleComplete} disabled={submitting}>
              {submitting ? "Saving..." : "Complete"}
            </Button>
          </div>
          <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={handleComplete} disabled={submitting}>
            Skip — I don't know yet
          </Button>
        </div>
      )}
    </div>
  );
}
