import {
  Home, CalendarDays, History, CreditCard, MapPin, Wallet, Users, HelpCircle, Settings,
  Briefcase, DollarSign, BarChart3, Building2, Map,
  LayoutDashboard, Globe, Gauge, Package, ListChecks, Shield, Megaphone, FileText, Lock
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from "@/components/ui/sidebar";
import logo from "@/assets/handled-home-logo.png";

const customerNav = [
  { title: "Dashboard", url: "/customer", icon: Home },
  { title: "Build Service Day", url: "/customer/build", icon: CalendarDays },
  { title: "Service History", url: "/customer/history", icon: History },
  { title: "Subscription", url: "/customer/subscription", icon: CreditCard },
  { title: "Property", url: "/customer/property", icon: MapPin },
  { title: "Billing", url: "/customer/billing", icon: Wallet },
  { title: "Referrals", url: "/customer/referrals", icon: Users },
  { title: "Support", url: "/customer/support", icon: HelpCircle },
  { title: "Settings", url: "/customer/settings", icon: Settings },
];

const providerNav = [
  { title: "Dashboard", url: "/provider", icon: Briefcase },
  { title: "My Jobs", url: "/provider/jobs", icon: ListChecks },
  { title: "Earnings", url: "/provider/earnings", icon: DollarSign },
  { title: "Performance", url: "/provider/performance", icon: BarChart3 },
  { title: "Organization", url: "/provider/organization", icon: Building2 },
  { title: "Coverage", url: "/provider/coverage", icon: Map },
  { title: "Settings", url: "/provider/settings", icon: Settings },
];

const adminNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Regions & Zones", url: "/admin/zones", icon: Globe },
  
  { title: "SKU Catalog", url: "/admin/skus", icon: Package },
  { title: "Plans", url: "/admin/plans", icon: CreditCard },
  { title: "Providers", url: "/admin/providers", icon: Shield },
  { title: "Scheduling", url: "/admin/scheduling", icon: CalendarDays },
  { title: "Support", url: "/admin/support", icon: HelpCircle },
  { title: "Incentives", url: "/admin/incentives", icon: Megaphone },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Audit Logs", url: "/admin/audit", icon: Lock },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const navByRole = { customer: customerNav, provider: providerNav, admin: adminNav };
const labelByRole = { customer: "Customer", provider: "Provider", admin: "Admin Console" };

export function AppSidebar() {
  const { activeRole } = useAuth();
  const items = navByRole[activeRole] ?? customerNav;
  const label = labelByRole[activeRole] ?? "Menu";

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-4 py-4 flex items-center justify-center">
        <img src={logo} alt="Handled Home" className="h-10 w-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-xs tracking-wider">
            {label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === `/customer` || item.url === `/provider` || item.url === `/admin`}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
