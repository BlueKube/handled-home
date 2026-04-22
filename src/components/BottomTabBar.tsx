import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import {
  Home, Wrench, CalendarClock, HelpCircle,
  Briefcase, DollarSign, BarChart3, MoreHorizontal,
  LayoutDashboard, Globe, Package, Shield,
} from "lucide-react";
import { SnapFab } from "@/components/customer/SnapFab";

interface TabItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const customerTabs: TabItem[] = [
  { label: "Home", icon: Home, path: "/customer" },
  { label: "Services", icon: Wrench, path: "/customer/services" },
  { label: "Visits", icon: CalendarClock, path: "/customer/visits" },
  { label: "Help", icon: HelpCircle, path: "/customer/help" },
];

const providerTabs: TabItem[] = [
  { label: "Home", icon: Home, path: "/provider" },
  { label: "Jobs", icon: Briefcase, path: "/provider/jobs" },
  { label: "Earn", icon: DollarSign, path: "/provider/earnings" },
  { label: "Score", icon: BarChart3, path: "/provider/performance" },
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

/** Routes that should highlight a parent tab they don't prefix-match. */
const TAB_CHILD_PATHS: Record<string, string[]> = {
  "/customer/visits": ["/customer/visits/", "/customer/appointment/", "/customer/reschedule/", "/customer/schedule"],
  "/customer/services": ["/customer/routine"],
  "/customer/help": ["/customer/support"],
  "/provider/performance": ["/provider/quality"],
};

export function BottomTabBar() {
  const { effectiveRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (effectiveRole === "admin") return null;

  const tabs = tabsByRole[effectiveRole] ?? customerTabs;
  const isCustomer = effectiveRole === "customer";

  const isActive = (tab: TabItem) => {
    if (tab.path.endsWith("/more")) {
      const allPrefixes = tabs
        .filter((t) => !t.path.endsWith("/more"))
        .flatMap((t) => [t.path, ...(TAB_CHILD_PATHS[t.path] ?? [])]);
      return !allPrefixes.some(
        (p) => location.pathname === p || (p !== `/${effectiveRole}` && location.pathname.startsWith(p))
      ) && location.pathname.startsWith(`/${effectiveRole}`);
    }
    if (tab.path === `/${effectiveRole}`) {
      return location.pathname === tab.path;
    }
    return (
      location.pathname.startsWith(tab.path) ||
      (TAB_CHILD_PATHS[tab.path] ?? []).some((prefix) => location.pathname.startsWith(prefix))
    );
  };

  const tabButton = (tab: TabItem) => {
    const active = isActive(tab);
    return (
      <button
        key={tab.path}
        onClick={() => navigate(tab.path)}
        className={`relative flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-150 active:scale-90 ${
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
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border/50 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] safe-bottom">
      <div className="relative flex items-stretch justify-around h-14">
        {isCustomer ? (
          <>
            {tabButton(tabs[0])}
            {tabButton(tabs[1])}
            <div className="flex-1 flex items-stretch justify-center" aria-hidden="true" />
            {tabButton(tabs[2])}
            {tabButton(tabs[3])}
            <SnapFab />
          </>
        ) : (
          tabs.map((tab) => tabButton(tab))
        )}
      </div>
    </nav>
  );
}
