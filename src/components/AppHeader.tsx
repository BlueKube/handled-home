import { NotificationBell } from "./NotificationBell";
import { AvatarDrawer } from "./AvatarDrawer";
import { useAuth } from "@/contexts/AuthContext";

export function AppHeader() {
  const { effectiveRole } = useAuth();

  return (
    <header className="h-12 bg-card/90 backdrop-blur-lg border-b border-border/50 flex items-center px-4 safe-top relative">
      <div className="flex-1" />
      <span className="font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-lg select-none">
        <span className="text-foreground">Handled</span>
        <span className="text-accent">Home</span>
      </span>
      <div className="flex-1 flex justify-end">
        {effectiveRole === "customer" ? <AvatarDrawer /> : <NotificationBell />}
      </div>
    </header>
  );
}
