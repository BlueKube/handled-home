import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGrowthEvents } from "@/hooks/useGrowthEvents";
import logo from "@/assets/handled-home-logo.png";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const shareCode = searchParams.get("share");
  const { toast } = useToast();
  const { recordEvent } = useGrowthEvents();

  // If arriving with a ref code, default to signup tab
  useEffect(() => {
    if (refCode) setTab("signup");
  }, [refCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "Invalid email or password.", variant: "destructive" });
    } else {
      navigate("/");
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
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin,
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
        actorRole: "customer",
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
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 safe-top animate-fade-in">
      {/* Logo & tagline */}
      <div className="pt-16 pb-10 flex flex-col items-center">
        <img src={logo} alt="Handled Home" className="h-32 w-auto mb-4" />
        <p className="text-muted-foreground text-sm">Your home is handled.</p>
      </div>

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
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              disabled={loading} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              disabled={loading} className="mt-1.5" />
          </div>
          <Button type="submit" variant="accent" size="xl" className="w-full" loading={loading}>
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <button type="button" className="underline" onClick={() => toast({ title: "Coming soon", description: "Password reset is not yet available." })}>
              Forgot password?
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4 w-full max-w-sm mx-auto">
          <div>
            <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
            <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required
              disabled={loading} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
            <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
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
    </div>
  );
}
