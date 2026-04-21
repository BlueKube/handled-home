import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSkus } from "@/hooks/useSkus";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home, Sparkles, ArrowRight, Shield, Clock,
  Leaf, Bug, Droplets, Scissors, Zap, Star, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlanFamilyCard } from "@/components/plans/PlanFamilyCard";
import { FAMILY_HIGHLIGHTS } from "@/components/plans/planTierStyles";
import type { ActiveFamily } from "@/hooks/usePlanVariants";

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

// Public Browse page is unauthenticated, so it can't query the plans table
// (RLS requires authenticated). These summaries are the marketing floor for
// each family — the smallest variant's price as "Starts at $X". If/when the
// 12 draft variants flip to active and a public-read RLS policy lands,
// replace with a live query via a scoped RPC. Tracked in docs/upcoming/TODO.md.
interface FamilySummary {
  family: ActiveFamily;
  familyName: string;
  tagline: string;
  startsAtPriceText: string;
  variantCount: number;
}

const FAMILY_SUMMARIES: FamilySummary[] = [
  { family: "basic",   familyName: "Basic",   tagline: "The basics, handled.",       startsAtPriceText: "$79",  variantCount: 4 },
  { family: "full",    familyName: "Full",    tagline: "Your full outdoor routine.", startsAtPriceText: "$149", variantCount: 4 },
  { family: "premier", familyName: "Premier", tagline: "Total home care.",           startsAtPriceText: "$219", variantCount: 4 },
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
            Billed every 4 weeks. We size the plan to your home after sign-up. No contracts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FAMILY_SUMMARIES.map((f) => (
              <PlanFamilyCard
                key={f.family}
                family={f.family}
                familyName={f.familyName}
                tagline={f.tagline}
                startsAtPriceText={f.startsAtPriceText}
                variantCount={f.variantCount}
                highlights={FAMILY_HIGHLIGHTS[f.family]}
                isRecommended={f.family === "full"}
                zoneEnabled
                onSelect={handleGetStarted}
              />
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
