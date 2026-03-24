import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import {
  MapPin, Wallet, Users, HelpCircle, Settings,
  Building2, Package, Map, UserPlus,
  CreditCard, CalendarDays, Megaphone, FileText, Lock,
  LogOut, Moon, Sun, TrendingUp, ChevronRight, BarChart3,
  AlertTriangle, Banknote, Clock,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { RoleSwitcher } from "@/components/settings/RoleSwitcher";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const customerSections: MenuSection[] = [
  {
    title: "Account",
    items: [
      { label: "Plans & Subscription", icon: CreditCard, path: "/customer/plans" },
      { label: "Property", icon: MapPin, path: "/customer/property" },
      { label: "Billing", icon: Wallet, path: "/customer/billing" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Referrals", icon: Users, path: "/customer/referrals" },
      { label: "Recommend a Provider", icon: UserPlus, path: "/customer/recommend-provider" },
      { label: "Support", icon: HelpCircle, path: "/customer/support" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Settings", icon: Settings, path: "/customer/settings" },
    ],
  },
];

const providerSections: MenuSection[] = [
  {
    title: "Business",
    items: [
      { label: "Organization", icon: Building2, path: "/provider/organization" },
      { label: "Coverage & Availability", icon: Map, path: "/provider/coverage" },
    ],
  },
  {
    title: "Growth",
    items: [
      { label: "BYOC Center", icon: UserPlus, path: "/provider/byoc" },
      { label: "Referrals", icon: Users, path: "/provider/referrals" },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Support", icon: HelpCircle, path: "/provider/support" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Settings", icon: Settings, path: "/provider/settings" },
    ],
  },
];

const adminSections: MenuSection[] = [
  {
    title: "Operations",
    items: [
      { label: "Capacity", icon: BarChart3, path: "/admin/capacity" },
      { label: "Service Days", icon: CalendarDays, path: "/admin/service-days" },
      { label: "Scheduling", icon: Clock, path: "/admin/scheduling" },
      { label: "Exceptions", icon: AlertTriangle, path: "/admin/exceptions" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Billing", icon: CreditCard, path: "/admin/billing" },
      { label: "Payouts", icon: Banknote, path: "/admin/payouts" },
      { label: "Plans", icon: CreditCard, path: "/admin/plans" },
      { label: "Bundles", icon: Package, path: "/admin/bundles" },
    ],
  },
  {
    title: "Growth & Insights",
    items: [
      { label: "Incentives", icon: Megaphone, path: "/admin/incentives" },
      { label: "Growth", icon: TrendingUp, path: "/admin/growth" },
      { label: "Reports", icon: FileText, path: "/admin/reports" },
      { label: "Support", icon: HelpCircle, path: "/admin/support" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Audit Logs", icon: Lock, path: "/admin/audit" },
      { label: "Settings", icon: Settings, path: "/admin/settings" },
    ],
  },
];

const sectionsByRole: Record<AppRole, MenuSection[]> = {
  customer: customerSections,
  provider: providerSections,
  admin: adminSections,
};

export default function MoreMenuPage() {
  const { effectiveRole, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const sections = sectionsByRole[effectiveRole] ?? customerSections;
  const { theme, setTheme } = useTheme();

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/auth");
    } catch {
      toast.error("Sign out failed. Please try again.");
      setSigningOut(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 mx-auto animate-fade-in space-y-5">
      <h1 className="text-h2">More</h1>

      {roles.length > 1 && (
        <div>
          <RoleSwitcher />
        </div>
      )}

      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {section.title}
          </h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-left text-foreground hover:bg-secondary/50 active:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          Appearance
        </h2>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-pressed={theme === "dark"}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left text-foreground hover:bg-secondary/50 active:bg-secondary transition-colors rounded-xl"
            >
              {theme === "dark" ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
              <span className="font-medium flex-1">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              <Switch checked={theme === "dark"} className="pointer-events-none" />
            </button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog>
        <Card className="border-destructive/20">
          <CardContent className="p-0">
            <AlertDialogTrigger asChild>
              <button
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-left text-destructive hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Sign Out</span>
              </button>
            </AlertDialogTrigger>
          </CardContent>
        </Card>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={signingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {signingOut ? "Signing out…" : "Sign Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
