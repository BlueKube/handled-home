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
  { label: "Service Day", icon: CalendarDays, path: "/customer/build" },
  { label: "History", icon: History, path: "/customer/history" },
  { label: "Subscription", icon: CreditCard, path: "/customer/subscription" },
  { label: "More", icon: MoreHorizontal, path: "/customer/more" },
];

const providerTabs: TabItem[] = [
  { label: "Jobs", icon: Briefcase, path: "/provider/jobs" },
  { label: "Earnings", icon: DollarSign, path: "/provider/earnings" },
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
  const { activeRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = tabsByRole[activeRole] ?? customerTabs;

  const isActive = (tab: TabItem) => {
    if (tab.path.endsWith("/more")) {
      // "More" is active if current path doesn't match any other tab
      const otherPaths = tabs.filter((t) => !t.path.endsWith("/more")).map((t) => t.path);
      return !otherPaths.some(
        (p) => location.pathname === p || (p !== `/${activeRole}` && location.pathname.startsWith(p))
      ) && location.pathname.startsWith(`/${activeRole}`);
    }
    if (tab.path === `/${activeRole}`) {
      return location.pathname === tab.path;
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-stretch justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors duration-150 active:scale-95 ${
                active ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
