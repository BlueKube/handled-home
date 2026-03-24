import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Heart, Gift, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/serviceCategories";
import { useByopRecommendations } from "@/hooks/useByopRecommendation";
import { CheckCircle } from "lucide-react";

type ViewState = "form" | "confirmed";

export default function RecommendProvider() {
  const navigate = useNavigate();
  const { submit } = useByopRecommendations();

  const [view, setView] = useState<ViewState>("form");
  const [providerName, setProviderName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!providerName.trim()) errs.providerName = "Provider name is required.";
    if (!category) errs.category = "Service category is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    submit.mutate(
      {
        provider_name: providerName.trim(),
        category,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => setView("confirmed"),
      }
    );
  };

  const handleReset = () => {
    setProviderName("");
    setCategory("");
    setPhone("");
    setEmail("");
    setNote("");
    setErrors({});
    setView("form");
  };

  if (view === "confirmed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pb-24 space-y-6 animate-fade-in">
        <CheckCircle className="h-16 w-16 text-accent animate-fade-in" />
        <h2 className="text-h2 text-center">We've received your recommendation</h2>
        <p className="text-base font-semibold text-center">{providerName}</p>

        <Card className="w-full w-full">
          <CardContent className="pt-4 space-y-3">
            <p className="text-caption text-muted-foreground">What happens next:</p>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold text-accent">1.</span>
                We review their qualifications and coverage area.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-accent">2.</span>
                If they're a good fit, we reach out to invite them.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-accent">3.</span>
                Once accepted, they'll appear in your home team.
              </li>
            </ol>
            <p className="text-caption text-muted-foreground">
              Most reviews complete within 5–10 business days.
            </p>
          </CardContent>
        </Card>

        <button
          onClick={() => navigate("/customer/recommend-provider/status")}
          className="text-sm text-accent underline min-h-[44px] flex items-center"
        >
          Track this recommendation
        </button>

        <div className="w-full w-full space-y-3">
          <Button
            className="w-full h-12"
            onClick={() => navigate("/customer")}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleReset}
          >
            Recommend Another Provider
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/customer/more")}
          className="flex items-center gap-1 text-muted-foreground mb-2 min-h-[44px]"
          aria-label="Back to More menu"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">More</span>
        </button>
        <h1 className="text-h2">Recommend a Provider</h1>
        <p className="text-caption text-muted-foreground mt-1">
          Tell us about a provider you already trust — we'll reach out to see if they'd be a good fit for the Handled Home network.
        </p>
      </div>

      {/* Why Recommend Card */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="pt-4 flex gap-3">
          <Heart className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Keep working with providers you trust</p>
            <p className="text-caption text-muted-foreground mt-1">
              If accepted, they'll join your home team and service you through Handled Home — same relationship, better management.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Provider Info Form */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <h3 className="text-base font-semibold">Provider Details</h3>

          <div className="space-y-1.5">
            <Label htmlFor="provider-name">Provider or business name *</Label>
            <Input
              id="provider-name"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="e.g. Green Thumb Landscaping"
            />
            {errors.providerName && (
              <p className="text-xs text-destructive">{errors.providerName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Service category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.map((key) => (
                  <SelectItem key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="provider@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">How do you know this provider? (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="They've done my lawn for 3 years..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/200</p>
          </div>
        </CardContent>
      </Card>

      {/* Trust Language */}
      <p className="text-caption text-muted-foreground">
        We won't share your contact info with the provider. We'll reach out to them directly and professionally.
      </p>

      {/* BYOP Credit Notice */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 flex gap-3">
          <Gift className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="text-sm">
            You'll earn a <span className="font-semibold">$30 BYOP credit</span> if your recommended provider is accepted and completes onboarding.
          </p>
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        loading={submit.isPending}
      >
        Submit Recommendation
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>

      {/* Fine Print */}
      <p className="text-caption text-muted-foreground text-center">
        Not all providers will be eligible. We review qualifications, insurance, and coverage area. We'll let you know what happens.
      </p>
    </div>
  );
}
