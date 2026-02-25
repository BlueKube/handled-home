import logo from "@/assets/handled-home-logo.png";
import { NotificationBell } from "./NotificationBell";

export function AppHeader() {
  return (
    <header className="h-12 bg-card border-b border-border flex items-center px-4 safe-top relative">
      <div className="flex-1" />
      <img src={logo} alt="Handled Home" className="h-7 w-auto" />
      <div className="flex-1 flex justify-end">
        <NotificationBell />
      </div>
    </header>
  );
}
