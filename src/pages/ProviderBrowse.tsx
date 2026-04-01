import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Truck, DollarSign, ArrowRight, CheckCircle2, Shield, Clock,
  MapPin, Calendar, TrendingUp, Users, Zap, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EARNINGS_EXAMPLES = [
  { stops: 4, daily: "$220", weekly: "$1,100", desc: "Part-time (4 stops/day)" },
  { stops: 6, daily: "$330", weekly: "$1,650", desc: "Standard (6 stops/day)" },
  { stops: 8, daily: "$440", weekly: "$2,200", desc: "Full route (8 stops/day)" },
];

const CATEGORIES = [
  "Lawn Care", "Pest Control", "Window Cleaning", "Power Washing",
  "Pool Service", "Gutter Cleaning", "Landscaping", "Home Assistant",
];

const PROVIDER_BENEFITS = [
  {
    icon: Calendar,
    title: "Recurring routes, not random gigs",
    desc: "Get assigned a consistent weekly route with the same customers. No more door-to-door hustling for new work.",
  },
  {
    icon: DollarSign,
    title: "Weekly payouts, no payment chasing",
    desc: "We handle all billing and collections. You get paid every Friday for completed work. No invoicing, no awkward conversations.",
  },
  {
    icon: MapPin,
    title: "Dense routes, less driving",
    desc: "Our zone system clusters customers geographically. More stops per hour, less time on the road, more money in your pocket.",
  },
  {
    icon: Shield,
    title: "Keep your existing customers",
    desc: "Bring Your Own Customers (BYOC) — invite your current clients onto the platform. You keep serving them, plus earn bonuses for every one who signs up.",
  },
  {
    icon: TrendingUp,
    title: "Grow without selling",
    desc: "We fill your schedule with new customers. No marketing, no cold calling. Just show up, do great work, and we send you more.",
  },
  {
    icon: Zap,
    title: "Zero admin overhead",
    desc: "No scheduling, no invoicing, no payment collection, no customer service. We handle everything except the actual service.",
  },
];

export default function ProviderBrowse() {
  const navigate = useNavigate();
  const [zip, setZip] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleApply = () => {
    navigate("/auth?tab=signup&role=provider");
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleNotify = async () => {
    if (!email || zip.length < 5) {
      if (zip.length < 5) toast.error("Please enter a valid 5-digit ZIP code");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase.from("provider_leads") as any).insert({
        email,
        zip_code: zip,
        categories: selectedCategories,
        source: "browse",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="px-4 pt-12 pb-16 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Truck className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            More jobs. Less admin. <span className="text-primary">Better routes.</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join Handled Home as a service provider. Get recurring weekly routes, weekly payouts, and zero admin.
            We handle the customers, billing, and scheduling — you do what you do best.
          </p>
        </div>
        <Button size="lg" onClick={handleApply} className="px-8">
          Apply Now <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </section>

      {/* Earnings Calculator */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-2">What you could earn</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Based on $55 average payout per stop, 5 working days per week.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EARNINGS_EXAMPLES.map((ex) => (
              <Card key={ex.stops} className={ex.stops === 6 ? "border-primary ring-1 ring-primary/20" : ""}>
                <CardContent className="p-5 text-center space-y-2">
                  {ex.stops === 6 && <Badge className="text-[10px]">Most Common</Badge>}
                  <p className="text-sm text-muted-foreground">{ex.desc}</p>
                  <p className="text-3xl font-bold">{ex.weekly}</p>
                  <p className="text-xs text-muted-foreground">{ex.daily}/day • {ex.stops} stops</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Earnings vary by service type, zone, and route density. These are estimates based on current provider averages.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">Why providers love Handled Home</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROVIDER_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{benefit.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">How it works for providers</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Apply in 2 minutes", desc: "Tell us your service categories, coverage area, and experience. We review applications within 48 hours." },
              { step: "2", title: "Get your route", desc: "We assign you a weekly route with clustered stops in your zone. Same customers, same neighborhoods, every week." },
              { step: "3", title: "Do great work, get paid", desc: "Complete your stops, upload proof photos, and we deposit your earnings every Friday. No invoicing, no chasing payments." },
              { step: "4", title: "Grow with us", desc: "As we add customers in your zone, your route grows. Bring your own customers for bonus payouts. Top performers get priority for new zones." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-2">Service categories we support</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Apply for one or more categories. Multi-category providers earn more per route.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Badge key={cat} variant="outline" className="text-sm px-3 py-1.5">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* BYOC Section */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle>Already have customers? Bring them with you.</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Our Bring Your Own Customers (BYOC) program lets you invite your existing clients onto the platform.
                They get a better experience with proof photos, easy scheduling, and online payments.
                You keep serving them — plus earn <strong>$10/week per customer</strong> for the first 12 weeks.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-lg font-bold text-primary">$10/wk</p>
                  <p className="text-xs text-muted-foreground">per BYOC customer</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-lg font-bold text-primary">12 weeks</p>
                  <p className="text-xs text-muted-foreground">bonus window</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-lg font-bold text-primary">$2,160</p>
                  <p className="text-xs text-muted-foreground">max bonus (18 customers)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Notify Me / Lead Capture */}
      <section className="px-4 py-12">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h2 className="text-xl font-bold">Not ready to apply yet?</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email and ZIP code. We'll let you know when we're launching in your area
            — and if we need providers in your category, you'll be first in line.
          </p>
          {submitted ? (
            <div className="p-4 bg-primary/10 rounded-lg space-y-2 animate-fade-in">
              <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
              <p className="text-sm font-medium">You're on the list!</p>
              <p className="text-xs text-muted-foreground">We'll reach out when we're ready to launch in your area.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center h-11"
              />
              <Input
                placeholder="ZIP code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="text-center h-11"
                maxLength={5}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">What services do you offer? (optional)</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <Badge
                      key={cat}
                      variant={selectedCategories.includes(cat) ? "default" : "outline"}
                      className="cursor-pointer text-xs px-2.5 py-1 transition-colors"
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleNotify} disabled={!email || zip.length < 5 || submitting}>
                {submitting ? "Submitting..." : "Notify Me When You Launch"}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 text-center space-y-4 bg-muted/30">
        <h2 className="text-2xl font-bold">Ready to earn more with less hassle?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Join the providers who stopped chasing customers and started building recurring routes.
        </p>
        <Button size="lg" onClick={handleApply} className="px-8">
          Apply Now <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground">Free to join. No monthly fees. Apply in 2 minutes.</p>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Handled Home</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/browse" className="hover:text-foreground transition-colors">For Homeowners</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
