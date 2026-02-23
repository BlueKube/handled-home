import { useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import {
  MapPin, Wallet, Users, HelpCircle, Settings,
  Building2, Package,
  Gauge, CreditCard, CalendarDays, Megaphone, FileText, Lock,
  LogOut, Moon, Sun, TrendingUp,
} from "lucide-react";
import { useTheme } from "next-themes";
import { RoleSwitcher } from "@/components/settings/RoleSwitcher";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const customerMore: MenuItem[] = [
  { label: "Property", icon: MapPin, path: "/customer/property" },
  { label: "Billing", icon: Wallet, path: "/customer/billing" },
  { label: "Referrals", icon: Users, path: "/customer/referrals" },
  { label: "Support", icon: HelpCircle, path: "/customer/support" },
  { label: "Settings", icon: Settings, path: "/customer/settings" },
];

const providerMore: MenuItem[] = [
  { label: "Dashboard", icon: Building2, path: "/provider" },
  { label: "Organization", icon: Building2, path: "/provider/organization" },
  { label: "Support", icon: HelpCircle, path: "/provider/support" },
  { label: "Referrals", icon: Users, path: "/provider/referrals" },
  { label: "Settings", icon: Settings, path: "/provider/settings" },
];

const adminMore: MenuItem[] = [
  { label: "Billing", icon: CreditCard, path: "/admin/billing" },
  { label: "Payouts", icon: Gauge, path: "/admin/payouts" },
  { label: "Exceptions", icon: Gauge, path: "/admin/exceptions" },
  { label: "Capacity", icon: Gauge, path: "/admin/capacity" },
  { label: "Plans", icon: CreditCard, path: "/admin/plans" },
  { label: "Bundles", icon: Package, path: "/admin/bundles" },
  { label: "Service Days", icon: CalendarDays, path: "/admin/service-days" },
  { label: "Scheduling", icon: CalendarDays, path: "/admin/scheduling" },
  { label: "Support", icon: HelpCircle, path: "/admin/support" },
  { label: "Incentives", icon: Megaphone, path: "/admin/incentives" },
  { label: "Growth", icon: TrendingUp, path: "/admin/growth" },
  { label: "Reports", icon: FileText, path: "/admin/reports" },
  { label: "Audit Logs", icon: Lock, path: "/admin/audit" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const menuByRole: Record<AppRole, MenuItem[]> = {
  customer: customerMore,
  provider: providerMore,
  admin: adminMore,
};

export default function MoreMenuPage() {
  const { activeRole, signOut, roles, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const items = menuByRole[activeRole] ?? customerMore;
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">More</h1>

      {roles.length > 1 && (
        <div className="mb-6">
          <RoleSwitcher />
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-3 w-full px-3 py-3.5 rounded-xl text-left text-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border space-y-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 w-full px-3 py-3.5 rounded-xl text-left text-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
          <span className="font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-3.5 rounded-xl text-left text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
