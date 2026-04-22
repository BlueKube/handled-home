import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Bell, CreditCard, Wallet, Zap, Settings, Users, HelpCircle,
  LogOut, Moon, Sun, ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { getInitials } from "@/lib/initials";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
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
import { NotificationPanel } from "@/components/NotificationPanel";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Plan", icon: CreditCard, path: "/customer/plans" },
  { label: "Billing", icon: Wallet, path: "/customer/billing" },
  { label: "Credits", icon: Zap, path: "/customer/credits" },
  { label: "Account", icon: Settings, path: "/customer/settings" },
  { label: "Referrals", icon: Users, path: "/customer/referrals" },
  { label: "Help & support", icon: HelpCircle, path: "/customer/support" },
];

export function AvatarDrawer() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const notificationsData = useNotifications();
  const { unreadCount } = notificationsData;

  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("drawer") !== "true") return;
    const next = new URLSearchParams(searchParams);
    next.delete("drawer");
    setSearchParams(next, { replace: true });
    if (!autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setOpen(true);
    }
  }, [searchParams, setSearchParams]);

  const initials = getInitials(profile?.full_name, user?.email);
  const displayName = profile?.full_name || user?.email || "Your account";

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setOpen(false);
      navigate("/auth");
    } catch {
      toast.error("Sign out failed. Please try again.");
      setSigningOut(false);
    }
  };

  const unreadDisplay = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Account menu${unreadCount > 0 ? `, ${unreadCount} unread notifications` : ""}`}
        className="relative h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-semibold transition-colors hover:bg-accent/25 active:scale-95"
      >
        {initials}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
          >
            {unreadDisplay}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-md">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="h-12 w-12 rounded-full bg-accent/15 text-accent flex items-center justify-center text-base font-semibold"
              >
                {initials}
              </div>
              <div className="min-w-0 text-left">
                <SheetTitle className="truncate text-base">{displayName}</SheetTitle>
                {profile?.full_name && user?.email && (
                  <SheetDescription className="truncate text-xs">{user.email}</SheetDescription>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-8">
            <button
              onClick={() => setNotificationsOpen(true)}
              className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-secondary/50 active:bg-secondary transition-colors"
            >
              <Bell className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "You're all caught up"}
                </div>
              </div>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
                  {unreadDisplay}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </button>

            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-left text-foreground hover:bg-secondary/50 active:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <button
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  aria-pressed={isDark}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-left text-foreground hover:bg-secondary/50 active:bg-secondary transition-colors rounded-xl"
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium flex-1">
                    {isDark ? "Light mode" : "Dark mode"}
                  </span>
                  <Switch checked={isDark} className="pointer-events-none" />
                </button>
              </CardContent>
            </Card>

            <AlertDialog>
              <Card className="border-destructive/20">
                <CardContent className="p-0">
                  <AlertDialogTrigger asChild>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-left text-destructive hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </AlertDialogTrigger>
                </CardContent>
              </Card>
              <AlertDialogContent onEscapeKeyDown={(e) => e.stopPropagation()}>
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
                    {signingOut ? "Signing out…" : "Sign out"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetContent>
      </Sheet>

      <NotificationPanel
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notificationsData={notificationsData}
      />
    </>
  );
}
