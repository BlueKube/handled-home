import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { NotificationBell } from "@/components/NotificationBell";
import { NavLink } from "@/components/NavLink";
import logo from "@/assets/handled-home-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Gauge, ListChecks, CalendarDays, CalendarClock, AlertTriangle,
  Users, Shield, Globe, BarChart3, Map,
  Package, CreditCard, Layers,
  DollarSign, Wallet, Lock as LockIcon,
  Megaphone, TrendingUp,
  HelpCircle, FileText, BookOpen,
  Activity, Bell, MessageSquare, ToggleLeft,
  Settings, Search,
} from "lucide-react";
import type { AdminRole } from "@/hooks/useAdminMembership";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  /** If set, only these sub-roles see this item */
  roles?: AdminRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: AdminRole[];
}

const navGroups: NavGroup[] = [
  {
    label: "Cockpit",
    items: [
      { title: "Ops Cockpit", url: "/admin/ops", icon: Gauge },
      { title: "Dispatcher Queues", url: "/admin/ops/dispatch", icon: ListChecks },
    ],
  },
  {
    label: "Execution",
    items: [
      { title: "Jobs", url: "/admin/jobs", icon: ListChecks },
      { title: "Service Days", url: "/admin/service-days", icon: CalendarClock },
      { title: "Scheduling", url: "/admin/scheduling", icon: CalendarDays },
      { title: "Exceptions", url: "/admin/exceptions", icon: AlertTriangle },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Customer Billing", url: "/admin/billing", icon: Users },
      { title: "Providers", url: "/admin/providers", icon: Shield },
    ],
  },
  {
    label: "Markets",
    items: [
      { title: "Zones", url: "/admin/zones", icon: Globe },
      { title: "Capacity", url: "/admin/capacity", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "SKUs", url: "/admin/skus", icon: Package },
      { title: "Plans", url: "/admin/plans", icon: CreditCard },
      { title: "Bundles", url: "/admin/bundles", icon: Layers },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Billing", url: "/admin/ops/billing", icon: DollarSign },
      { title: "Payouts", url: "/admin/payouts", icon: Wallet },
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "Incentives", url: "/admin/incentives", icon: Megaphone },
      { title: "Growth", url: "/admin/growth", icon: TrendingUp },
    ],
  },
  {
    label: "Support",
    items: [
      { title: "Tickets", url: "/admin/support", icon: HelpCircle },
      { title: "Policies", url: "/admin/support/policies", icon: FileText },
      { title: "Macros", url: "/admin/support/macros", icon: MessageSquare },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Audit Log", url: "/admin/audit", icon: Activity },
      { title: "Notification Health", url: "/admin/notification-health", icon: Bell },
      { title: "Feedback", url: "/admin/feedback", icon: MessageSquare },
      { title: "Test Toggles", url: "/admin/test-toggles", icon: ToggleLeft },
    ],
  },
  {
    label: "Control Room",
    roles: ["superuser"],
    items: [
      { title: "Pricing & Margin", url: "/admin/control/pricing", icon: DollarSign },
      { title: "Payout Rules", url: "/admin/control/payouts", icon: Wallet },
      { title: "Change Log", url: "/admin/control/changes", icon: FileText },
    ],
  },
  {
    label: "Playbooks",
    items: [
      { title: "SOPs", url: "/admin/playbooks", icon: BookOpen },
    ],
  },
];

function AdminSidebar() {
  const { adminRole } = useAdminMembership();
  const location = useLocation();

  const isItemVisible = (item: NavItem) => {
    if (!item.roles) return true;
    if (!adminRole) return false;
    return item.roles.includes(adminRole);
  };

  const isGroupVisible = (group: NavGroup) => {
    if (!group.roles) return true;
    if (!adminRole) return false;
    return group.roles.includes(adminRole);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 py-3 flex items-center justify-center">
        <img src={logo} alt="Handled Home" className="h-8 w-auto" />
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        {navGroups.filter(isGroupVisible).map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/admin/ops"}
                          className="hover:bg-sidebar-accent/50 text-sm py-1.5"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* Settings at bottom */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin/settings"
                    className="hover:bg-sidebar-accent/50 text-sm py-1.5"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <Settings className="mr-2 h-4 w-4 shrink-0" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AdminCommandBar() {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center px-4 gap-3">
      <SidebarTrigger className="shrink-0" />
      <div className="flex-1 flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-sm text-muted-foreground max-w-xs w-full cursor-pointer hover:bg-muted transition-colors">
          <Search className="h-3.5 w-3.5" />
          <span>Search customers, providers, jobs…</span>
          <kbd className="ml-auto text-[10px] bg-background rounded px-1.5 py-0.5 border border-border font-mono">⌘K</kbd>
        </div>
      </div>
      <NotificationBell />
    </header>
  );
}

export function AdminShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminCommandBar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
