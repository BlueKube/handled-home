import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/handled-home-logo.png";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Account created! Redirecting..." });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 safe-top animate-fade-in">
      {/* Logo & tagline */}
      <div className="pt-16 pb-10 flex flex-col items-center">
        <img src={logo} alt="Handled Home" className="h-16 w-auto mb-4" />
        <p className="text-muted-foreground text-sm">Your home is handled.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-secondary rounded-full p-1 mb-8 mx-auto w-full max-w-xs">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-colors ${
            tab === "login"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Log In
        </button>
        <button
          onClick={() => setTab("signup")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-colors ${
            tab === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Forms */}
      {tab === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4 w-full max-w-sm mx-auto">
          <div>
            <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="h-12 mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="h-12 mt-1.5 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4 w-full max-w-sm mx-auto">
          <div>
            <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
            <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="h-12 mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
            <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="h-12 mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
            <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="h-12 mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="signup-role" className="text-sm font-medium">Role (dev)</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-12 mt-1.5 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      )}
    </div>
  );
}
