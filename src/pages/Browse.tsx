import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSkus } from "@/hooks/useSkus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home, Sparkles, ArrowRight, CheckCircle2, Shield, Clock,
  Leaf, Bug, Droplets, Scissors, Zap, Star, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_ICONS: Record<string, typeof Home> = {
  mowing: Scissors,
  trimming: Scissors,
  cleanup: Leaf,
  treatment: Droplets,
  windows: Sparkles,
  power_wash: Zap,
  pool: Droplets,
  pest: Bug,
  pet_waste: Home,
  home_assistant: Home,
};

const CATEGORY_ORDER = [
  "mowing", "trimming", "cleanup", "treatment",
  "windows", "power_wash", "pool", "pest",
  "pet_waste", "home_assistant",
];

const CATEGORY_LABELS: Record<string, string> = {
  mowing: "Lawn Care",
  trimming: "Trimming & Edging",
  cleanup: "Cleanup & Seasonal",
  treatment: "Lawn Treatment",
  windows: "Window Cleaning",
  power_wash: "Power Washing",
  pool: "Pool Service",
  pest: "Pest Control",
  pet_waste: "Pet Care",
  home_assistant: "Home Assistant",
};

const PLANS = [
  {
    name: "Essential",
    price: 99,
    handles: 14,
    tagline: "The basics, handled.",
    features: ["Weekly lawn mowing", "Basic pest control", "Seasonal cleanups", "Photo proof of every visit"],
    popular: false,
  },
  {
    name: "Plus",
    price: 159,
    handles: 28,
    tagline: "Your full outdoor routine.",
    features: ["Everything in Essential", "Window cleaning", "Hedge trimming", "Power washing", "Priority scheduling"],
    popular: true,
  },
  {
    name: "Premium",
    price: 249,
    handles: 50,
    tagline: "Total home care.",
    features: ["Everything in Plus", "Pool service", "Home assistant tasks", "Gutter cleaning", "Dryer vent cleaning", "Unlimited add-ons"],
    popular: false,
  },
];

export default function Browse() {
  const navigate = useNavigate();
  const { data: skus, isError: skuError } = useSkus({ status: "active" });
  const [zip, setZip] = useState("");
  const [zipChecked, setZipChecked] = useState(false);
  const [zipResult, setZipResult] = useState<"covered" | "not_covered" | null>(null);
  const [zipChecking, setZipChecking] = useState(false);

  const groupedSkus = useMemo(() => {
    if (!skus) return {};
    const groups: Record<string, typeof skus> = {};
    for (const sku of skus) {
      const cat = sku.category ?? "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sku);
    }
    return groups;
  }, [skus]);

  const sortedCategories = useMemo(() => {
    return CATEGORY_ORDER.filter((cat) => groupedSkus[cat]?.length);
  }, [groupedSkus]);

  const handleCheckZip = async () => {
    setZipChecking(true);
    setZipChecked(false);
    setZipResult(null);
    const { data } = await supabase
      .from("zones")
      .select("id")
      .contains("zip_codes", [zip.trim()])
      .limit(1);
    setZipChecking(false);
    setZipChecked(true);
    setZipResult(data && data.length > 0 ? "covered" : "not_covered");
  };

  const handleGetStarted = () => {
    navigate("/auth?tab=signup");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="px-4 pt-12 pb-16 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Home className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Your home, <span className="text-primary">handled.</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            One app for all your home maintenance. Pick your services, set your schedule, and we take care of the rest.
            Verified providers, photo proof of every visit, and no contracts.
          </p>
        </div>

        {/* ZIP check */}
        <div className="max-w-sm mx-auto space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your ZIP code"
              value={zip}
              onChange={(e) => { setZip(e.target.value); setZipChecked(false); }}
              className="text-center text-lg h-12"
              maxLength={5}
            />
            <Button size="lg" className="h-12 px-6" onClick={handleCheckZip} disabled={zip.length < 5 || zipChecking}>
              {zipChecking ? "Checking…" : "Check"}
            </Button>
          </div>
          {zipChecked && zipResult === "covered" && (
            <p className="text-sm text-success animate-fade-in">
              Great news — we serve your area! Sign up to get started.
            </p>
          )}
          {zipChecked && zipResult === "not_covered" && (
            <p className="text-sm text-primary animate-fade-in">
              We're expanding to new areas. Sign up to be first in line when we launch near you.
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Set up your home", desc: "Tell us about your property — size, yard, what you need." },
              { step: "2", title: "Pick your plan", desc: "Choose Essential, Plus, or Premium. Change anytime." },
              { step: "3", title: "We handle the rest", desc: "Vetted providers, scheduled visits, photo proof. Done." },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-2">Simple, transparent pricing</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Billed every 4 weeks. No contracts. Cancel anytime.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <Card key={plan.name} className={plan.popular ? "border-primary ring-1 ring-primary/20" : ""}>
                <CardHeader className="pb-2">
                  {plan.popular && (
                    <Badge className="w-fit mb-2 text-[10px]">Most Popular</Badge>
                  )}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {plan.handles} service handles per cycle
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                    onClick={handleGetStarted}
                  >
                    Get Started <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Catalog */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-2">Services available</h2>
          {skuError ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Unable to load services. Check your connection.</p>
            </div>
          ) : <>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {skus?.length ?? 0} services across {sortedCategories.length} categories. All included in your plan.
          </p>
          <div className="space-y-6">
            {sortedCategories.map((category) => {
              const categorySkus = groupedSkus[category] ?? [];
              const Icon = CATEGORY_ICONS[category] ?? Home;
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">{CATEGORY_LABELS[category] ?? category}</h3>
                    <Badge variant="outline" className="text-[10px]">{categorySkus.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categorySkus.map((sku) => (
                      <Card key={sku.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium">{sku.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{sku.description}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                            {sku.handle_cost}h
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          </>}
        </div>
      </section>

      {/* Trust signals */}
      <section className="px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <Shield className="h-6 w-6 text-primary mx-auto" />
              <h3 className="font-semibold text-sm">Vetted Providers</h3>
              <p className="text-xs text-muted-foreground">Background checked, insured, and quality-scored.</p>
            </div>
            <div className="space-y-2">
              <Star className="h-6 w-6 text-primary mx-auto" />
              <h3 className="font-semibold text-sm">Photo Proof</h3>
              <p className="text-xs text-muted-foreground">Before and after photos of every visit, viewable in the app.</p>
            </div>
            <div className="space-y-2">
              <Clock className="h-6 w-6 text-primary mx-auto" />
              <h3 className="font-semibold text-sm">No Contracts</h3>
              <p className="text-xs text-muted-foreground">Cancel, pause, or change your plan anytime. No commitments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 text-center space-y-4 bg-muted/30">
        <h2 className="text-2xl font-bold">Ready to get your home handled?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Join thousands of homeowners who stopped juggling vendors and started enjoying their weekends.
        </p>
        <Button size="lg" onClick={handleGetStarted} className="px-8">
          Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground">No credit card required to browse and set up your home.</p>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Handled Home</span>
          <div className="flex gap-4">
            <Link to="/providers" className="hover:text-foreground transition-colors">For Service Providers</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
