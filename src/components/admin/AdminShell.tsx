import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { useOpsExceptionCount } from "@/hooks/useOpsExceptions";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminSearchDialog } from "@/components/admin/AdminSearchDialog";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  Package, CreditCard, Layers, SlidersHorizontal, Scale,
  DollarSign, Wallet, Lock as LockIcon,
  Megaphone, TrendingUp,
  HelpCircle, FileText, BookOpen,
  Activity, Bell, MessageSquare, ToggleLeft,
  Settings, Rocket, GraduationCap, Calculator, FlaskConical, Mail,
  LogOut, ArrowLeftRight,
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
      { title: "Scheduling Policy", url: "/admin/scheduling/policy", icon: CalendarClock, roles: ["superuser", "ops"] },
      { title: "Planner", url: "/admin/scheduling/planner", icon: CalendarDays, roles: ["superuser", "ops"] },
      { title: "Assignments", url: "/admin/assignments", icon: Users, roles: ["superuser", "ops", "dispatcher"] },
      { title: "Assignment Config", url: "/admin/assignments/config", icon: SlidersHorizontal, roles: ["superuser", "ops"] },
      { title: "Window Templates", url: "/admin/scheduling/windows", icon: CalendarClock, roles: ["superuser", "ops"] },
      { title: "Scheduling Exceptions", url: "/admin/scheduling/exceptions", icon: CalendarClock, roles: ["superuser", "ops", "dispatcher"] },
      { title: "Job Exceptions", url: "/admin/exceptions", icon: AlertTriangle },
      { title: "Ops Console", url: "/admin/ops/exceptions", icon: Shield, roles: ["superuser", "ops", "dispatcher"] },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Customer Billing", url: "/admin/billing", icon: Users },
      { title: "Providers", url: "/admin/providers", icon: Shield },
      { title: "Accountability", url: "/admin/accountability", icon: AlertTriangle },
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
      { title: "SKU Calibration", url: "/admin/sku-calibration", icon: Scale },
      { title: "Level Analytics", url: "/admin/ops/levels", icon: SlidersHorizontal },
      { title: "Plans", url: "/admin/plans", icon: CreditCard },
      { title: "Routines", url: "/admin/routines", icon: Layers },
      { title: "Seasonal Bundles", url: "/admin/seasonal-bundles", icon: Layers },
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
      { title: "Provider Leads", url: "/admin/provider-leads", icon: Mail },
      { title: "Reports", url: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Support",
    items: [
      { title: "Tickets", url: "/admin/support", icon: HelpCircle },
      { title: "Policies", url: "/admin/support/policies", icon: FileText },
      { title: "Macros", url: "/admin/support/macros", icon: MessageSquare },
      { title: "Policy Simulator", url: "/admin/support/simulator", icon: FlaskConical },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Audit Log", url: "/admin/audit", icon: Activity },
      { title: "Cron Health", url: "/admin/cron-health", icon: Activity },
      { title: "Notification Health", url: "/admin/notification-health", icon: Bell },
      { title: "Feedback", url: "/admin/feedback", icon: MessageSquare },
      { title: "Test Toggles", url: "/admin/test-toggles", icon: ToggleLeft },
      { title: "Launch Readiness", url: "/admin/launch-readiness", icon: Rocket },
    ],
  },
  {
    label: "Control Room",
    roles: ["superuser"],
    items: [
      { title: "Pricing & Margin", url: "/admin/control/pricing", icon: DollarSign },
      { title: "Payout Rules", url: "/admin/control/payouts", icon: Wallet },
      { title: "Change Requests", url: "/admin/control/change-requests", icon: FileText },
      { title: "Change Log", url: "/admin/control/change-log", icon: FileText },
    ],
  },
  {
    label: "Academy",
    items: [
      { title: "Training Center", url: "/admin/academy", icon: GraduationCap },
      { title: "SOPs & Playbooks", url: "/admin/playbooks", icon: BookOpen },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Market Simulator", url: "/admin/simulator", icon: Calculator },
    ],
  },
];

function AdminSidebar() {
  const { adminRole } = useAdminMembership();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: exceptionCount } = useOpsExceptionCount();

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
      <SidebarHeader className="px-4 py-3 flex items-center justify-center bg-sidebar">
        {!collapsed && (
          <span className="font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-xl select-none">
            <span className="text-white">Handled</span>
            <span className="text-sidebar-primary">Home</span>
          </span>
        )}
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
                          {item.url === "/admin/ops/exceptions" && exceptionCount && exceptionCount > 0 ? (
                            <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-5 px-1 justify-center">
                              {exceptionCount > 99 ? "99+" : exceptionCount}
                            </Badge>
                          ) : null}
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
      <AdminSidebarFooter collapsed={collapsed} />
    </Sidebar>
  );
}

function AdminSidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { user, roles, signOut, setActiveRole } = useAuth();
  const otherRoles = roles.filter((r) => r !== "admin");

  return (
    <SidebarFooter className="border-t border-sidebar-border p-2">
      {!collapsed && user && (
        <p className="text-[11px] text-sidebar-foreground/50 truncate px-2 mb-1">
          {user.email}
        </p>
      )}
      <SidebarMenu>
        {otherRoles.length > 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveRole(otherRoles[0])}
              className="hover:bg-sidebar-accent/50 text-sm py-1.5"
            >
              <ArrowLeftRight className="mr-2 h-4 w-4 shrink-0" />
              {!collapsed && <span>Switch to {otherRoles[0]}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => signOut()}
            className="hover:bg-sidebar-accent/50 text-sm py-1.5 text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4 shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

function AdminCommandBar() {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center px-4 gap-3">
      <SidebarTrigger className="shrink-0" />
      <div className="flex-1 flex items-center gap-2">
        <AdminSearchDialog />
      </div>
      <NotificationBell />
    </header>
  );
}

export function AdminShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <a href="#main-content" className="skip-nav">Skip to main content</a>
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminCommandBar />
          <main id="main-content" className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
