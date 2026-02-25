import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import {
  Home, CalendarDays, History, CreditCard, MoreHorizontal,
  Briefcase, DollarSign, BarChart3, Map,
  LayoutDashboard, Globe, Package, Shield,
} from "lucide-react";

interface TabItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const customerTabs: TabItem[] = [
  { label: "Home", icon: Home, path: "/customer" },
  { label: "Plans", icon: CreditCard, path: "/customer/plans" },
  { label: "Routine", icon: CalendarDays, path: "/customer/routine" },
  { label: "Visits", icon: History, path: "/customer/visits" },
  { label: "More", icon: MoreHorizontal, path: "/customer/more" },
];

const providerTabs: TabItem[] = [
  { label: "Jobs", icon: Briefcase, path: "/provider/jobs" },
  { label: "Payouts", icon: DollarSign, path: "/provider/payouts" },
  { label: "Performance", icon: BarChart3, path: "/provider/performance" },
  { label: "Coverage", icon: Map, path: "/provider/coverage" },
  { label: "More", icon: MoreHorizontal, path: "/provider/more" },
];

const adminTabs: TabItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Zones", icon: Globe, path: "/admin/zones" },
  { label: "SKUs", icon: Package, path: "/admin/skus" },
  { label: "Providers", icon: Shield, path: "/admin/providers" },
  { label: "More", icon: MoreHorizontal, path: "/admin/more" },
];

const tabsByRole: Record<AppRole, TabItem[]> = {
  customer: customerTabs,
  provider: providerTabs,
  admin: adminTabs,
};

export function BottomTabBar() {
  const { effectiveRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = tabsByRole[effectiveRole] ?? customerTabs;

  const isActive = (tab: TabItem) => {
    if (tab.path.endsWith("/more")) {
      const otherPaths = tabs.filter((t) => !t.path.endsWith("/more")).map((t) => t.path);
      return !otherPaths.some(
        (p) => location.pathname === p || (p !== `/${effectiveRole}` && location.pathname.startsWith(p))
      ) && location.pathname.startsWith(`/${effectiveRole}`);
    }
    if (tab.path === `/${effectiveRole}`) {
      return location.pathname === tab.path;
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border/50 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] safe-bottom">
      <div className="flex items-stretch justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-150 active:scale-90 ${
                active ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`h-5 w-5 transition-transform duration-150 ${active ? "stroke-[2.5] scale-110" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              {active && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
