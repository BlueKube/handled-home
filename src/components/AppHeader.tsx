import logo from "@/assets/handled-home-logo-no-roof.png";
import { NotificationBell } from "./NotificationBell";

export function AppHeader() {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 safe-top relative">
      <div className="flex-1" />
      <img src={logo} alt="Handled Home" className="h-8 w-auto" />
      <div className="flex-1 flex justify-end">
        <NotificationBell />
      </div>
    </header>
  );
}
