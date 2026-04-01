import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGrowthEvents } from "@/hooks/useGrowthEvents";
import { Home, Wrench } from "lucide-react";

type SignupRole = "customer" | "provider";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>("customer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const shareCode = searchParams.get("share");
  const rawRedirect = searchParams.get("redirect");
  // Validate redirect is a relative path to prevent open redirect attacks
  const redirectTo = rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : null;
  const { toast } = useToast();
  const { recordEvent } = useGrowthEvents();

  const isByocInvite = redirectTo?.includes("/byoc/activate/");

  // If arriving with a ref, redirect, or BYOC invite, default to signup tab
  useEffect(() => {
    if (refCode || isByocInvite) setTab("signup");
  }, [refCode, isByocInvite]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "Invalid email or password.", variant: "destructive" });
    } else {
      navigate(redirectTo || "/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullName.trim().length === 0) {
      toast({ title: "Error", description: "Full name is required.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), intended_role: signupRole },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      const msg = error.message.toLowerCase().includes("already")
        ? "An account with this email already exists. Try logging in."
        : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
      return;
    }

    // Bootstrap is now handled automatically by AuthContext when it detects missing roles
    // A1: Wire referral attribution on signup
    if (refCode) {
      try {
        await supabase.rpc("attribute_referral_signup", { p_referral_code: refCode });
      } catch (e) {
        console.warn("Referral attribution failed:", e);
      }
    }

    // Emit signup_completed growth event for funnel tracking
    try {
      recordEvent.mutate({
        eventType: "signup_completed",
        actorRole: signupRole,
        sourceSurface: refCode ? "provider_invite" : shareCode ? "receipt_share_card" : "organic",
        idempotencyKey: `signup_${email}_${Date.now()}`,
        context: {
          ...(refCode ? { ref_code: refCode } : {}),
          ...(shareCode ? { share_code: shareCode } : {}),
        },
      });
    } catch (e) {
      console.warn("Growth event failed:", e);
    }

    setLoading(false);
    toast({ title: "Success", description: "Account created! Redirecting..." });
    navigate(redirectTo || "/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 safe-top animate-fade-in">
      {/* Logo & tagline */}
      <div className="pt-16 pb-10 flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span style={{ color: 'hsl(220 20% 10%)' }}>Your home, </span>
          <span style={{ color: 'hsl(200 80% 50%)' }}>handled.</span>
        </h1>
      </div>

      {/* BYOC invite context banner */}
      {isByocInvite && (
        <div className="mx-auto w-full max-w-xs mb-4 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 text-center">
          <p className="text-sm font-medium text-foreground">You've been invited by your service provider</p>
          <p className="text-xs text-muted-foreground mt-0.5">Create an account to activate your invite</p>
        </div>
      )}

      {/* Tab switcher */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="mb-8 mx-auto w-full max-w-xs">
        <TabsList className="w-full rounded-full">
          <TabsTrigger value="login" className="flex-1 rounded-full">Log In</TabsTrigger>
          <TabsTrigger value="signup" className="flex-1 rounded-full">Sign Up</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Forms */}
      {tab === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4 w-full max-w-sm mx-auto">
          <div>
            <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
            <Input id="login-email" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required
              disabled={loading} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
            <Input id="login-password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
              disabled={loading} className="mt-1.5" />
          </div>
          <Button type="submit" variant="accent" size="xl" className="w-full" loading={loading}>
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <button type="button" className="underline" onClick={async () => {
              if (!email) { toast({ title: "Enter your email", description: "Type your email address above, then click Forgot password.", variant: "destructive" }); return; }
              const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
              if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
              toast({ title: "Check your email", description: "We sent a password reset link to " + email + "." });
            }}>
              Forgot password?
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4 w-full max-w-sm mx-auto">
          {/* Role selection */}
          <fieldset className="space-y-2" disabled={loading}>
            <Label className="text-sm font-medium">I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSignupRole("customer")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-colors ${
                  signupRole === "customer"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Home className="h-6 w-6" />
                Homeowner
              </button>
              <button
                type="button"
                onClick={() => setSignupRole("provider")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-colors ${
                  signupRole === "provider"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Wrench className="h-6 w-6" />
                Service Provider
              </button>
            </div>
          </fieldset>

          <div>
            <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
            <Input id="signup-name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required
              disabled={loading} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
            <Input id="signup-email" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required
              disabled={loading} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
            <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              minLength={8} disabled={loading} className="mt-1.5" placeholder="Min. 8 characters" />
          </div>
          <div>
            <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm Password</Label>
            <Input id="signup-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              minLength={8} disabled={loading} className="mt-1.5" />
          </div>
          <Button type="submit" variant="accent" size="xl" className="w-full" loading={loading}>
            Create Account
          </Button>
        </form>
      )}
      {/* Legal footer */}
      <div className="flex justify-center gap-4 mt-6 text-xs text-muted-foreground">
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
      </div>
    </div>
  );
}
